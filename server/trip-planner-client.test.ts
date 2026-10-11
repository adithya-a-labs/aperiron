import { test } from "node:test";
import assert from "node:assert/strict";
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
} from "../src/frontend/assistantClient";
import { exampleProfile } from "../src/shared/assistant/fixtures";
import type { Trip } from "../src/shared/assistant/schemas";

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
