import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAssistantHandler, BASE } from "./assistant/routes";
import { AssistantStore } from "./assistant/store";
import { TravelCache } from "./travel-cache";
import { TravelService } from "./travel-details";
import {
  AssistantClient,
  AssistantError,
  type AssistantMessage,
  type Conversation,
  type ConversationPage,
  type CountryContext,
  type MessageRequest,
  type ProfileResource,
} from "../src/frontend/assistantClient";
import { exampleProfile } from "../src/shared/assistant/fixtures";
import type { Schema } from "../src/shared/assistant/schema";
import type { Trip } from "../src/shared/assistant/schemas";
import type { Model } from "./assistant/groq";

function countryChatModel(): Model & { calls: number } {
  return {
    configured: true,
    model: "country-chat-fixture",
    calls: 0,
    async generate<T>(schema: Schema<T>, _prompt: string, _signal: AbortSignal) {
      this.calls++;
      return schema.parse({
        text: "Snapshot details remain unverified; review official sources before travel.",
        cards: [],
        claims: [],
        questions: [],
        actions: [],
        warnings: [],
      });
    },
    async search(_prompt: string, _signal: AbortSignal) {
      return { text: "Unused in this cache-only fixture.", sources: [], usage: {} };
    },
  };
}

test("Trips browser client uses real session/CSRF, complete map pagination, revisions, tasks and export without provider calls", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "aperiron-trips-client-"));
  let providerCalls = 0;
  const handler = createAssistantHandler({
    store: new AssistantStore(join(dir, "store.json")),
    allowedOrigins: ["http://localhost:5173"],
    travel: new TravelService(new TravelCache(join(dir, "travel"), 100), {
      apiKey: "test-only",
      fetchImpl: async () => {
        providerCalls++;
        throw new Error("Unexpected provider call");
      },
    }),
  });
  const server = createServer(handler.handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(dir, { recursive: true, force: true });
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}${BASE}`;
  let cookie = "",
    bootstraps = 0,
    pages = 0;
  const browserFetch: typeof fetch = async (input, init) => {
    if (String(input).endsWith("/sessions")) bootstraps++;
    if (String(input).endsWith("/destinations/query")) pages++;
    const headers = new Headers(init?.headers);
    headers.set("Origin", "http://localhost:5173");
    if (cookie) headers.set("Cookie", cookie);
    const response = await fetch(input, { ...init, headers });
    const received = response.headers.get("Set-Cookie");
    if (received) cookie = received.split(";")[0];
    return response;
  };
  const client = new AssistantClient(browserFetch, base);
  await Promise.all([client.connect(), client.connect()]);
  assert.equal(bootstraps, 1);
  const trip: Trip = {
    name: "Synthetic shared trip",
    travellers: [
      { id: "a", label: "A", profile: exampleProfile },
      { id: "b", label: "B", profile: { ...exampleProfile, passportId: "DE" } },
    ],
    departureDate: null,
    returnDate: null,
    durationDays: null,
    budget: null,
    shortlistCountryIds: ["JP"],
  };
  const created = await client.saveTrip(trip);
  assert.equal(created.revision, 1);
  assert.equal((await client.getTrip(created.id)).trip.name, trip.name);
  const result = await client.destinations(
    created,
    { regionIds: [], accessLevels: [], minimumStayDays: null },
    new AbortController().signal,
  );
  assert.equal(result.destinations.length, 199);
  assert.equal(
    new Set(result.destinations.map((r) => r.destinationId)).size,
    199,
  );
  assert.equal(pages, 4);
  const context = await client.context(
    created,
    "JP",
    new AbortController().signal,
  );
  assert.equal(context.travellers.length, 2);
  assert.ok(context.gaps.length);
  const updated = await client.saveTrip({ ...trip, name: "Changed" }, created);
  assert.equal(updated.revision, 2);
  await assert.rejects(
    client.saveTrip(trip, created),
    (e) => e instanceof AssistantError && e.code === "REVISION_CONFLICT",
  );
  const ref = {
    kind: "group",
    tripId: updated.id,
    tripRevision: updated.revision,
    destinationId: null,
  };
  const tasks = await client.job(
    "/checklists",
    { contextRef: ref, destinationIds: ["JP"] },
    new AbortController().signal,
  );
  assert.equal(tasks.type, "checklist");
  if (tasks.type === "checklist") {
    assert.ok(tasks.data.gaps.length);
    assert.ok(
      tasks.data.items.every((i) => i.requirementStatus === "suggested"),
    );
  }
  const brief = await client.job(
    "/briefs",
    {
      contextRef: ref,
      destinationIds: ["JP"],
      messageIds: [],
      includeChecklist: true,
      language: "en",
    },
    new AbortController().signal,
  );
  assert.equal(brief.type, "brief");
  if (brief.type === "brief") {
    const exported = await browserFetch(
      client.exportUrl(brief.data.id, "json"),
    );
    assert.equal(exported.status, 200);
    const body = await exported.json();
    assert.equal(body.staleContext, false);
    assert.ok(body.evidence.length);
  }
  const solo = await client.saveTrip({
    ...trip,
    travellers: [trip.travellers[0]],
  });
  const soloResults = await client.destinations(
    solo,
    { regionIds: [], accessLevels: [], minimumStayDays: null },
    new AbortController().signal,
  );
  const required = soloResults.destinations.find(
    (row) => row.destinationId === "US",
  );
  assert.equal(required?.travellers[0].accessLevel, "visa_required");
  assert.equal(
    required?.matches,
    false,
    "A one-person trip must use group matching defaults too",
  );
  assert.equal(required?.groupAssessment, "does_not_match");
  assert.equal(providerCalls, 0);
});

test("country-chat browser client bootstraps a profile, binds one country context, and returns a terminal message", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "aperiron-country-chat-client-"));
  let providerCalls = 0;
  const model = countryChatModel();
  const handler = createAssistantHandler({
    model,
    store: new AssistantStore(join(dir, "store.json")),
    allowedOrigins: ["http://localhost:5173"],
    travel: new TravelService(new TravelCache(join(dir, "travel"), 100), {
      apiKey: "test-only",
      fetchImpl: async () => {
        providerCalls++;
        throw new Error("Cache-only country chat must not refresh Travel Buddy.");
      },
    }),
  });
  const server = createServer(handler.handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(dir, { recursive: true, force: true });
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}${BASE}`;
  let cookie = "";
  let bootstraps = 0;
  const browserFetch: typeof fetch = async (input, init) => {
    if (String(input).endsWith("/sessions")) bootstraps++;
    const headers = new Headers(init?.headers);
    headers.set("Origin", "http://localhost:5173");
    if (cookie) headers.set("Cookie", cookie);
    const response = await fetch(input, { ...init, headers });
    const received = response.headers.get("Set-Cookie");
    if (received) cookie = received.split(";")[0];
    return response;
  };
  const client = new AssistantClient(browserFetch, base);
  const signal = new AbortController().signal;

  await client.connect();
  const initial: ProfileResource = await client.getProfile();
  assert.equal(bootstraps, 1);
  assert.equal(initial.revision, 0);
  assert.equal(initial.profile, null);

  const saved: ProfileResource = await client.saveProfile(
    { ...exampleProfile, passportType: "ordinary", purpose: "tourism" },
    initial,
  );
  assert.equal(saved.revision, 1);
  assert.equal(saved.profile?.passportId, "IN");
  assert.equal(saved.profile?.passportType, "ordinary");
  assert.equal(saved.profile?.purpose, "tourism");

  const contextRef = {
    kind: "country" as const,
    destinationId: "JP",
    profileRevision: saved.revision,
  };
  const context: CountryContext = await client.countryContext(contextRef, signal);
  assert.deepEqual(context.contextRef, contextRef);
  assert.equal(context.supportedContext, true);

  const conversation: Conversation = await client.createConversation(contextRef, signal);
  const request: MessageRequest = {
    clientMessageId: randomUUID(),
    expectedConversationRevision: conversation.revision,
    contextRef,
    intent: "ask",
    text: "What remains unknown for ordinary tourism?",
    dataPolicy: { travelBuddy: "cache_only", research: "never" },
  };
  const answer: AssistantMessage = await client.sendConversationMessage(
    conversation.id,
    request,
    signal,
  );
  assert.equal(answer.role, "assistant");
  assert.deepEqual(answer.contextRef, contextRef);
  assert.match(answer.text, /unverified/i);

  const history: ConversationPage = await client.getConversation(
    conversation.id,
    signal,
  );
  assert.deepEqual(history.messages.map((message) => message.role), [
    "user",
    "assistant",
  ]);
  assert.equal(history.messages[0]?.text, request.text);
  assert.equal(providerCalls, 0);
  assert.equal(model.calls, 1);
});
