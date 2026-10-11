import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Compass,
  Download,
  Globe2,
  List,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useTripPlanner } from "../store/tripPlannerStore";
import { useAppStore } from "../store/appStore";
import { assistant, type DestinationRow } from "../frontend/assistantClient";
import { accessLabels, catalog } from "../frontend/engine";
import { GroupMap, assessmentLabels } from "../components/trips/GroupMap";
import { TripSetup } from "../components/trips/TripSetup";
import { Landscape, PostcardArt } from "../components/Artwork";
import { TravelBrief } from "../components/TravelBrief";
import {
  isTravelDetails,
  record,
  safeTravelUrl,
} from "../shared/travelDetails";
import { regions } from "../shared/assistant/schemas";
import type { AccessLevel } from "../shared/contracts";
import "./TripPlanner.css";

const countryName = (id: string) =>
  catalog.destinations.find((c) => c.id === id)?.name ?? id;
const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function Assessment({ value }: { value: DestinationRow["groupAssessment"] }) {
  return (
    <span className={`trip-assessment ${value}`}>
      <i />
      {assessmentLabels[value]}
    </span>
  );
}

export function TripPlanner() {
  const state = useTripPlanner();
  const {
    resource,
    result,
    context,
    selected,
    filters,
    saving,
    querying,
    contextLoading,
    jobLabel,
    error,
    notice,
    brief,
    checklist,
  } = state;
  const passport = useAppStore((s) => s.passport);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"map" | "list">("map");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [listLimit, setListLimit] = useState(12);
  const review = useRef<HTMLElement>(null);
  useEffect(() => {
    void state.initialize();
  }, [state.initialize]);
  const rows = result?.destinations ?? [];
  const visible = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            (!onlyMatches || r.matches) &&
            `${r.destinationName} ${r.destinationId}`
              .toLowerCase()
              .includes(search.toLowerCase().trim()),
        )
        .sort(
          (a, b) =>
            Number(b.matches) - Number(a.matches) ||
            a.destinationName.localeCompare(b.destinationName),
        ),
    [rows, search, onlyMatches],
  );
  const selectedRow = rows.find((r) => r.destinationId === selected);
  const trip = resource?.trip;
  const shortlist = trip?.shortlistCountryIds ?? [];
  const busy = saving || !!jobLabel;
  const schedule =
    trip?.departureDate && trip.returnDate
      ? `${dateLabel(trip.departureDate)} – ${dateLabel(trip.returnDate)}`
      : trip?.departureDate
        ? `From ${dateLabel(trip.departureDate)}`
        : trip?.returnDate
          ? `Until ${dateLabel(trip.returnDate)}`
          : trip?.durationDays
            ? `${trip.durationDays} days · dates flexible`
            : "Dates flexible";
  const budget = trip?.budget
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: trip.budget.currency,
        maximumFractionDigits: 0,
      }).format(trip.budget.amount)
    : "Budget open";
  function choose(id: string) {
    void state.select(id);
  }
  function openEditor() {
    state.clearError();
    setEditing(true);
  }
  return (
    <div className="trip-planner">
      <header className="trip-hero">
        <div>
          <span className="eyebrow">PLAN TOGETHER</span>
          <h1>
            Different passports.
            <br />
            One shared adventure.
          </h1>
          <p>Find a shortlist that works for your whole group.</p>
        </div>
        <div className="trip-hero-art" aria-hidden="true">
          <Send className="trip-plane" />
          <span className="hand-note">
            Good people.
            <br />
            Brighter places.
          </span>
          <Landscape compact />
        </div>
      </header>
      {!editing && error && (
        <div className="trip-error" role="alert">
          <span>{error}</span>
          <div className="trip-actions">
            {state.sessionLost && (
              <button
                className="trip-text-button"
                disabled={saving}
                onClick={() => void state.saveCopy()}
              >
                Save a new local copy
              </button>
            )}
            {state.conflict && (
              <button
                className="trip-text-button"
                disabled={state.loading}
                onClick={() => void state.reload()}
              >
                Load latest trip
              </button>
            )}
            <button
              className="trip-text-button"
              onClick={() => {
                state.clearError();
                if (!state.initialized) void state.initialize();
                else {
                  void state.query();
                  if (selected) void state.select(selected);
                }
              }}
            >
              Try again
            </button>
            <button
              className="trip-icon"
              aria-label="Dismiss error"
              onClick={state.clearError}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="trip-live" role="status" aria-live="polite">
        {notice}
      </div>
      {jobLabel && (
        <div className="trip-job" role="status">
          <RefreshCw size={17} />
          {jobLabel}…
          <button className="trip-text-button" onClick={state.cancelJob}>
            Cancel request
          </button>
        </div>
      )}
      {state.loading && !trip ? (
        <div className="trip-empty" role="status">
          <Compass size={36} />
          <h2>Opening your trip…</h2>
        </div>
      ) : !trip ? (
        <section className="trip-start">
          <div className="trip-start-copy">
            <span className="trip-round-icon">
              <Users size={30} />
            </span>
            <h2>
              The best trips start
              <br />
              with your people.
            </h2>
            <p>
              Add your travellers and their passports. Explore common
              destinations, compare the conditions, and save a plan to review
              together.
            </p>
            <button
              className="trip-button primary"
              disabled={!state.initialized || state.loading}
              onClick={openEditor}
            >
              Create your trip <ArrowRight size={19} />
            </button>
            <small>1–6 travellers · saved locally for up to 7 days</small>
          </div>
          <div className="trip-start-art">
            <PostcardArt variant={2} />
            <span className="trip-postcard-caption">
              Different starting points.
              <br />A place to meet.
            </span>
            <div className="trip-start-steps">
              <span>
                <Users size={18} /> Your travellers
              </span>
              <ChevronRight size={15} />
              <span>
                <MapPin size={18} /> A shared shortlist
              </span>
              <ChevronRight size={15} />
              <span>
                <ClipboardList size={18} /> A plan to review
              </span>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="trip-summary" aria-label="Trip summary">
            <div className="trip-summary-name">
              <MapIcon size={29} />
              <div>
                <h2>{trip.name}</h2>
                <span>
                  {trip.travellers.length}{" "}
                  {trip.travellers.length === 1 ? "traveller" : "travellers"} ·{" "}
                  {shortlist.length} shortlisted
                </span>
              </div>
            </div>
            <span className="trip-summary-item">
              <CalendarDays size={19} />
              {schedule}
            </span>
            <span className="trip-summary-item">
              <Wallet size={19} />
              <span>
                {budget}
                <small>
                  {trip.budget ? "Group budget preference" : "No cost estimate"}
                </small>
              </span>
            </span>
            <div className="trip-actions">
              <button
                className="trip-button secondary"
                disabled={busy}
                onClick={openEditor}
              >
                <Pencil size={16} /> Edit trip
              </button>
              <button
                className="trip-button primary"
                disabled={busy || !shortlist.length}
                onClick={() => void state.exportBrief()}
              >
                <Download size={17} /> Export brief
              </button>
            </div>
          </section>
          {brief && (
            <section className="trip-export" aria-label="Download trip brief">
              <Check size={21} />
              <div>
                <strong>Your trip brief is ready</strong>
                <p>
                  Includes the current shortlist, sources, preparation tasks and
                  unresolved conditions.
                </p>
              </div>
              <a
                className="trip-button secondary"
                href={assistant.exportUrl(brief.id, "markdown")}
                download
              >
                Download Markdown
              </a>
              <a
                className="trip-text-button"
                href={assistant.exportUrl(brief.id, "json")}
                download
              >
                JSON <Download size={15} />
              </a>
            </section>
          )}
          <div className="trip-workspace">
            <aside className="trip-card trip-travellers">
              <div className="trip-section-title">
                <h2>Your travellers</h2>
                <Users size={19} />
              </div>
              <div className="trip-people">
                {trip.travellers.map((person, i) => (
                  <div className="trip-person" key={person.id}>
                    <span className={`trip-avatar tone-${i % 4}`}>
                      {person.label.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <strong>{person.label}</strong>
                      <span>{countryName(person.profile.passportId)}</span>
                      <small>
                        {person.profile.purpose} · {person.profile.passportType}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="trip-button secondary trip-full"
                disabled={busy}
                onClick={openEditor}
              >
                <Plus size={17} />
                {trip.travellers.length < 6
                  ? "Add traveller"
                  : "Edit travellers"}
              </button>
              <div className="trip-rail-note">
                <CalendarDays size={23} />
                <strong>Shared dates</strong>
                <p>{schedule}</p>
              </div>
              <div className="trip-privacy-note">
                Your trip stays in this local browser session. Export a brief to
                keep a copy.
              </div>
            </aside>
            <section
              className="trip-card trip-explore"
              aria-labelledby="trip-explore-title"
            >
              <div className="trip-section-title">
                <h2 id="trip-explore-title">Find common destinations</h2>
                <span className="trip-count" aria-live="polite">
                  {querying
                    ? "Checking…"
                    : `${visible.length} ${visible.length === 1 ? "place" : "places"}`}
                </span>
              </div>
              <div className="trip-search-bar">
                <label className="trip-search">
                  <Search size={18} />
                  <span className="sr-only">Search destinations</span>
                  <input
                    aria-label="Search destinations"
                    value={search}
                    placeholder="Where could you go together?"
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setListLimit(12);
                      if (e.target.value) setMode("list");
                    }}
                  />
                  {search && (
                    <button
                      className="trip-icon"
                      aria-label="Clear destination search"
                      onClick={() => setSearch("")}
                    >
                      <X size={15} />
                    </button>
                  )}
                </label>
                <div className="trip-toggle" aria-label="Destination view">
                  <button
                    aria-pressed={mode === "map"}
                    onClick={() => setMode("map")}
                  >
                    <Globe2 size={16} />
                    Map
                  </button>
                  <button
                    aria-pressed={mode === "list"}
                    onClick={() => setMode("list")}
                  >
                    <List size={16} />
                    List
                  </button>
                </div>
              </div>
              <div className="trip-filters">
                <label>
                  <span>Region</span>
                  <select
                    value={filters.regionIds[0] ?? ""}
                    onChange={(e) =>
                      void state.query({
                        ...filters,
                        regionIds: e.target.value ? [e.target.value] : [],
                      })
                    }
                  >
                    <option value="">All regions</option>
                    {regions.map((r) => (
                      <option value={r} key={r}>
                        {r.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Entry category</span>
                  <select
                    value={filters.accessLevels[0] ?? ""}
                    onChange={(e) =>
                      void state.query({
                        ...filters,
                        accessLevels: e.target.value
                          ? [e.target.value as AccessLevel]
                          : [],
                      })
                    }
                  >
                    <option value="">All categories</option>
                    {Object.entries(accessLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="trip-checkbox">
                  <input
                    type="checkbox"
                    checked={onlyMatches}
                    onChange={(e) => setOnlyMatches(e.target.checked)}
                  />
                  Group matches only
                </label>
              </div>
              {querying ? (
                <div className="trip-map-loading" role="status">
                  <Globe2 size={40} />
                  <p>Comparing your travellers’ passports…</p>
                </div>
              ) : !visible.length ? (
                <div className="trip-map-loading">
                  <Compass size={36} />
                  <h3>
                    {result
                      ? "No destinations match these filters"
                      : "Destinations could not be loaded"}
                  </h3>
                  <p>
                    {result
                      ? "Try another region or entry category."
                      : "Your trip is saved. Try loading the map again."}
                  </p>
                  <button
                    className="trip-button secondary"
                    onClick={() => {
                      setSearch("");
                      setOnlyMatches(false);
                      void state.query({
                        regionIds: [],
                        accessLevels: [],
                        minimumStayDays: null,
                      });
                    }}
                  >
                    {result ? "Reset filters" : "Reload destinations"}
                  </button>
                </div>
              ) : mode === "map" ? (
                <GroupMap
                  rows={visible}
                  selected={selected}
                  onSelect={choose}
                />
              ) : (
                <div className="trip-results">
                  {visible.slice(0, listLimit).map((row) => (
                    <div
                      className={`trip-result ${selected === row.destinationId ? "selected" : ""}`}
                      key={row.destinationId}
                    >
                      <button
                        className="trip-result-main"
                        onClick={() => choose(row.destinationId)}
                      >
                        <span className="trip-country-code">
                          {row.destinationId}
                        </span>
                        <span>
                          <strong>{row.destinationName}</strong>
                          <Assessment value={row.groupAssessment} />
                        </span>
                        <ChevronRight size={17} />
                      </button>
                      <button
                        className={`trip-icon ${shortlist.includes(row.destinationId) ? "saved" : ""}`}
                        aria-label={`${shortlist.includes(row.destinationId) ? "Remove" : "Shortlist"} ${row.destinationName}`}
                        disabled={saving}
                        onClick={() => void state.shortlist(row.destinationId)}
                      >
                        <Bookmark
                          size={18}
                          fill={
                            shortlist.includes(row.destinationId)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                  ))}
                  {visible.length > listLimit && (
                    <button
                      className="trip-text-button trip-full"
                      onClick={() => setListLimit((n) => n + 12)}
                    >
                      Show more destinations
                    </button>
                  )}
                </div>
              )}
              <div className="trip-map-note">
                <span>Snapshot comparison · conditions still need review</span>
                {selected && (
                  <button
                    className="trip-text-button"
                    onClick={() => {
                      review.current?.scrollIntoView({
                        behavior: "instant",
                        block: "start",
                      });
                      review.current?.focus();
                    }}
                  >
                    Review {countryName(selected)} <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </section>
            <aside className="trip-card trip-shortlist">
              <div className="trip-section-title">
                <h2>Your shortlist</h2>
                <span className="trip-count">{shortlist.length}/10</span>
              </div>
              {!shortlist.length ? (
                <div className="trip-shortlist-empty">
                  <Bookmark size={32} />
                  <h3>
                    A few places.
                    <br />
                    So many possibilities.
                  </h3>
                  <p>Select a destination to review it and add it here.</p>
                </div>
              ) : (
                <div className="trip-shortlist-items">
                  {shortlist.map((id, i) => (
                    <div className="trip-shortlist-item" key={id}>
                      <button
                        className="trip-shortlist-open"
                        onClick={() => choose(id)}
                      >
                        <PostcardArt countryId={id} variant={i} />
                        <span>
                          <strong>{countryName(id)}</strong>
                          <small>
                            {rows.find((r) => r.destinationId === id)
                              ? assessmentLabels[
                                  rows.find((r) => r.destinationId === id)!
                                    .groupAssessment
                                ]
                              : "Select to review"}
                          </small>
                        </span>
                      </button>
                      <button
                        className="trip-icon"
                        aria-label={`Remove ${countryName(id)} from shortlist`}
                        disabled={saving}
                        onClick={() => void state.shortlist(id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="trip-shortlist-footer">
                <span className="hand-note">
                  Same curiosity.
                  <br />
                  Further together.
                </span>
                <Send size={28} />
              </div>
            </aside>
          </div>
          <div className="trip-bottom-grid">
            <section
              ref={review}
              tabIndex={-1}
              className="trip-card trip-review"
              aria-labelledby="trip-review-title"
            >
              <div className="trip-section-title">
                <div>
                  <span className="eyebrow">PERSON BY PERSON</span>
                  <h2 id="trip-review-title">
                    {selected ? countryName(selected) : "Review the group"}
                  </h2>
                </div>
                {selected && (
                  <button
                    className={`trip-button ${shortlist.includes(selected) ? "secondary" : "primary"}`}
                    disabled={saving}
                    onClick={() => void state.shortlist(selected)}
                  >
                    {shortlist.includes(selected) ? (
                      <Check size={17} />
                    ) : (
                      <Plus size={17} />
                    )}
                    {shortlist.includes(selected)
                      ? "Shortlisted · remove"
                      : "Add to shortlist"}
                  </button>
                )}
              </div>
              {!selected ? (
                <div className="trip-review-empty">
                  <MapPin size={30} />
                  <p>
                    Choose a destination on the map or list to compare entry
                    conditions for everyone.
                  </p>
                </div>
              ) : contextLoading ? (
                <p className="trip-muted" role="status">
                  Loading {countryName(selected)} for your group…
                </p>
              ) : context ? (
                <>
                  {selectedRow && (
                    <div className="trip-review-assessment">
                      <Assessment value={selectedRow.groupAssessment} />
                      <span>
                        Ordinary-passport tourism baseline · unverified
                      </span>
                    </div>
                  )}
                  <div className="trip-table-wrap">
                    <table className="trip-table">
                      <caption className="sr-only">
                        Entry classifications for {countryName(selected)}
                      </caption>
                      <thead>
                        <tr>
                          <th>Traveller</th>
                          <th>Entry category</th>
                          <th>Snapshot stay</th>
                          <th>Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {context.travellers.map((person, i) => {
                          const snapshot = record(person.context.snapshot);
                          const level =
                            typeof snapshot.accessLevel === "string" &&
                            snapshot.accessLevel in accessLabels
                              ? (snapshot.accessLevel as AccessLevel)
                              : "unknown";
                          const cell = selectedRow?.travellers.find(
                            (t) => t.travellerId === person.travellerId,
                          );
                          return (
                            <tr key={person.travellerId}>
                              <th scope="row">
                                <span
                                  aria-hidden="true"
                                  className={`trip-avatar small tone-${i % 4}`}
                                >
                                  {person.label.slice(0, 1)}
                                </span>
                                {person.label}
                              </th>
                              <td>{accessLabels[level]}</td>
                              <td>
                                {typeof snapshot.maxStayDays === "number"
                                  ? `${snapshot.maxStayDays} days`
                                  : "Not known"}
                              </td>
                              <td>
                                {!person.context.supportedContext
                                  ? "Not assessed"
                                  : cell?.stayAssessment === "exceeds_snapshot"
                                    ? "Stay exceeds snapshot"
                                    : cell?.stayAssessment === "unknown"
                                      ? "Stay not assessed"
                                      : "Check conditions"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="trip-person-details">
                    {context.travellers.map((person) => {
                      const provider = record(person.context.providerDetails);
                      const details = Array.isArray(provider.entries)
                        ? provider.entries.find(isTravelDetails)
                        : undefined;
                      return (
                        <details key={person.travellerId}>
                          <summary>
                            {person.label}: sources & conditions{" "}
                            <ChevronRight size={15} />
                          </summary>
                          <div className="trip-person-detail-body">
                            <ul>
                              {person.context.gaps.map((gap, i) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                            <div className="trip-source-links">
                              {person.context.evidence.map((evidence) => {
                                const url = safeTravelUrl(evidence.url);
                                return (
                                  <div key={evidence.id}>
                                    {url ? (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        {evidence.title} ↗
                                      </a>
                                    ) : (
                                      <span>{evidence.title}</span>
                                    )}
                                    <small>
                                      {evidence.reviewStatus.replaceAll(
                                        "_",
                                        " ",
                                      )}
                                      {evidence.retrievedAt
                                        ? ` · retrieved ${new Date(evidence.retrievedAt).toLocaleDateString()}`
                                        : ""}
                                    </small>
                                  </div>
                                );
                              })}
                            </div>
                            {person.context.supportedContext && (
                              <TravelBrief
                                detail={details}
                                message={
                                  typeof provider.message === "string"
                                    ? provider.message
                                    : undefined
                                }
                                refreshing={busy}
                                changed={false}
                                onRefresh={() =>
                                  void state.enrich(person.travellerId)
                                }
                              />
                            )}
                            {!person.context.supportedContext && (
                              <p className="trip-muted">
                                Provider refresh is available for
                                ordinary-passport tourism only.
                              </p>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="trip-review-empty">
                  <p>Details are unavailable right now.</p>
                  <button
                    className="trip-button secondary"
                    onClick={() => choose(selected)}
                  >
                    Retry details
                  </button>
                </div>
              )}
            </section>
            <section className="trip-card trip-prepare">
              <div className="trip-section-title">
                <h2>Prepare together</h2>
                <ClipboardList size={23} />
              </div>
              <p className="trip-muted">
                Review the conditions before making plans.
              </p>
              {checklist ? (
                <>
                  <ul className="trip-tasks">
                    {checklist.items.map((item) => (
                      <li key={item.id}>
                        <ClipboardList size={20} />
                        <div>
                          <strong>
                            {item.title.replace(
                              /for ([A-Z]{2})$/,
                              (_, id: string) => `for ${countryName(id)}`,
                            )}
                          </strong>
                          <small>
                            {item.requirementStatus} · {item.category}
                          </small>
                          {item.condition && <p>{item.condition}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <details className="trip-task-gaps">
                    <summary>What still needs checking</summary>
                    <ul>
                      {checklist.gaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </details>
                </>
              ) : (
                <div className="trip-preparation-empty">
                  <span className="trip-round-icon">
                    <ClipboardList size={30} />
                  </span>
                  <p>
                    {shortlist.length
                      ? "Turn your shortlist into a set of review tasks for the group."
                      : "Shortlist a destination to prepare your group’s review tasks."}
                  </p>
                </div>
              )}
              <button
                className="trip-button secondary trip-full"
                disabled={busy || !shortlist.length}
                onClick={() => void state.prepare()}
              >
                {checklist ? "Refresh review tasks" : "Prepare review tasks"}
                <ArrowRight size={16} />
              </button>
              <small className="trip-footnote">
                Suggested preparation. Verified document requirements and
                deadlines are not yet available.
              </small>
            </section>
          </div>
        </>
      )}
      {editing && (
        <TripSetup
          initial={trip ?? null}
          passport={passport}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
