import assert from "node:assert/strict";
import test from "node:test";
import { answerBlocks, isDestinationDiscoveryQuestion } from "../src/components/CountryChatDrawer";

test("country chat researches destination-discovery questions but not entry questions", () => {
  assert.equal(isDestinationDiscoveryQuestion("What are the tourist places in Japan?"), true);
  assert.equal(isDestinationDiscoveryQuestion("What are the best things to do in Japan?"), true);
  assert.equal(isDestinationDiscoveryQuestion("Which landmarks should I see in Japan?"), true);
  assert.equal(isDestinationDiscoveryQuestion("Do I need a tourist visa for Japan?"), false);
  assert.equal(isDestinationDiscoveryQuestion("What documents do I need for an e-visa?"), false);
});

test("country chat formats Markdown bullets and numbered recommendations as lists", () => {
  assert.deepEqual(
    answerBlocks("### Places to consider\n1. **Kyoto** — historic temples and gardens\n2) **Naoshima** — contemporary art by the sea\n- **Nara** — deer park and early Buddhist sites"),
    [
      { type: "heading", text: "Places to consider" },
      {
        type: "list",
        items: [
          "**Kyoto** — historic temples and gardens",
          "**Naoshima** — contemporary art by the sea",
          "**Nara** — deer park and early Buddhist sites",
        ],
      },
    ],
  );
});

test("country chat converts a provider Markdown table into a cited recommendation list", () => {
  const blocks = answerBlocks("| Attraction | Why it’s worth visiting | | --- | --- | | **Fushimi Inari Taisha (Kyoto)**【3†L5-L10】 | Thousands of torii gates on a mountain trail. | | **Tokyo Tower (Tokyo)** | Panoramic views over the city. | These sites are listed by the official tourism organisation.【3†L5-L10]");

  assert.deepEqual(blocks.slice(0, 2), [
    { type: "heading", text: "Places to consider" },
    {
      type: "list",
      items: [
        "**Fushimi Inari Taisha (Kyoto)** — Thousands of torii gates on a mountain trail.",
        "**Tokyo Tower (Tokyo)** — Panoramic views over the city.",
      ],
    },
  ]);
  assert.equal(blocks.at(-1)?.type, "paragraph");
  assert.doesNotMatch(JSON.stringify(blocks), /†|【|】/);
});
