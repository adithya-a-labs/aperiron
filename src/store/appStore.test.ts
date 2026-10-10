import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { useAppStore } from "./appStore";
import { engine, catalog } from "../frontend/engine";
import { BASELINE_ACCESS_MATRIX } from "../data/baselineMatrix";
import { INITIAL_WORLD_STATE, type Result } from "../shared/contracts";
function value<T>(result: Result<T>): T {

  if (!result.success) throw Error(result.error.message);
  return result.data;
}
beforeEach(() =>
  useAppStore.setState({
    passport: "IN",
    comparison: "DE",
    destination: "JP",
    world: INITIAL_WORLD_STATE,
    notice: "",
  }),
);

test("full catalog maps every passport/destination to the supplied matrix", () => {
  assert.equal(catalog.passports.length, 12);
  assert.equal(catalog.destinations.length, 30);
  for (const passport of catalog.passports) {
    const view = value(
      engine.getPassportView(passport.id, INITIAL_WORLD_STATE),
    );
    for (const destination of view.destinations)
      assert.equal(
        destination.accessLevel,
        BASELINE_ACCESS_MATRIX[passport.id][destination.destinationId],
      );
  }
});
test("passport changes retain destination and reject invalid selections", () => {
  useAppStore.getState().setPassport("SG");
  assert.equal(useAppStore.getState().destination, "JP");
  useAppStore.getState().setPassport("invalid");
  useAppStore.getState().setDestination("invalid");
  assert.equal(useAppStore.getState().passport, "SG");
  assert.equal(useAppStore.getState().destination, "JP");
});
test("preview is immutable; purchase updates views, DNA, impact and reset", () => {
  const treaty = catalog.treaties.find(
    (t) => t.id === "treaty-in-jp-fasttrack",
  )!;
  const before = JSON.stringify(INITIAL_WORLD_STATE);
  const dna = value(engine.generateVisaDNA("IN", INITIAL_WORLD_STATE));
  const preview = value(engine.purchaseTreaty(INITIAL_WORLD_STATE, treaty.id));
  assert.equal(JSON.stringify(useAppStore.getState().world), before);
  useAppStore.getState().purchase(treaty.id);
  const state = useAppStore.getState().world;
  assert.deepEqual(state, preview.nextState);
  assert.equal(state.creditsRemaining, 100 - treaty.cost);
  assert.equal(
    value(engine.getPassportView("IN", state)).destinations.find(
      (d) => d.destinationId === "JP",
    )!.accessLevel,
    "visa_on_arrival",
  );
  assert.notEqual(value(engine.generateVisaDNA("IN", state)).hash, dna.hash);
  assert.deepEqual(
    value(engine.calculateImpact(INITIAL_WORLD_STATE, state)),
    preview.impact,
  );
  assert.equal(JSON.stringify(INITIAL_WORLD_STATE), before);
  useAppStore.getState().reset();
  assert.deepEqual(useAppStore.getState().world, INITIAL_WORLD_STATE);
});
test("duplicate, invalid, and unaffordable purchases preserve state", () => {
  useAppStore.getState().purchase(catalog.treaties[0].id);
  const state = useAppStore.getState().world;
  useAppStore.getState().purchase(catalog.treaties[0].id);
  assert.equal(useAppStore.getState().world, state);
  useAppStore.getState().purchase("missing");
  assert.equal(useAppStore.getState().world, state);
  useAppStore.setState({
    world: { creditsRemaining: 0, purchasedTreatyIds: [] },
  });
  const empty = useAppStore.getState().world;
  useAppStore.getState().purchase(catalog.treaties[0].id);
  assert.equal(useAppStore.getState().world, empty);
});
test("optimizer stays within budget, leaves store untouched and reports actual projected impact", () => {
  for (const budget of [1, 20, 60, 100]) {
    const result = value(engine.optimizeTreaties(INITIAL_WORLD_STATE, budget));
    assert.ok(result.totalCost <= budget);
    assert.equal(
      new Set(result.recommendedTreatyIds).size,
      result.recommendedTreatyIds.length,
    );
    let projected = INITIAL_WORLD_STATE;
    for (const id of result.recommendedTreatyIds)
      projected = value(engine.purchaseTreaty(projected, id)).nextState;
    assert.deepEqual(
      value(engine.calculateImpact(INITIAL_WORLD_STATE, projected)),
      result.projectedImpact,
    );
    assert.deepEqual(useAppStore.getState().world, INITIAL_WORLD_STATE);
  }
});
test("regulation lookup never fabricates fees, documents, verification or portals", () => {
  for (const purpose of [
    "tourism",
    "business",
    "transit",
    "conference",
  ] as const) {
    const data = value(
      engine.getDestinationRequirements({
        passportId: "IN",
        destinationId: "JP",
        travellerContext: { purpose },
      }),
    );
    assert.equal(data.purpose, purpose);
    assert.equal(data.accessLevel, purpose === "tourism" ? BASELINE_ACCESS_MATRIX.IN.JP : "unknown");
    assert.equal(data.maxStayDays, null);
    assert.equal(data.fees, undefined);
    assert.equal(data.processingTime, undefined);
    assert.equal(data.applicationChannel.url, undefined);
    assert.equal(data.verifiedAt, "");
    assert.deepEqual(data.documents, []);
    assert.equal(data.sources.length, purpose === "tourism" ? 1 : 0);
    assert.ok(data.sources.every((source) => source.verifiedAt === ""));
  }
  assert.equal(
    engine.getDestinationRequirements({
      passportId: "invalid",
      destinationId: "JP",
    }).success,
    false,
  );
});
test("comparison and DNA use the same stable engine state", () => {
  const result = value(
    engine.comparePassports("IN", "IN", INITIAL_WORLD_STATE),
  );
  assert.deepEqual(result.onlyA, []);
  assert.deepEqual(result.onlyB, []);
  assert.deepEqual(result.differences, []);
  assert.deepEqual(
    engine.generateVisaDNA("IN", INITIAL_WORLD_STATE),
    engine.generateVisaDNA("IN", INITIAL_WORLD_STATE),
  );
});
