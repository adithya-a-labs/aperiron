import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Coins,
  Compass,
  Globe2,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Sun,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import { engine, catalog, accessColors, accessLabels } from "./frontend/engine";
import { useAppStore } from "./store/appStore";
import {
  INITIAL_WORLD_STATE,
  type AccessLevel,
  type Result,
  type Treaty,
  type TravellerContext,
  type WorldState,
} from "./shared/contracts";
import {
  Landscape,
  PostcardArt,
  PassportBook,
  DnaFlower,
} from "./components/Artwork";
import { WorldMap } from "./components/AccessMap";
import { BotExplorer } from "./components/BotExplorer";
import { GAME_ENABLED } from "./frontend/features";
import { isResearchResponse, type ResearchResponse } from "./shared/research";
import { useTravelDetails } from "./store/travelDetailsStore";
import { composeExploration } from "./engine/exploration";
import { primaryAccess } from "./shared/travelDetails";
import { TravelBrief } from "./components/TravelBrief";
import { PassportSelect } from "./components/PassportSelect";
import { ResearchAnswer } from "./components/ResearchAnswer";
import { pageHash, readPage, type Page } from "./frontend/navigation";
import { TripPlanner } from "./pages/TripPlanner";

type GroqResearch = ResearchResponse & { contextKey: string };
function unwrap<T>(result: Result<T>): T {
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}
function go(page: Page) {
  window.location.hash = pageHash(page, useAppStore.getState());
}
function country(id: string) {
  return (
    catalog.destinations.find((c) => c.id === id) ??
    catalog.passports.find((c) => c.id === id)!
  );
}
function Tag({ level }: { level: AccessLevel }) {
  return (
    <span className={`tag ${level}`}>
      <i style={{ background: accessColors[level] }} />
      {accessLabels[level]}
    </span>
  );
}
function Legend({ outside = true }: { outside?: boolean }) {
  return (
    <div className="legend">
      {Object.entries(accessLabels).map(([key, label]) => (
        <span key={key}>
          <i style={{ background: accessColors[key as AccessLevel] }} />
          {label}
        </span>
      ))}
      {outside && <span><i className="unsupported-key" />Outside coverage</span>}
    </div>
  );
}
function Heading({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p className="subtitle">{children}</p>}
      </div>
      {aside}
    </div>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={secondary ? "pill" : "button"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function ModeSwitch({
  simulated,
  setSimulated,
}: {
  simulated: boolean;
  setSimulated: (b: boolean) => void;
}) {
  if (!GAME_ENABLED) return null;
  return (
    <div className="segmented" aria-label="Map data mode">
      <button aria-pressed={!simulated} onClick={() => setSimulated(false)}>
        Baseline
      </button>
      <button aria-pressed={simulated} onClick={() => setSimulated(true)}>
        My simulation
      </button>
    </div>
  );
}

function Explore() {
  const { passport, setPassport, destination, setDestination, world, selectionRevision, selectionKey } =
    useAppStore();
  const [search, setSearch] = useState("");
  const [list, setList] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const travel = useTravelDetails(passport, destination, selectionKey === `${passport}:${destination}` ? selectionRevision : null);
  const snapshot = unwrap(
    engine.getPassportView(
      passport,
      GAME_ENABLED && simulated ? world : INITIAL_WORLD_STATE,
    ),
  );
  const view = GAME_ENABLED && simulated ? snapshot : composeExploration(snapshot, travel.entries);
  const destinations = view.destinations.filter(d =>
    `${d.destinationName} ${d.destinationId}`.toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a, b) => a.destinationName.localeCompare(b.destinationName));
  const selected = view.destinations.find(
    (d) => d.destinationId === destination,
  )!;
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Heading
        eyebrow="01 / EXPLORE"
        title="Where could you go?"
        aside={
          <div className="hand-note">
            Good people.
            <br />
            New perspectives.
            <Sun size={32} />
          </div>
        }
      >
        Same passport. A world of possibilities.
      </Heading>
      <div className="toolbar">
        <PassportSelect value={passport} onChange={setPassport} />
        <label className="search">
          <Search size={18} />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); if (e.target.value) setList(true); }}
            placeholder="Find a country"
            aria-label="Find a country"
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </label>
        <ModeSwitch simulated={simulated} setSimulated={setSimulated} />
      </div>
      <div className="explore-layout">
        <section className="map-stage" aria-label="Destinations">
          <div className="view-toggle segmented">
            <button aria-pressed={!list} onClick={() => { setList(false); setSearch(""); }}>
              Map
            </button>
            <button aria-pressed={list} onClick={() => setList(true)}>
              List
            </button>
          </div>
          <Legend />
          <p className="map-caption">
            {catalog.destinations.length} destinations · Passport Index snapshot · unverified
            {travel.entries.length > 0 && !simulated ? " + cached provider updates" : ""}
            {simulated ? " · fictional treaty effects" : ""}
          </p>
          <p className={list ? "result-count" : "sr-only"} role="status" aria-live="polite">
            {list ? `${destinations.length} destinations found. Select one to update the details alongside.` : "Map view. Use the List view to search destinations."}
          </p>
          {list ? (
            <div className="destination-list">
              {destinations.length ? (
                destinations.map((d) => (
                  <button
                    key={d.destinationId}
                    className={
                      destination === d.destinationId ? "selected" : ""
                    }
                    onClick={() => {
                      setDestination(d.destinationId);
                    }}
                  >
                    <span>
                      {country(d.destinationId).flagEmoji} {d.destinationName}
                    </span>
                    <Tag level={d.accessLevel} />
                    <ArrowRight size={16} />
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <Compass />
                  <h2>No places found</h2>
                  <p>Try another country name.</p>
                  <Button secondary onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <WorldMap
              view={view}
              selected={destination}
              onSelect={setDestination}
            />
          )}
        </section>
        <div className="explore-sidebar">
          <BotExplorer countryId={destination} />
        <aside className="postcard" aria-label="Selected destination details">
          <div className="postcard-image">
            <PostcardArt
              countryId={destination}
              variant={
                destination === "JP"
                  ? 0
                  : destination === "FJ"
                    ? 1
                    : destination === "DE"
                      ? 2
                      : 3
              }
            />
            <span className="stamp">LET’S EXPLORE</span>
          </div>
          <span className="eyebrow">YOUR NEXT CHAPTER?</span>
          <h2 aria-live="polite">Hello, {country(destination).name}!</h2>
          <div className="postcard-details">
            <span>{selected.notes?.startsWith('Travel Buddy') ? 'Provider access' : 'Snapshot access'}</span>
            <Tag level={selected.accessLevel} />
            <span>Purpose</span>
            <b>Tourism</b>
            <span>Stay information</span>
            <b>{travel.detail?.primary.duration ? `${travel.detail.primary.duration} (unverified)` : 'Not verified'}</b>
          </div>
          {travel.detail && <p className="travel-status">Travel Buddy · checked {new Date(travel.detail.fetchedAt).toLocaleDateString()} · unverified</p>}
          {travel.detail && primaryAccess(travel.detail) && primaryAccess(travel.detail) !== snapshot.destinations.find(d => d.destinationId === destination)?.accessLevel && <p className="travel-status" role="status">Requirements updated</p>}
          {selected.isSimulated && (
            <p className="simulation-label">Changed in your fictional world</p>
          )}
          <Button onClick={() => go("country")}>
            View requirements <ArrowRight size={17} />
          </Button>
        </aside>
        </div>
      </div>
      <div className="explore-bottom">
        <div className="travel-seal">
          <Compass size={32} />
          <span>
            STAY CURIOUS
            <br />
            GO FURTHER
          </span>
        </div>
        <p className="hand-note">
          Different passports.
          <br />
          One shared planet. <Heart size={17} />
        </p>
      </div>
    </>
  );
}

function CountryPage({ inspectSecond = false }: { inspectSecond?: boolean }) {
  const { passport: firstPassport, comparison, setPassport: setFirstPassport, setComparison, destination, setDestination, world, selectionRevision, selectionKey } = useAppStore();
  const passport = inspectSecond ? comparison : firstPassport;
  const setPassport = inspectSecond ? setComparison : setFirstPassport;
  const [purpose, setPurpose] =
    useState<TravellerContext["purpose"]>("tourism");
  const openedPassport = useRef(passport);
  if (openedPassport.current !== passport) openedPassport.current = '';
  const travel = useTravelDetails(passport, destination,
    selectionKey === `${passport}:${destination}` || openedPassport.current === passport ? `country:${selectionRevision}` : null, purpose);
  const [research, setResearch] = useState<GroqResearch | null>(null);
  const [researchError, setResearchError] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const researchRequest = useRef(0);
  const researchAbort = useRef<AbortController | null>(null);
  const contextKey = `${passport}:${destination}:${purpose}`;
  useEffect(() => {
    ++researchRequest.current;
    researchAbort.current?.abort();
    setResearch(null);
    setResearchError("");
    setIsResearching(false);
    return () => {
      ++researchRequest.current;
      researchAbort.current?.abort();
    };
  }, [contextKey]);
  async function requestResearch() {
    researchAbort.current?.abort();
    const controller = new AbortController();
    researchAbort.current = controller;
    const requestId = ++researchRequest.current;
    setIsResearching(true);
    setResearchError("");
    setResearch(null);
    try {
      const response = await fetch("/api/groq-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportId: passport, destinationId: destination, purpose }),
        signal: controller.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !isResearchResponse(data)) {
        const error = data && typeof data === "object" && "error" in data && typeof data.error === "string"
          ? data.error : "Research is unavailable. Please try again.";
        throw new Error(error);
      }
      if (requestId === researchRequest.current) setResearch({ ...data, contextKey });
    } catch (error) {
      if (requestId === researchRequest.current) {
        setResearchError(error instanceof Error ? error.message : "Research is unavailable.");
      }
    } finally {
      if (requestId === researchRequest.current) setIsResearching(false);
    }
  }
  const result = engine.getDestinationRequirements({
    passportId: passport,
    destinationId: destination,
    travellerContext: { purpose, passportType: "ordinary" },
  });
  const requirements = unwrap(result);
  const sample = unwrap(
    engine.getPassportView(passport, INITIAL_WORLD_STATE),
  ).destinations.find((d) => d.destinationId === destination)!;
  const simulated = unwrap(
    engine.getPassportView(
      passport,
      GAME_ENABLED ? world : INITIAL_WORLD_STATE,
    ),
  ).destinations.find((d) => d.destinationId === destination)!;
  return (
    <>
      <button className="text-button" onClick={() => go("explore")}>
        <ArrowLeft size={17} />
        Back to the world
      </button>
      <button className="text-button comparison-return" onClick={() => go("compare")}>
        <ArrowLeftRight size={17} /> Back to comparison
      </button>
      <Heading
        eyebrow="COUNTRY NOTEBOOK"
        title={`A little closer to ${country(destination).name}.`}
      />
      <div className="toolbar">
        <PassportSelect value={passport} onChange={setPassport} />
        <label className="passport-select">
          <span>Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {[...catalog.destinations].sort((a, b) => a.name.localeCompare(b.name)).map((d) => (
              <option value={d.id} key={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="passport-select">
          <span>Purpose</span>
          <select
            value={purpose}
            onChange={(e) =>
              setPurpose(e.target.value as TravellerContext["purpose"])
            }
          >
            <option value="tourism">Tourism</option>
            <option value="business">Business</option>
            <option value="transit">Transit</option>
            <option value="conference">Conference</option>
          </select>
        </label>
      </div>
      <div className="notebook">
        <div className="notebook-main">
          <div className="notebook-title">
            <div>
              <span className="eyebrow">
                {country(passport).name} → {country(destination).name}
              </span>
              <h2>Before you set off</h2>
              <Tag level={(travel.detail && primaryAccess(travel.detail)) || requirements.accessLevel} />
              {!requirements.verifiedAt && (
                <span className="tag unknown">Requirements unverified</span>
              )}
            </div>
            <MapPin size={42} />
          </div>
          {purpose === 'tourism' && passport !== destination && <TravelBrief
            detail={travel.detail} message={travel.message} refreshing={travel.refreshing} onRefresh={() => void travel.refresh()}
            changed={Boolean(travel.detail && primaryAccess(travel.detail) && primaryAccess(travel.detail) !== sample.accessLevel)}
          />}
          {!travel.detail && <dl className="requirements rule-summary">
            <div><dt>Stay in snapshot</dt><dd>{requirements.maxStayDays === null ? "Not verified" : `${requirements.maxStayDays} days (unverified)`}</dd></div>
            <div><dt>Application</dt><dd>{requirements.applicationChannel.url
              ? <a href={requirements.applicationChannel.url} target="_blank" rel="noreferrer">{requirements.applicationChannel.name} ↗</a>
              : requirements.applicationChannel.name}</dd></div>
          </dl>}
          <details className="preparation-details" open>
            <summary>Documents, fees & processing</summary>
            <dl className="requirements">
              <div><dt>Documents</dt><dd>{requirements.documents.length
                ? requirements.documents.map(d => d.title + (d.required ? " (required)" : " (conditional)")).join("; ")
                : "No verified checklist available"}</dd></div>
              <div><dt>Fee</dt><dd>{requirements.fees ? `${requirements.fees.amount} ${requirements.fees.currency}` : "Not verified"}</dd></div>
              <div><dt>Processing</dt><dd>{requirements.processingTime
                ? `${requirements.processingTime.estimateDaysMin}–${requirements.processingTime.estimateDaysMax} ${requirements.processingTime.unit}` : "Not verified"}</dd></div>
              <div><dt>Last verified</dt><dd>{requirements.verifiedAt || "Not available"}</dd></div>
            </dl>
          </details>
          {!!requirements.unresolvedConditions?.length && (
            <div className="notice-box">
              <b>A few things are still unknown.</b>
              <p>
                {requirements.unresolvedConditions?.join(" ")}{" "}
                {purpose !== "tourism"
                  ? "The map baseline models tourism only."
                  : ""}
              </p>
            </div>
          )}
          <section className="research-box" aria-live="polite">
            <div>
              <span className="eyebrow">OPTIONAL WEB RESEARCH</span>
              <h3>Look for current official sources</h3>
              <p>
                Groq Browser Search can find leads for this exact selection. It
                does not verify or change Aperiron’s requirements.
              </p>
            </div>
            <Button onClick={requestResearch} disabled={isResearching}>
              <Search size={17} />
              {isResearching ? "Researching…" : "Research sources"}
            </Button>
            {researchError && <p className="research-error">{researchError}</p>}
            {research?.contextKey === contextKey && (
              <div className="research-result">
                <b>Unverified research · {research.model}</b>
                <ResearchAnswer answer={research.answer} />
                <small>{research.disclaimer} Retrieved {research.retrievedAt}.</small>
              </div>
            )}
          </section>
          <details>
            <summary>Sources & traveller context</summary>
            <p>
              Ordinary passport · {purpose}.{" "}
              {requirements.sources.length
                ? "Review the source and its applicability before planning travel."
                : "No verified source record is connected for this selection. Check the destination’s official immigration authority before planning travel."}
            </p>
            {requirements.sources.map((source) => (
              <p key={source.id}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  {source.title} ↗
                </a>
                <br />
                {source.issuingAuthority} · verified{" "}
                {source.verifiedAt || "not available"}
                {source.notes && <><br />{source.notes}</>}
              </p>
            ))}
            {requirements.applicationChannel.url && (
              <p>
                <a
                  href={requirements.applicationChannel.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {requirements.applicationChannel.name} ↗
                </a>
              </p>
            )}
          </details>
        </div>
        <aside className="notebook-side">
          <PostcardArt
            countryId={destination}
            variant={destination === "JP" ? 0 : 3}
          />
          <h2>A place to imagine</h2>
          <p>
            The map uses a bundled third-party Passport Index snapshot for
            ordinary-passport tourism. Its classifications are unverified and
            may differ from current official entry requirements.
          </p>
          <Tag level={sample.accessLevel} />
          {GAME_ENABLED && (
            <div className="simulation-box">
              <span className="stamp inline">FICTIONAL SIMULATION</span>
              <h3>Your world</h3>
              <Tag level={simulated.accessLevel} />
              <p>
                {simulated.isSimulated
                  ? "Your treaties changed this sample route. Real requirements remain unchanged."
                  : "No treaty has changed this sample route."}
              </p>
              <button className="text-button" onClick={() => go("market")}>
                Try the Border Market <ArrowRight size={16} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function Compare() {
  const { passport, comparison, setPassport, setComparison, world } =
    useAppStore();
  const [mode, setMode] = useState<"shared" | "a" | "b" | "changes">("shared");
  const [query, setQuery] = useState("");
  const [simulated, setSimulated] = useState(false);
  const data = unwrap(
    engine.comparePassports(
      passport,
      comparison,
      GAME_ENABLED && simulated ? world : INITIAL_WORLD_STATE,
    ),
  );
  const ids =
    mode === "shared"
      ? data.sharedAccessible
      : mode === "a"
        ? data.onlyA
        : mode === "b"
          ? data.onlyB
          : data.differences.map((d) => d.destinationId);
  const state = GAME_ENABLED && simulated ? world : INITIAL_WORLD_STATE;
  const viewA = unwrap(engine.getPassportView(passport, state));
  const viewB = unwrap(engine.getPassportView(comparison, state));
  const levelsA = new Map(viewA.destinations.map(d => [d.destinationId, d.accessLevel]));
  const levelsB = new Map(viewB.destinations.map(d => [d.destinationId, d.accessLevel]));
  const matchingIds = [...ids].filter(id => `${country(id).name} ${id}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => country(a).name.localeCompare(country(b).name));
  const inspectLink = (id: string, second = false) => pageHash('country', { passport, comparison, destination: id }, second ? 'second' : undefined);
  return (
    <>
      <Heading eyebrow="02 / COMPARE" title="Two passports. New possibilities.">
        Different journeys. A shared world. Calculated from the bundled Passport Index snapshot.
      </Heading>
      <div className="compare-controls">
        <PassportSelect
          value={passport}
          onChange={setPassport}
          label="First passport"
        />
        <button
          className="round-button"
          aria-label="Swap passports"
          onClick={() => {
            setPassport(comparison);
            setComparison(passport);
          }}
        >
          <ArrowLeftRight size={20} />
        </button>
        <PassportSelect
          value={comparison}
          onChange={setComparison}
          label="Second passport"
        />
        <ModeSwitch simulated={simulated} setSimulated={setSimulated} />
      </div>
      <div className="comparison-hero">
        <PassportBook name={country(passport).name} code={passport} />
        <div className="venn">
          <div className="venn-circle first">
            <b>{data.onlyA.length}</b>
            <span>Only {country(passport).name}</span>
          </div>
          <div className="venn-circle second">
            <b>{data.onlyB.length}</b>
            <span>Only {country(comparison).name}</span>
          </div>
          <div className="venn-shared">
            <Globe2 />
            <b>{data.sharedAccessible.length}</b>
            <span>Shared places</span>
          </div>
        </div>
        <PassportBook
          name={country(comparison).name}
          code={comparison}
          alternate
        />
      </div>
      <div className="compare-scores">
        <span>
          {country(passport).name} <b>{data.scoreA}</b>
        </span>
        <p>
          Modeled mobility score / 100
          <br />
          <small>Visa-free, on arrival & eVisa count as accessible.</small>
        </p>
        <span>
          <b>{data.scoreB}</b> {country(comparison).name}
        </span>
      </div>
      <div className="results-panel">
        <div className="segmented">
          <button
            aria-pressed={mode === "shared"}
            onClick={() => setMode("shared")}
          >
            Shared ({data.sharedAccessible.length})
          </button>
          <button aria-pressed={mode === "a"} onClick={() => setMode("a")}>
            Only {passport} ({data.onlyA.length})
          </button>
          <button aria-pressed={mode === "b"} onClick={() => setMode("b")}>
            Only {comparison} ({data.onlyB.length})
          </button>
          <button
            aria-pressed={mode === "changes"}
            onClick={() => setMode("changes")}
          >
            Access differences ({data.differences.length})
          </button>
        </div>
        <label className="search compare-search"><Search size={18} />
          <input aria-label="Find a comparison destination" placeholder="Find a destination" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <p className="result-count" role="status">{matchingIds.length} destinations · sorted by name</p>
        <div className="comparison-table-wrap">
          {matchingIds.length ? <table className="comparison-table">
            <caption className="sr-only">Snapshot access by passport. Select an access category to open its country notebook.</caption>
            <thead><tr><th scope="col">Destination</th><th scope="col">{country(passport).name}</th><th scope="col">{country(comparison).name}</th></tr></thead>
            <tbody>{matchingIds.map(id => <tr key={id}>
              <th scope="row">{country(id).flagEmoji} {country(id).name}</th>
              <td><a href={inspectLink(id)} aria-label={`Inspect ${country(passport).name} passport requirements for ${country(id).name}`}>
                <Tag level={levelsA.get(id)!} /><span>Inspect <ArrowRight size={14} /></span></a></td>
              <td><a href={inspectLink(id, true)} aria-label={`Inspect ${country(comparison).name} passport requirements for ${country(id).name}`}>
                <Tag level={levelsB.get(id)!} /><span>Inspect <ArrowRight size={14} /></span></a></td>
            </tr>)}</tbody>
          </table> : <div className="empty-state"><p>{query ? "No matching destinations. Try another name." : passport === comparison ? "These are the same passport, so there are no unique destinations or access differences." : "No destinations in this group. Try another group or passport."}</p>
            {query && <Button secondary onClick={() => setQuery("")}>Clear search</Button>}
          </div>}
        </div>
      </div>
      <Landscape />
    </>
  );
}

function Dna() {
  const { passport, setPassport, world } = useAppStore();
  const [simulated, setSimulated] = useState(false);
  const baseline = unwrap(
    engine.generateVisaDNA(passport, INITIAL_WORLD_STATE),
  );
  const after = unwrap(
    engine.generateVisaDNA(
      passport,
      GAME_ENABLED ? world : INITIAL_WORLD_STATE,
    ),
  );
  const dna = simulated ? after : baseline;
  const baselineLevels = unwrap(engine.getPassportView(passport, INITIAL_WORLD_STATE)).destinations.map(d => d.accessLevel);
  const afterLevels = unwrap(engine.getPassportView(passport, GAME_ENABLED ? world : INITIAL_WORLD_STATE)).destinations.map(d => d.accessLevel);
  const levels = simulated ? afterLevels : baselineLevels;
  return (
    <>
      <Heading eyebrow="03 / VISA DNA" title="Your passport has a pattern.">
        Every passport tells a story. Calculated from the bundled Passport Index snapshot.
      </Heading>
      <div className="dna-layout">
        <div className="dna-copy">
          <PassportSelect value={passport} onChange={setPassport} />
          <h2>
            A world of possibilities.
            <br />
            Uniquely yours.
          </h2>
          <p>
            Each petal follows a destination’s modeled access. Together, they
            create your passport’s fingerprint.
          </p>
          <ModeSwitch simulated={simulated} setSimulated={setSimulated} />
          <p className="dna-encoding-note">Petal length follows the modeled weight. Color shows the access category; unknown data is gray, distinct from red restrictions, even though both have zero weight.</p>
          <dl className="dna-stats">
            {([
              ['Visa-free', dna.summary.visaFree], ['On arrival', dna.summary.visaOnArrival],
              ['eVisa', dna.summary.evisa], ['Visa required', dna.summary.visaRequired],
              ['Restricted', dna.summary.restricted], ['Unknown', dna.summary.unknown],
            ] as const).map(([label, count]) => <div key={label}><dd>{count}</dd><dt>{label}</dt></div>)}
          </dl>
          <p className="result-count">{dna.summary.total} destinations modeled</p>
          <Button onClick={() => go(GAME_ENABLED ? "market" : "explore")}>
            {GAME_ENABLED ? "Change your world" : "Explore destinations"}{" "}
            <ArrowRight size={18} />
          </Button>
        </div>
        <div className="dna-hero">
          <DnaFlower dna={dna} levels={levels} />
          <span className="round-stamp">
            UNIQUELY
            <br />
            YOURS <Sparkles size={22} />
          </span>
        </div>
      </div>
      <Legend outside={false} />
      <details className="dna-details">
        <summary>How your pattern is made</summary>
        <p>
          The engine provides a stable vector in catalog order. Petal lengths
          reflect modeled access weights; colors use the snapshot categories; this illustration is not a
          personal or biological fingerprint. Restricted and unknown both have
          zero weight in the current engine.
        </p>
        <code>{dna.hash}</code>
      </details>
      {GAME_ENABLED && (
        <div className="dna-comparison">
          <div>
            <DnaFlower dna={baseline} levels={baselineLevels} small />
            <span>Baseline</span>
          </div>
          <ArrowRight />
          <div>
            <DnaFlower dna={after} levels={afterLevels} small />
            <span>Your simulation</span>
          </div>
          <p>
            {baseline.hash === after.hash
              ? "Your pattern hasn’t changed yet. Try a treaty in the Border Market."
              : "Your treaties have changed the pattern. Same passport, new possibilities."}
          </p>
        </div>
      )}
    </>
  );
}

function PlayHeader({ page }: { page: "market" | "impact" | "optimizer" }) {
  const { world, reset } = useAppStore();
  return (
    <>
      <div className="play-top">
        <span className="eyebrow">04 / BORDER MARKET</span>
        <span className="credit-balance">
          <Coins size={21} />
          <b>{world.creditsRemaining}</b> Influence Credits
        </span>
      </div>
      <div className="play-nav">
        <div className="segmented">
          {(["market", "impact", "optimizer"] as const).map((p, i) => (
            <button key={p} aria-pressed={page === p} onClick={() => go(p)}>
              {["Treaties", "Your impact", "Optimizer"][i]}
            </button>
          ))}
        </div>
        <button
          className="text-button"
          disabled={!world.purchasedTreatyIds.length}
          onClick={reset}
        >
          <RotateCcw size={15} />
          Reset world
        </button>
      </div>
    </>
  );
}
function TreatyCard({
  treaty,
  index,
  onPreview,
}: {
  treaty: Treaty;
  index: number;
  onPreview: (t: Treaty) => void;
}) {
  const { world, purchase } = useAppStore();
  const purchased = world.purchasedTreatyIds.includes(treaty.id);
  return (
    <article className={`treaty-card ${purchased ? "purchased" : ""}`}>
      <PostcardArt variant={(index % 3) + 1} />
      <span className="eyebrow">{treaty.category} TREATY</span>
      <h2>{treaty.name}</h2>
      <p>{treaty.description}</p>
      <div className="treaty-price">
        <Coins size={18} />
        <b>{treaty.cost} credits</b>
        <button className="text-button" onClick={() => onPreview(treaty)}>
          Preview <ArrowRight size={14} />
        </button>
      </div>
      <Button
        disabled={purchased || treaty.cost > world.creditsRemaining}
        onClick={() => purchase(treaty.id)}
      >
        {purchased ? (
          <>
            <Check size={17} />
            In your world
          </>
        ) : treaty.cost > world.creditsRemaining ? (
          "Not enough credits"
        ) : (
          <>
            Try this treaty <ArrowRight size={17} />
          </>
        )}
      </Button>
    </article>
  );
}
function TreatyPreview({
  treaty,
  onClose,
}: {
  treaty: Treaty;
  onClose: () => void;
}) {
  const { world, purchase } = useAppStore();
  const dialog = useRef<HTMLDialogElement>(null);
  const result = engine.purchaseTreaty(world, treaty.id);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <button
          className="round-button close"
          onClick={onClose}
          aria-label="Close treaty preview"
        >
          <X />
        </button>
        <PostcardArt variant={2} />
        <span className="eyebrow">
          FICTIONAL TREATY · {treaty.cost} CREDITS
        </span>
        <h2>{treaty.name}</h2>
        <p>{treaty.description}</p>
        {result.success ? (
          <div className="notice-box">
            <b>+{result.data.impact.scoreDelta.toFixed(1)} global score</b>
            <p>
              {result.data.impact.newlyAccessiblePairs.length} newly accessible
              passport–destination pairs.
            </p>
          </div>
        ) : (
          <p role="status">{result.error.message}</p>
        )}
        <h3>What changes</h3>
        <ul className="grant-list">
          {treaty.grants.map((g, i) => (
            <li key={i}>
              {g.passportId === "*"
                ? "All passports"
                : country(g.passportId).name}{" "}
              → {country(g.destinationId).name}
              <Tag level={g.grantedAccessLevel} />
            </li>
          ))}
        </ul>
        <Button
          disabled={!result.success}
          onClick={() => {
            purchase(treaty.id);
            onClose();
          }}
        >
          Add to my world <ArrowRight size={17} />
        </Button>
        <p className="fine-print">
          Preview only. Credits change when you add the treaty.
        </p>
      </div>
    </dialog>
  );
}
function Market() {
  const [category, setCategory] = useState("all");
  const [preview, setPreview] = useState<Treaty | null>(null);
  return (
    <>
      <PlayHeader page="market" />
      <Heading
        eyebrow="SMALL IDEAS. BIG POSSIBILITIES."
        title="What if borders opened?"
        aside={<span className="stamp inline">FICTIONAL SIMULATION</span>}
      >
        Build a friendlier world, one treaty at a time.
      </Heading>
      <div className="filter-row">
        {["all", "bilateral", "multilateral", "regional", "special"].map(
          (c) => (
            <button
              key={c}
              className={category === c ? "filter active" : "filter"}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c === "all" ? "All treaties" : c}
            </button>
          ),
        )}
        <button className="text-button" onClick={() => go("optimizer")}>
          <Sparkles size={16} />
          Need a little inspiration?
        </button>
      </div>
      <div className="treaty-grid">
        {catalog.treaties
          .filter((t) => category === "all" || t.category === category)
          .map((t, i) => (
            <TreatyCard
              treaty={t}
              index={i}
              key={t.id}
              onPreview={setPreview}
            />
          ))}
      </div>
      {preview && (
        <TreatyPreview treaty={preview} onClose={() => setPreview(null)} />
      )}
      <Landscape />
    </>
  );
}

function Impact() {
  const { passport, setPassport, world } = useAppStore();
  const impact = unwrap(engine.calculateImpact(INITIAL_WORLD_STATE, world));
  const baseline = unwrap(
    engine.getPassportView(passport, INITIAL_WORLD_STATE),
  );
  const after = unwrap(
    engine.getPassportView(
      passport,
      GAME_ENABLED ? world : INITIAL_WORLD_STATE,
    ),
  );
  return (
    <>
      <PlayHeader page="impact" />
      <Heading
        eyebrow="A LITTLE CHANGE GOES A LONG WAY"
        title="Look what you opened up."
      >
        Your fictional treaties. A different world.
      </Heading>
      <div className="toolbar">
        <PassportSelect value={passport} onChange={setPassport} />
        <span className="stamp inline">SIMULATION ONLY</span>
      </div>
      <div className="impact-maps">
        <div>
          <h2>Before</h2>
          <WorldMap view={baseline} />
          <span>
            Passport score <b>{baseline.score}</b>
          </span>
        </div>
        <ArrowRight className="impact-arrow" />
        <div>
          <h2>Your world</h2>
          <WorldMap view={after} />
          <span>
            Passport score <b>{after.score}</b>
          </span>
        </div>
      </div>
      <Legend />
      <div className="impact-numbers">
        <div>
          <b>+{impact.scoreDelta.toFixed(1)}</b>
          <span>Global modeled score</span>
        </div>
        <div>
          <b>{impact.newlyAccessiblePairs.length}</b>
          <span>New accessible pairs · all passports</span>
        </div>
        <div>
          <b>{world.purchasedTreatyIds.length}</b>
          <span>Treaties in your world</span>
        </div>
      </div>
      <div className="impact-bottom">
        <section>
          <h2>New doors for {country(passport).name}</h2>
          {impact.newlyAccessiblePairs.filter((p) => p.passportId === passport)
            .length ? (
            <div className="new-places">
              {impact.newlyAccessiblePairs
                .filter((p) => p.passportId === passport)
                .map((p) => (
                  <span key={p.destinationId}>
                    {country(p.destinationId).flagEmoji}{" "}
                    {country(p.destinationId).name}
                    <Tag level={p.newLevel} />
                  </span>
                ))}
            </div>
          ) : (
            <p>
              No newly accessible destinations for this passport yet. A treaty
              can still improve an existing access category.
            </p>
          )}
          <div className="purchased-list">
            {world.purchasedTreatyIds.map((id) => (
              <span key={id}>
                <Check size={15} />
                {catalog.treaties.find((t) => t.id === id)!.name}
              </span>
            ))}
          </div>
          <Button onClick={() => go(GAME_ENABLED ? "market" : "explore")}>
            Keep exploring treaties <ArrowRight size={17} />
          </Button>
        </section>
        <section className="impact-dna">
          <h2>A new pattern</h2>
          <div>
            <DnaFlower
              dna={unwrap(
                engine.generateVisaDNA(passport, INITIAL_WORLD_STATE),
              )}
              small
            />
            <ArrowRight />
            <DnaFlower
              dna={unwrap(
                engine.generateVisaDNA(
                  passport,
                  GAME_ENABLED ? world : INITIAL_WORLD_STATE,
                ),
              )}
              small
            />
          </div>
        </section>
      </div>
      <Landscape />
    </>
  );
}

function Optimizer() {
  const { world, passport } = useAppStore();
  const [budget, setBudget] = useState(60);
  const [preview, setPreview] = useState<Treaty | null>(null);
  const effectiveBudget = Math.min(budget, world.creditsRemaining);
  const result = engine.optimizeTreaties(world, effectiveBudget);
  const recommended = result.success ? result.data : null;
  let projected: WorldState = world;
  for (const id of recommended?.recommendedTreatyIds ?? []) {
    const purchase = engine.purchaseTreaty(projected, id);
    if (purchase.success) projected = purchase.data.nextState;
  }
  return (
    <>
      <PlayHeader page="optimizer" />
      <Heading
        eyebrow="MAKE A LITTLE GO FURTHER"
        title="Small budget. Bigger possibilities."
      >
        Find a starting point for your next move.
      </Heading>
      <div className="optimizer-layout">
        <section className="budget-panel">
          <span className="eyebrow">YOUR INFLUENCE BUDGET</span>
          <div className="budget-value">
            <Coins size={32} />
            <b>{effectiveBudget}</b>
            <span>credits</span>
          </div>
          <input
            type="range"
            aria-label="Influence budget"
            min="0"
            max={world.creditsRemaining}
            value={effectiveBudget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>0</span>
            <span>{world.creditsRemaining} available</span>
          </div>
          <h3>The idea</h3>
          <p>Grow the global modeled mobility score within your budget.</p>
          <span className="tag evisa">
            <Sparkles size={14} />
            Greedy suggestion
          </span>
          <p className="fine-print">
            A useful starting point, not a guaranteed best solution. The current
            engine ranks initial score gain per credit.
          </p>
          {recommended && (
            <div className="notice-box">
              <b>{recommended.totalCost} credits suggested</b>
              <p>
                +{recommended.projectedImpact.scoreDelta.toFixed(1)} global
                score ·{" "}
                {recommended.projectedImpact.newlyAccessiblePairs.length} new
                pairs
              </p>
            </div>
          )}
        </section>
        <section className="suggestions">
          <h2>A possible path</h2>
          {recommended?.recommendedTreatyIds.length ? (
            <>
              {recommended.recommendedTreatyIds.map((id, i) => (
                <div className="suggestion" key={id}>
                  <span className="step-number">{i + 1}</span>
                  <div>
                    <h3>{catalog.treaties.find((t) => t.id === id)!.name}</h3>
                    <span>
                      {catalog.treaties.find((t) => t.id === id)!.cost} credits
                    </span>
                  </div>
                  <Button
                    secondary
                    onClick={() =>
                      setPreview(catalog.treaties.find((t) => t.id === id)!)
                    }
                  >
                    Review <ArrowRight size={16} />
                  </Button>
                </div>
              ))}
              <p className="fine-print">
                Review and purchase each treaty individually. Suggestions update
                after every purchase.
              </p>
            </>
          ) : (
            <div className="empty-state">
              <Compass size={36} />
              <h3>
                {world.creditsRemaining
                  ? "A little more room?"
                  : "Your credits are all in the world."}
              </h3>
              <p>
                {world.creditsRemaining
                  ? "Increase the budget to find an affordable treaty."
                  : "Explore your impact or reset to try another approach."}
              </p>
            </div>
          )}
          <div className="projected-map">
            <div>
              <h3>Projected world</h3>
              <span>{country(passport).name} · preview only</span>
            </div>
            <WorldMap
              view={unwrap(engine.getPassportView(passport, projected))}
            />
          </div>
        </section>
      </div>
      {preview && (
        <TreatyPreview treaty={preview} onClose={() => setPreview(null)} />
      )}
      <Landscape />
    </>
  );
}

function More() {
  const { passport, setPassport, world, setDestination } = useAppStore();
  const [draw, setDraw] = useState<string | null>(null);
  return (
    <>
      <Heading eyebrow="A LITTLE MORE WONDER" title="Let curiosity lead.">
        One shared planet. So many ways to see it.
      </Heading>
      <div className="more-grid">
        <section className="lottery-card">
          <span className="eyebrow">PASSPORT LOTTERY</span>
          <h2>A different starting point.</h2>
          <p>
            Draw one of the {catalog.passports.length} supported passports and see the world through a
            new lens. Drawing previews a passport; your active selection changes only when you choose to explore it.
          </p>
          <PassportBook
            name={country(draw ?? passport).name}
            code={draw ?? passport}
          />
          <Button
            onClick={() => {
              const bytes = new Uint32Array(1);
              crypto.getRandomValues(bytes);
              const id =
                catalog.passports[bytes[0] % catalog.passports.length].id;
              setDraw(id);
            }}
          >
            <Shuffle size={18} />
            Draw a passport
          </Button>
          {draw && (
            <p role="status">
              You drew {country(draw).name}.{" "}
              <button className="text-button" onClick={() => { setPassport(draw); go("explore"); }}>
                Use this passport & explore <ArrowRight size={16} />
              </button>
            </p>
          )}
        </section>
        <section className="globe-card">
          <span className="eyebrow">A FRESH PERSPECTIVE</span>
          <h2>The world, a little rounder.</h2>
          <PassportSelect value={passport} onChange={setPassport} label="Globe passport" />
          <Legend />
          <WorldMap
            globe
            view={unwrap(
              engine.getPassportView(
                passport,
                GAME_ENABLED ? world : INITIAL_WORLD_STATE,
              ),
            )}
            onSelect={(id) => {
              setDestination(id);
              go("country");
            }}
          />
          <p>Turn the globe. Pick a colored country.</p>
        </section>
      </div>
      <div className="future-notes">
        <div>
          <Compass />
          <h3>Journeys between places</h3>
          <p>
            Transit and route planning need additional data. They’re not
            available yet.
          </p>
        </div>
        <div>
          <Sparkles />
          <h3>A helping hand?</h3>
          <p>
            Open a country notebook to research official sources with Groq.
            Research results need source review before travel planning.
          </p>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [routeHash, setRouteHash] = useState(window.location.hash);
  const requestedPage = readPage(routeHash);
  // Also guard existing sessions whose route was selected before the game pause.
  const page =
    !GAME_ENABLED && ["market", "impact", "optimizer"].includes(requestedPage)
      ? "explore"
      : requestedPage;
  const { notice, world, passport, destination, comparison } = useAppStore();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const change = () => {
      setRouteHash(window.location.hash);
      window.scrollTo({ top: 0, behavior: "instant" });
      main.current?.focus();
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = `${{ explore: "Explore", country: "Country notebook", compare: "Compare", dna: "Visa DNA", trips: "Plan a trip", market: "Border Market", impact: "Your impact", optimizer: "Optimizer", more: "More possibilities" }[page]} · aperiron`;
  }, [page]);
  const active =
    page === "country"
      ? "explore"
      : ["market", "impact", "optimizer"].includes(page)
        ? "market"
        : page;
  return (
    <div className="app">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a href={pageHash("explore", { passport, destination, comparison })} className="wordmark" aria-label="aperiron home">
          aperiron<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              ["explore", "Explore"],
              ["compare", "Compare"],
              ["dna", "Visa DNA"],
              ["trips", "Trips"],
              ["market", "Play"],
              ["more", "More"],
            ] as const
          )
            .filter(([route]) => GAME_ENABLED || route !== "market")
            .map(([route, label]) => (
              <a
                key={route}
                href={pageHash(route, { passport, destination, comparison })}
                aria-current={active === route ? "page" : undefined}
              >
                {label}
                {route === "market" && world.purchasedTreatyIds.length > 0 && (
                  <i />
                )}
              </a>
            ))}
        </nav>
        <span className="header-motto">
          A more open tomorrow <Sun size={25} />
        </span>
      </header>
      <main ref={main} tabIndex={-1} id="main" className={`page-${page}`}>
        {page === "explore" ? (
          <Explore />
        ) : page === "country" ? (
          <CountryPage inspectSecond={new URLSearchParams(routeHash.split("?")[1]).get("inspect") === "second"} />
        ) : page === "compare" ? (
          <Compare />
        ) : page === "dna" ? (
          <Dna />
        ) : page === "trips" ? (
          <TripPlanner />
        ) : GAME_ENABLED && page === "market" ? (
          <Market />
        ) : GAME_ENABLED && page === "impact" ? (
          <Impact />
        ) : GAME_ENABLED && page === "optimizer" ? (
          <Optimizer />
        ) : (
          <More />
        )}
      </main>
      <footer className="site-footer">
        <span>
          Made for a world of possibilities <Heart size={13} />
        </span>
        <span>Passport Index snapshot · {catalog.passports.length} passports · {catalog.destinations.length} destinations · unverified · <a href="https://github.com/mledoze/countries" target="_blank" rel="noreferrer">Country metadata (ODbL)</a></span>
      </footer>
      <div className="toast" role="status" key={notice}>
        {GAME_ENABLED ? notice : ""}
      </div>
    </div>
  );
}
