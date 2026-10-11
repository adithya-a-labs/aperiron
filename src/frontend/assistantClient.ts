import { responses } from "../shared/assistant/responses";
import { requests, type Trip, type Filters } from "../shared/assistant/schemas";
import {
  ValidationError,
  type Infer,
  type Schema,
} from "../shared/assistant/schema";

export type TripResource = Infer<typeof responses.tripResource>;
export type GroupResult = Infer<typeof responses.mapResult>;
export type DestinationRow = GroupResult["destinations"][number];
export type GroupContext = Infer<typeof responses.groupContext>;
export type Checklist = Infer<typeof responses.checklist>;
export type Brief = Infer<typeof responses.brief>;
export type Job = Infer<typeof responses.job>;
export class AssistantError extends Error {
  constructor(
    message: string,
    public code = "NETWORK_ERROR",
    public status = 0,
    public retryAfter = 0,
  ) {
    super(message);
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof ValidationError)
    return error.fieldErrors
      .map((e) => `${e.field.replace(/^\$\.?/, "") || "Trip"}: ${e.message}`)
      .join(" ");
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/** Same-origin, cookie-owned client. Mutations are never automatically replayed. */
export class AssistantClient {
  private csrf = "";
  private bootstrap?: Promise<void>;
  constructor(
    private fetcher: typeof fetch = (...args) => fetch(...args),
    private base = "/api/v1/assistant",
  ) {}
  async connect() {
    if (this.csrf) return;
    this.bootstrap ??= this.request("/sessions", responses.session, {
      method: "POST",
      body: {},
      bootstrap: true,
    })
      .then((s) => {
        this.csrf = s.csrfToken;
      })
      .finally(() => {
        this.bootstrap = undefined;
      });
    return this.bootstrap;
  }
  private async request<T>(
    path: string,
    schema: Schema<T>,
    options: {
      method?: string;
      body?: unknown;
      signal?: AbortSignal;
      bootstrap?: boolean;
      key?: string;
    } = {},
  ): Promise<T> {
    if (!options.bootstrap) await this.connect();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.csrf) headers["X-CSRF-Token"] = this.csrf;
    if (options.key) headers["Idempotency-Key"] = options.key;
    const timeout = AbortSignal.timeout(20000);
    let response: Response;
    try {
      response = await this.fetcher(`${this.base}${path}`, {
        method: options.method ?? "GET",
        credentials: "same-origin",
        headers,
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
        signal: options.signal
          ? AbortSignal.any([options.signal, timeout])
          : timeout,
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new AssistantError(
        "The trip service could not be reached. Please try again.",
      );
    }
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 || payload?.error?.code === "CSRF_REJECTED")
        this.csrf = "";
      const fields = payload?.error?.fieldErrors as
        Array<{ field: string; message: string }> | undefined;
      throw new AssistantError(
        fields?.length
          ? fields.map((e) => `${e.field}: ${e.message}`).join(" ")
          : (payload?.error?.message ??
              "The trip service returned an unexpected response."),
        payload?.error?.code,
        response.status,
        Number(response.headers.get("Retry-After")) || 0,
      );
    }
    try {
      return schema.parse(payload?.data);
    } catch {
      throw new AssistantError(
        "The trip service returned an incompatible response. Please reload.",
        "INVALID_RESPONSE",
      );
    }
  }
  capabilities() {
    return this.request("/capabilities", responses.capabilities);
  }
  getTrip(id: string) {
    return this.request(
      `/trips/${encodeURIComponent(id)}`,
      responses.tripResource,
    );
  }
  saveTrip(trip: Trip, current?: TripResource | null) {
    return current
      ? this.request(`/trips/${current.id}`, responses.tripResource, {
          method: "PUT",
          body: requests.tripPut.parse({
            expectedRevision: current.revision,
            trip,
          }),
        })
      : this.request("/trips", responses.tripResource, {
          method: "POST",
          body: requests.trip.parse(trip),
        });
  }
  async destinations(
    trip: TripResource,
    filters: Filters,
    signal: AbortSignal,
  ): Promise<GroupResult> {
    const rows: DestinationRow[] = [];
    let cursor: string | null = null;
    let result: GroupResult;
    const cursors = new Set<string>();
    do {
      result = await this.request(
        `/trips/${trip.id}/destinations/query`,
        responses.mapResult,
        {
          method: "POST",
          signal,
          body: requests.groupQuery.parse({
            tripRevision: trip.revision,
            filters,
            destinationIds: [],
            page: { cursor, limit: 50 },
          }),
        },
      );
      rows.push(...result.destinations);
      cursor = result.nextCursor;
      if (cursor && cursors.has(cursor))
        throw new AssistantError(
          "Destination pagination could not finish. Try again.",
          "INVALID_RESPONSE",
        );
      if (cursor) cursors.add(cursor);
    } while (cursor);
    return { ...result, destinations: rows };
  }
  context(trip: TripResource, destination: string, signal: AbortSignal) {
    return this.request(
      `/trips/${trip.id}/countries/${destination}/context?tripRevision=${trip.revision}`,
      responses.groupContext,
      { signal },
    );
  }
  async job(
    path: string,
    body: unknown,
    signal: AbortSignal,
    onJob?: (job: Job) => void,
  ): Promise<NonNullable<Job["result"]>> {
    let job = await this.request(path, responses.job, {
      method: "POST",
      body,
      signal,
      key: crypto.randomUUID(),
    });
    const cancel = () => {
      void this.request(`/jobs/${job.id}`, responses.job, {
        method: "DELETE",
      }).catch(() => {});
    };
    signal.addEventListener("abort", cancel, { once: true });
    const deadline = Date.now() + 240000;
    let pollInterval = 1000;
    try {
      for (;;) {
        signal.throwIfAborted();
        onJob?.(job);
        if (job.status === "completed" && job.result) return job.result;
        if (["failed", "cancelled", "superseded"].includes(job.status))
          throw new AssistantError(
            job.error?.message ?? `This request was ${job.status}.`,
            job.error?.code ?? job.status,
          );
        if (Date.now() > deadline) {
          cancel();
          throw new AssistantError(
            "This request took too long. Please try again.",
            "TIMEOUT",
          );
        }
        await new Promise<void>((resolve, reject) => {
          const abort = () => {
            clearTimeout(timer);
            reject(signal.reason);
          };
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", abort);
            resolve();
          }, pollInterval);
          signal.addEventListener("abort", abort, { once: true });
        });
        job = await this.request(`/jobs/${job.id}`, responses.job, { signal });
        pollInterval = Math.min(3000, pollInterval + 500);
      }
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  }
  exportUrl(id: string, format: "markdown" | "json") {
    return `${this.base}/briefs/${encodeURIComponent(id)}/export?format=${format}`;
  }
}
export const assistant = new AssistantClient();
