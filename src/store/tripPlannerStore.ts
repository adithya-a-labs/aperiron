import { create } from "zustand";
import {
  assistant,
  AssistantError,
  errorMessage,
  type AssistantClient,
  type TripResource,
  type GroupResult,
  type GroupContext,
  type Checklist,
  type Brief,
} from "../frontend/assistantClient";
import type { Trip, Filters } from "../shared/assistant/schemas";
import { record } from "../shared/travelDetails";

const storageKey = "aperiron.active-trip.v1";
const readId = () => {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};
const remember = (id: string | null) => {
  try {
    if (id) localStorage.setItem(storageKey, id);
    else localStorage.removeItem(storageKey);
  } catch {
    /* In-memory use still works. */
  }
};
export const initialFilters: Filters = {
  regionIds: [],
  accessLevels: [],
  minimumStayDays: null,
};
interface State {
  initialized: boolean;
  loading: boolean;
  saving: boolean;
  querying: boolean;
  contextLoading: boolean;
  resource: TripResource | null;
  result: GroupResult | null;
  context: GroupContext | null;
  selected: string;
  filters: Filters;
  error: string;
  conflict: boolean;
  sessionLost: boolean;
  notice: string;
  jobLabel: string;
  checklist: Checklist | null;
  brief: Brief | null;
  initialize(): Promise<void>;
  save(trip: Trip): Promise<boolean>;
  reload(): Promise<boolean>;
  saveCopy(trip?: Trip): Promise<boolean>;
  query(filters?: Filters): Promise<void>;
  select(id: string): Promise<void>;
  shortlist(id: string): Promise<void>;
  prepare(): Promise<void>;
  exportBrief(): Promise<void>;
  enrich(travellerId: string): Promise<void>;
  cancelJob(): void;
  clearError(): void;
}
export function createTripPlannerStore(
  client: AssistantClient = assistant,
  persistence = { readId, remember },
) {
  let queryController: AbortController | undefined,
    contextController: AbortController | undefined,
    jobController: AbortController | undefined;
  let init: Promise<void> | undefined;
  return create<State>((set, get) => {
    const fail = (error: unknown) =>
      set({
        error: errorMessage(error),
        conflict:
          error instanceof AssistantError &&
          ["REVISION_CONFLICT", "CONTEXT_CHANGED"].includes(error.code),
        sessionLost:
          error instanceof AssistantError && [401, 404].includes(error.status),
      });
    const invalidate = () => {
      queryController?.abort();
      contextController?.abort();
      jobController?.abort();
      set({
        result: null,
        context: null,
        checklist: null,
        brief: null,
        querying: false,
        contextLoading: false,
        jobLabel: "",
      });
    };
    const run = async (
      label: string,
      path: string,
      body: unknown,
      accept: (data: Awaited<ReturnType<AssistantClient["job"]>>) => void,
    ) => {
      if (get().jobLabel || get().saving) return;
      const resource = get().resource;
      if (!resource) return;
      const controller = new AbortController();
      jobController = controller;
      set({ jobLabel: label, error: "", notice: "" });
      try {
        const result = await client.job(path, body, controller.signal);
        if (
          !controller.signal.aborted &&
          get().resource?.id === resource.id &&
          get().resource?.revision === resource.revision
        )
          accept(result);
      } catch (error) {
        if (!controller.signal.aborted) fail(error);
      } finally {
        if (jobController === controller) {
          jobController = undefined;
          set({ jobLabel: "" });
        }
      }
    };
    const ref = () => ({
      kind: "group" as const,
      tripId: get().resource!.id,
      tripRevision: get().resource!.revision,
      destinationId: null,
    });
    return {
      initialized: false,
      loading: false,
      saving: false,
      querying: false,
      contextLoading: false,
      resource: null,
      result: null,
      context: null,
      selected: "",
      filters: initialFilters,
      error: "",
      conflict: false,
      sessionLost: false,
      notice: "",
      jobLabel: "",
      checklist: null,
      brief: null,
      initialize() {
        if (get().initialized) return Promise.resolve();
        init ??= (async () => {
          set({ loading: true, error: "" });
          try {
            await client.connect();
            const id = persistence.readId();
            if (id) {
              try {
                const resource = await client.getTrip(id);
                set({ resource });
              } catch (error) {
                if (
                  error instanceof AssistantError &&
                  [401, 404].includes(error.status)
                ) {
                  persistence.remember(null);
                  set({
                    notice:
                      "Your previous local trip is no longer available. Create a new trip to continue.",
                  });
                } else throw error;
              }
            }
            set({ initialized: true });
            if (get().resource) await get().query();
          } catch (error) {
            fail(error);
          } finally {
            set({ loading: false });
            init = undefined;
          }
        })();
        return init;
      },
      async save(trip) {
        if (get().saving) return false;
        set({ saving: true, error: "", conflict: false, notice: "" });
        try {
          const resource = await client.saveTrip(trip, get().resource);
          invalidate();
          persistence.remember(resource.id);
          set({
            resource,
            initialized: true,
            sessionLost: false,
            notice: "Trip saved.",
          });
          void get().query();
          if (get().selected) void get().select(get().selected);
          return true;
        } catch (error) {
          fail(error);
          return false;
        } finally {
          set({ saving: false });
        }
      },
      async reload() {
        const old = get().resource;
        if (!old || get().saving) return false;
        set({ loading: true, error: "" });
        try {
          const resource = await client.getTrip(old.id);
          invalidate();
          set({
            resource,
            conflict: false,
            notice: "Latest saved trip loaded. Your open draft is unchanged.",
          });
          void get().query();
          if (get().selected) void get().select(get().selected);
          return true;
        } catch (error) {
          fail(error);
          return false;
        } finally {
          set({ loading: false });
        }
      },
      async saveCopy(draft) {
        const trip = draft ?? get().resource?.trip;
        if (!trip || get().saving) return false;
        set({ saving: true, error: "" });
        try {
          const resource = await client.saveTrip(trip);
          invalidate();
          persistence.remember(resource.id);
          set({
            resource,
            initialized: true,
            conflict: false,
            sessionLost: false,
            notice: "A new local copy of your trip is saved.",
          });
          void get().query();
          if (get().selected) void get().select(get().selected);
          return true;
        } catch (error) {
          fail(error);
          return false;
        } finally {
          set({ saving: false });
        }
      },
      async query(filters = get().filters) {
        const resource = get().resource;
        if (!resource) return;
        queryController?.abort();
        const controller = new AbortController();
        queryController = controller;
        set({ querying: true, filters, result: null });
        try {
          const result = await client.destinations(
            resource,
            filters,
            controller.signal,
          );
          if (
            !controller.signal.aborted &&
            get().resource?.revision === resource.revision
          )
            set({ result });
        } catch (error) {
          if (!controller.signal.aborted) fail(error);
        } finally {
          if (queryController === controller) set({ querying: false });
        }
      },
      async select(selected) {
        contextController?.abort();
        const controller = new AbortController();
        contextController = controller;
        const resource = get().resource;
        set({ selected, context: null, contextLoading: !!selected });
        if (!resource || !selected) {
          set({ contextLoading: false });
          return;
        }
        try {
          const context = await client.context(
            resource,
            selected,
            controller.signal,
          );
          if (
            !controller.signal.aborted &&
            get().resource?.revision === resource.revision
          )
            set({ context });
        } catch (error) {
          if (!controller.signal.aborted) fail(error);
        } finally {
          if (contextController === controller) set({ contextLoading: false });
        }
      },
      async shortlist(id) {
        const resource = get().resource;
        if (!resource || get().saving) return;
        const current = resource.trip.shortlistCountryIds;
        if (!current.includes(id) && current.length >= 10) {
          set({ error: "Keep up to 10 destinations in this shortlist." });
          return;
        }
        await get().save({
          ...resource.trip,
          shortlistCountryIds: current.includes(id)
            ? current.filter((c) => c !== id)
            : [...current, id],
        });
      },
      async prepare() {
        const ids = get().resource?.trip.shortlistCountryIds;
        if (!ids?.length) return;
        await run(
          "Preparing review tasks",
          "/checklists",
          { contextRef: ref(), destinationIds: ids },
          (result) => {
            if (result.type === "checklist")
              set({ checklist: result.data, notice: "Review tasks prepared." });
          },
        );
      },
      async exportBrief() {
        const ids = get().resource?.trip.shortlistCountryIds;
        if (!ids?.length) return;
        await run(
          "Preparing your brief",
          "/briefs",
          {
            contextRef: ref(),
            destinationIds: ids,
            messageIds: [],
            includeChecklist: true,
            language: "en",
          },
          (result) => {
            if (result.type === "brief")
              set({
                brief: result.data,
                notice: "Your brief is ready to download.",
              });
          },
        );
      },
      async enrich(travellerId) {
        const resource = get().resource,
          selected = get().selected;
        if (!resource || !selected) return;
        await run(
          "Refreshing selected traveller details",
          `/trips/${resource.id}/enrichment`,
          {
            tripRevision: resource.revision,
            destinationIds: [selected],
            travellerIds: [travellerId],
            maxProviderCalls: 1,
          },
          (result) => {
            if (result.type === "enrichment") {
              const messages = result.data.outcomes
                .map(record)
                .flatMap((outcome) =>
                  typeof outcome.message === "string" ? [outcome.message] : [],
                );
              set({
                notice: messages.length
                  ? [...new Set(messages)].join(" ")
                  : "Saved destination details checked. Review the sources and conditions below.",
              });
              if (get().selected === selected) void get().select(selected);
            }
          },
        );
      },
      cancelJob() {
        jobController?.abort();
        set({ jobLabel: "", notice: "Request cancelled." });
      },
      clearError() {
        set({ error: "", conflict: false });
      },
    };
  });
}
export const useTripPlanner = createTripPlannerStore();
