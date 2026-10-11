import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";
import { COUNTRIES } from "../../data/countryCatalog";
import { getMapCountryId } from "../../data/mapCountries";
import type { DestinationRow } from "../../frontend/assistantClient";

export const assessmentLabels = {
  baseline_match: "Baseline match",
  needs_review: "Needs review",
  unassessed: "Unassessed",
  does_not_match: "Does not match",
};
const colors = {
  baseline_match: "#5eaa9d",
  needs_review: "#f4c95b",
  unassessed: "#c7c9c7",
  does_not_match: "#e7ddd0",
};
const world = feature(
  topology as unknown as Topology<{ countries: GeometryCollection }>,
  (topology as unknown as Topology<{ countries: GeometryCollection }>).objects
    .countries,
);
const mapped = new Set(
  world.features.map((f) =>
    getMapCountryId(f.id, (f.properties as { name?: string })?.name),
  ),
);
const projection = geoNaturalEarth1().scale(145).translate([400, 235]);
const path = geoPath(projection);
const shapes = [
  ...world.features
    .filter((f) => String(f.id) !== "010")
    .map((f, i) => ({
      key: `shape-${i}`,
      code: getMapCountryId(f.id, (f.properties as { name?: string })?.name),
      d: path(f),
    })),
  ...COUNTRIES.filter((c) => c.isDestinationSupported && !mapped.has(c.id)).map(
    (c) => ({
      key: c.id,
      code: c.id,
      d: path({ type: "Point", coordinates: c.coordinates }),
    }),
  ),
];

export function GroupMap({
  rows,
  selected,
  onSelect,
}: {
  rows: DestinationRow[];
  selected: string;
  onSelect(id: string): void;
}) {
  const id = useId().replaceAll(":", "");
  const [focused, setFocused] = useState("");
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) =>
        a.destinationName.localeCompare(b.destinationName),
      ),
    [rows],
  );
  const byId = new Map(rows.map((r) => [r.destinationId, r]));
  const active = byId.has(focused)
    ? focused
    : byId.has(selected)
      ? selected
      : sorted[0]?.destinationId;
  function navigate(event: KeyboardEvent<SVGSVGElement>) {
    if (!active) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(active);
      return;
    }
    if (
      ![
        "ArrowRight",
        "ArrowLeft",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    const index = sorted.findIndex((r) => r.destinationId === active);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? sorted.length - 1
          : (index +
              (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) +
              sorted.length) %
            sorted.length;
    setFocused(sorted[next].destinationId);
  }
  return (
    <div className="trip-map">
      <svg
        viewBox="0 0 800 430"
        role="listbox"
        tabIndex={0}
        aria-label="Group destination map"
        aria-activedescendant={active ? `${id}-${active}` : undefined}
        onKeyDown={navigate}
      >
        <defs>
          <pattern
            id={`${id}-empty`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="#e5edf0" />
            <path d="m0 6 6-6" stroke="#cbdce1" strokeWidth=".7" />
          </pattern>
        </defs>
        {shapes.map((shape) => {
          const row = shape.code ? byId.get(shape.code) : undefined;
          return (
            <path
              key={shape.key}
              d={shape.d ?? undefined}
              id={row ? `${id}-${row.destinationId}` : undefined}
              role={row ? "option" : undefined}
              aria-selected={row ? selected === row.destinationId : undefined}
              aria-label={
                row
                  ? `${row.destinationName}: ${assessmentLabels[row.groupAssessment]}`
                  : undefined
              }
              fill={row ? colors[row.groupAssessment] : `url(#${id}-empty)`}
              stroke={
                row &&
                (row.destinationId === selected ||
                  row.destinationId === focused)
                  ? "#032b43"
                  : "#fffdf7"
              }
              strokeWidth={
                row &&
                (row.destinationId === selected ||
                  row.destinationId === focused)
                  ? 2
                  : 0.7
              }
              className={row ? "trip-country" : undefined}
              onClick={() => {
                if (row) {
                  setFocused(row.destinationId);
                  onSelect(row.destinationId);
                }
              }}
            >
              <title>
                {row
                  ? `${row.destinationName}: ${assessmentLabels[row.groupAssessment]}`
                  : "Outside current results"}
              </title>
            </path>
          );
        })}
      </svg>
      <div className="trip-map-legend">
        {Object.entries(assessmentLabels).map(([key, label]) => (
          <span key={key}>
            <i style={{ background: colors[key as keyof typeof colors] }} />
            {label}
          </span>
        ))}
        <span>
          <i className="trip-hatch" />
          Outside results
        </span>
      </div>
    </div>
  );
}
