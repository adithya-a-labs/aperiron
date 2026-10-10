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
  upstreamStatus = 429;
  assert.equal((await post(valid)).status, 429);
  upstreamStatus = 500;
  assert.equal((await post(valid)).status, 502);
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
