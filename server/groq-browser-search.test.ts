import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { createResearchHandler, ResearchRequestError, researchWithGroq, validateResearchRequest } from "./groq-browser-search";
import { isResearchResponse } from "../src/shared/research";

test("research accepts only canonical catalog selections", () => {
  assert.deepEqual(validateResearchRequest({ passportId: "IN", destinationId: "JP", purpose: "tourism" }), {
    passportId: "IN", destinationId: "JP", purpose: "tourism",
  });
  assert.deepEqual(validateResearchRequest({ passportId: "CN", destinationId: "IS", purpose: "tourism" }), { passportId: "CN", destinationId: "IS", purpose: "tourism" });
  assert.throws(() => validateResearchRequest({ passportId: "ZZ", destinationId: "JP", purpose: "tourism" }), ResearchRequestError);
  assert.throws(() => validateResearchRequest({ passportId: "IN", destinationId: "JP", purpose: "relocation" }), ResearchRequestError);
});

test("research uses GPT-OSS browser search without sending client-provided prose", async () => {
  let requestBody = "";
  const result = await researchWithGroq(
    { passportId: "IN", destinationId: "JP", purpose: "tourism" },
    async (_input, init) => {
      requestBody = String(init?.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: "Official-source research." } }] }), { status: 200 });
    },
    "test-key",
  );
  assert.match(requestBody, /openai\/gpt-oss-20b/);
  assert.match(requestBody, /browser_search/);
  assert.match(requestBody, /India/);
  assert.match(requestBody, /Japan/);
  const generation = JSON.parse(requestBody);
  assert.equal(generation.reasoning_effort, 'low');
  assert.equal(generation.max_completion_tokens, 2400);
  assert.equal(result.answer, "Official-source research.");
  assert.match(result.disclaimer, /Unverified web research/);
});

test("HTTP boundary handles success, malformed requests, and provider failures without leaking credentials", async (t) => {
  let upstreamCalls = 0;
  let upstreamStatus = 200;
  const server = createServer(createResearchHandler({
    apiKey: "private-test-key",
    fetchImpl: async (_input, init) => {
      upstreamCalls++;
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer private-test-key");
      assert.ok(init?.signal);
      return new Response(JSON.stringify(upstreamStatus === 200
        ? { choices: [{ message: { content: "Research with https://example.gov/" } }] }
        : { error: { message: "private-test-key must never be forwarded" } }), { status: upstreamStatus });
    },
  }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}/api/groq-research`;
  const post = (body: string) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const valid = JSON.stringify({ passportId: "IN", destinationId: "JP", purpose: "tourism" });
  const response = await post(valid);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.ok(isResearchResponse(body));
  assert.equal(JSON.stringify(body).includes("private-test-key"), false);
  for (const invalid of ["{", "null", JSON.stringify({ passportId: "ZZ", destinationId: "JP", purpose: "tourism" }), " ".repeat(9_000)]) {
    assert.equal((await post(invalid)).status, 400);
  }
  assert.equal(upstreamCalls, 1);
  assert.equal((await fetch(url)).status, 404);
  upstreamStatus = 401;
  const rejected = await post(valid);
  assert.equal(rejected.status, 503);
  assert.equal((await rejected.text()).includes("private-test-key"), false);
  upstreamStatus = 500;
  assert.equal((await post(valid)).status, 502);
  upstreamStatus = 429;
  assert.equal((await post(valid)).status, 429);
});

test("missing configuration and malformed upstream output fail cleanly", async () => {
  const request = validateResearchRequest({ passportId: "IN", destinationId: "JP", purpose: "tourism" });
  await assert.rejects(researchWithGroq(request, async () => { throw Error("Should not call upstream"); }, ""), /GROQ_API_KEY/);
  for (const payload of [null, { choices: [] }, { choices: [{ message: { content: {} } }] }]) {
    await assert.rejects(researchWithGroq(request, async () => new Response(JSON.stringify(payload)), "test-key"), /no research response/);
  }
  assert.equal(isResearchResponse(null), false);
  assert.equal(isResearchResponse({ answer: "text" }), false);
});

test('research preserves provider cooldowns and does not redispatch while allowance recovers', async t => {
  let calls = 0;
  const server = createServer(createResearchHandler({ apiKey: 'synthetic-secret', fetchImpl: async () => {
    calls++;
    return new Response('private provider message', { status: 429, headers: { 'Retry-After': '628' } });
  } }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  for (let i = 0; i < 2; i++) {
    const r: Response = await fetch(`http://127.0.0.1:${address.port}/api/groq-research`, {
      method: 'POST', body: JSON.stringify({ passportId: 'IN', destinationId: 'JP', purpose: 'tourism' }),
    });
    assert.equal(r.status, 429);
    assert.ok(Number(r.headers.get('Retry-After')) >= 627);
    const p = await r.json();
    assert.match(p.error, /11 minute/);
    assert.equal(p.error.includes('private provider'), false);
  }
  assert.equal(calls, 1, 'An explicit retry during cooldown must not call the provider again');
});

test('research reports an exhausted output budget without treating reasoning as an answer', async () => {
  await assert.rejects(researchWithGroq({ passportId: 'IN', destinationId: 'JP', purpose: 'tourism' },
    async () => Response.json({ choices: [{ finish_reason: 'length', message: { content: null, reasoning: 'internal reasoning only' } }] }), 'synthetic-key'),
  /response limit before producing an answer/);
});
