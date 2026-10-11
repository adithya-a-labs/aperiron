import { test } from "node:test";
import assert from "node:assert/strict";
import { createTripPlannerStore, initialFilters } from "./tripPlannerStore";
import {
  AssistantClient,
  AssistantError,
  type GroupResult,
  type TripResource,
  type GroupContext,
  type Job,
} from "../frontend/assistantClient";
import { exampleProfile } from "../shared/assistant/fixtures";
import type { Trip } from "../shared/assistant/schemas";

const trip: Trip = {
  name: "Synthetic trip",
  travellers: [{ id: "a", label: "A", profile: exampleProfile }],
  departureDate: null,
  returnDate: null,
  durationDays: null,
  budget: null,
  shortlistCountryIds: [],
};
const resource: TripResource = {
  id: "trip_test",
  trip,
  revision: 1,
  createdAt: "2026-10-11",
  updatedAt: "2026-10-11",
};
const result = (version: string): GroupResult => ({
  datasetVersion: version,
  basis: "snapshot",
  destinations: [],
  total: 0,
  accessBreakdown: {},
  unassessedCount: 0,
  unsupportedConstraints: [],
  nextCursor: null,
});
const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { resolve, promise };
};
const persistence = {
  readId: () => null,
  remember: (_id: string | null) => {},
};

test("group results ignore old responses after a filter change even if transport ignores abort", async () => {
  const first = deferred<GroupResult>(),
    second = deferred<GroupResult>();
  let calls = 0;
  class Client extends AssistantClient {
    override destinations() {
      return calls++ === 0 ? first.promise : second.promise;
    }
  }
  const store = createTripPlannerStore(new Client(), persistence);
  store.setState({ resource });
  const a = store.getState().query();
  const b = store.getState().query({ ...initialFilters, regionIds: ["asia"] });
  second.resolve(result("new"));
  await b;
  first.resolve(result("old"));
  await a;
  assert.equal(store.getState().result?.datasetVersion, "new");
  assert.equal(store.getState().querying, false);
});

test("country context cannot cross destination selections", async () => {
  const first = deferred<GroupContext>(),
    second = deferred<GroupContext>();
  let calls = 0;
  class Client extends AssistantClient {
    override context() {
      return calls++ === 0 ? first.promise : second.promise;
    }
  }
  const store = createTripPlannerStore(new Client(), persistence);
  store.setState({ resource });
  const a = store.getState().select("JP"),
    b = store.getState().select("FR");
  const context = (country: string): GroupContext => ({
    contextRef: {
      kind: "group",
      tripId: resource.id,
      tripRevision: 1,
      destinationId: country,
    },
    contextHash: country,
    travellers: [],
    evidence: [],
    gaps: [],
  });
  second.resolve(context("FR"));
  await b;
  first.resolve(context("JP"));
  await a;
  assert.equal(store.getState().context?.contextHash, "FR");
  assert.equal(store.getState().selected, "FR");
});

test("revision conflicts preserve the confirmed trip and do not replace it with unsaved edits", async () => {
  class Client extends AssistantClient {
    override async saveTrip(): Promise<TripResource> {
      throw new AssistantError(
        "Use the current revision.",
        "REVISION_CONFLICT",
        409,
      );
    }
  }
  const store = createTripPlannerStore(new Client(), persistence);
  store.setState({ resource });
  assert.equal(
    await store.getState().save({ ...trip, name: "Unsaved edit" }),
    false,
  );
  assert.equal(store.getState().resource?.trip.name, "Synthetic trip");
  assert.equal(store.getState().conflict, true);
  assert.equal(store.getState().saving, false);
});

test("expired stored trip offers a fresh setup without persisting traveller data", async () => {
  let remembered: string | null | undefined;
  class Client extends AssistantClient {
    override async connect() {}
    override async getTrip(): Promise<TripResource> {
      throw new AssistantError("Not found", "NOT_FOUND", 404);
    }
  }
  const store = createTripPlannerStore(new Client(), {
    readId: () => "trip_expired",
    remember: (id) => {
      remembered = id;
    },
  });
  await store.getState().initialize();
  assert.equal(store.getState().initialized, true);
  assert.equal(store.getState().resource, null);
  assert.equal(remembered, null);
  assert.match(store.getState().notice, /no longer available/);
});

test("a trip edit supersedes pending preparation results", async () => {
  const pending = deferred<NonNullable<Job["result"]>>();
  class Client extends AssistantClient {
    override job() {
      return pending.promise;
    }
    override async saveTrip(value: Trip) {
      return { ...resource, revision: 2, trip: value };
    }
    override async destinations() {
      return result("updated");
    }
  }
  const store = createTripPlannerStore(new Client(), persistence);
  store.setState({
    resource: { ...resource, trip: { ...trip, shortlistCountryIds: ["JP"] } },
  });
  const preparing = store.getState().prepare();
  assert.ok(store.getState().jobLabel);
  await store.getState().save({ ...trip, name: "New context" });
  pending.resolve({
    type: "checklist",
    data: {
      contextRef: {
        kind: "group",
        tripId: resource.id,
        tripRevision: 1,
        destinationId: null,
      },
      items: [],
      gaps: ["Old context"],
      createdAt: "2026-10-11",
    },
  });
  await preparing;
  assert.equal(store.getState().checklist, null);
  assert.equal(store.getState().resource?.revision, 2);
  assert.equal(store.getState().jobLabel, "");
});

test("expired session recovery saves the explicit draft as a new resource", async () => {
  let revisionArgument: TripResource | null | undefined;
  class Client extends AssistantClient {
    override async saveTrip(value: Trip, previous?: TripResource | null) {
      revisionArgument = previous;
      return { ...resource, id: "trip_new", trip: value };
    }
    override async destinations() {
      return result("new");
    }
  }
  let id: string | null = null;
  const store = createTripPlannerStore(new Client(), {
    readId: () => null,
    remember: (value) => {
      id = value;
    },
  });
  store.setState({ resource, sessionLost: true });
  assert.equal(
    await store.getState().saveCopy({ ...trip, name: "Kept draft" }),
    true,
  );
  assert.equal(revisionArgument, undefined);
  assert.equal(store.getState().resource?.trip.name, "Kept draft");
  assert.equal(store.getState().sessionLost, false);
  assert.equal(id, "trip_new");
});
