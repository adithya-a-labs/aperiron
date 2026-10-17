import assert from "node:assert/strict";
import test from "node:test";
import { isDestinationDiscoveryQuestion } from "../src/components/CountryChatDrawer";

test("country chat researches destination-discovery questions but not entry questions", () => {
  assert.equal(isDestinationDiscoveryQuestion("What are the tourist places in Japan?"), true);
  assert.equal(isDestinationDiscoveryQuestion("What are the best things to do in Japan?"), true);
  assert.equal(isDestinationDiscoveryQuestion("Which landmarks should I see in Japan?"), true);
  assert.equal(isDestinationDiscoveryQuestion("Do I need a tourist visa for Japan?"), false);
  assert.equal(isDestinationDiscoveryQuestion("What documents do I need for an e-visa?"), false);
});
