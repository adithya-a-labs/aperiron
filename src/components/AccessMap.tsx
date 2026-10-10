import { useMemo, useState } from "react";
import {
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
  type GeoProjection,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";
import type { PassportView } from "../shared/contracts";
import { accessColors, accessLabels, catalog } from "../frontend/engine";

const iso: Record<string, string> = {
  "702": "SG",
  "392": "JP",
  "356": "IN",
  "764": "TH",
  "360": "ID",
  "410": "KR",
  "704": "VN",
  "784": "AE",
  "634": "QA",
  "276": "DE",
  "826": "GB",
  "250": "FR",
  "380": "IT",
  "724": "ES",
  "756": "CH",
  "792": "TR",
  "268": "GE",
  "840": "US",
  "124": "CA",
  "076": "BR",
  "484": "MX",
  "032": "AR",
  "710": "ZA",
  "818": "EG",
  "404": "KE",
  "504": "MA",
  "566": "NG",
  "036": "AU",
  "554": "NZ",
  "242": "FJ",
};
const world = feature(
  topology as unknown as Topology<{ countries: GeometryCollection }>,
  (topology as unknown as Topology<{ countries: GeometryCollection }>).objects
    .countries,
);
const pins: Record<string, [number, number]> = {
  JP: [138, 36],
  CA: [-108, 58],
  BR: [-52, -12],
  AU: [134, -24],
};
export function WorldMap({
  view,
  onSelect,
  selected,
  globe = false,
}: {
  view: PassportView;
  onSelect?: (id: string) => void;
  selected?: string;
  globe?: boolean;
}) {
  const [rotation, setRotation] = useState(-20);
  const path = useMemo(
    () =>
      geoPath(
        globe
          ? geoOrthographic()
              .scale(205)
              .translate([400, 225])
              .rotate([rotation, -15])
          : geoNaturalEarth1().scale(145).translate([400, 240]),
      ),
    [globe, rotation],
  );
  const projection = path.projection() as GeoProjection;
  return (
    <div className={`world-map ${globe ? "globe-map" : ""}`}>
      <svg
        viewBox="0 0 800 450"
        role="group"
        aria-label={`Prototype access map for ${view.passportName}`}
      >
        <defs>
          <pattern
            id={globe ? "globe-unsupported" : "unsupported"}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
          >
            <rect width="5" height="5" fill="#e9e7df" />
            <path d="m0 5 5-5" stroke="#dfdcd2" strokeWidth=".6" />
          </pattern>
        </defs>
        {globe && <circle cx="400" cy="225" r="205" fill="#e0eef0" />}
        {world.features
          .filter((f) => String(f.id) !== "010")
          .map((f, index) => {
            const code = iso[String(f.id).padStart(3, "0")];
            const access = view.destinations.find(
              (d) => d.destinationId === code,
            );
            return (
              <path
                key={`${f.id ?? "country"}-${index}`}
                d={path(f) ?? ""}
                fill={
                  access
                    ? accessColors[access.accessLevel]
                    : `url(#${globe ? "globe-unsupported" : "unsupported"})`
                }
                opacity={access ? 0.8 : 1}
                stroke={selected && selected === code ? "#032B43" : "#fffdf7"}
                strokeWidth={selected && selected === code ? 2 : 0.6}
                className={access ? "map-country" : ""}
                tabIndex={access && onSelect ? 0 : undefined}
                role={access && onSelect ? "button" : undefined}
                aria-label={
                  access
                    ? `${access.destinationName}: ${accessLabels[access.accessLevel]}`
                    : undefined
                }
                onClick={() => access && onSelect?.(code)}
                onKeyDown={(e) => {
                  if (access && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect?.(code);
                  }
                }}
              >
                <title>
                  {access
                    ? `${access.destinationName}: ${accessLabels[access.accessLevel]}`
                    : `${(f.properties as { name?: string })?.name}: outside prototype coverage`}
                </title>
              </path>
            );
          })}
        {!globe &&
          Object.entries(pins).map(([code, coordinates]) => {
            const xy = projection(coordinates);
            if (!xy) return null;
            return (
              <g
                key={code}
                transform={`translate(${xy[0]},${xy[1]})`}
                onClick={() => onSelect?.(code)}
                className="map-pin"
                aria-hidden="true"
              >
                <rect
                  x="-10"
                  y="-13"
                  width={code === "AU" ? 85 : 76}
                  height="24"
                  rx="10"
                  fill="#fffdf7"
                  stroke="#e7e3d9"
                />
                <path
                  d="M0-9a6 6 0 0 1 6 6C6 2 0 8 0 8S-6 2-6-3a6 6 0 0 1 6-6"
                  fill="#D00000"
                />
                <circle cy="-3" r="2" fill="white" />
                <text
                  x="12"
                  y="3"
                  fontSize="10"
                  fontWeight="700"
                  fill="#032B43"
                >
                  {catalog.destinations.find((d) => d.id === code)?.name}
                </text>
              </g>
            );
          })}
      </svg>
      {globe && (
        <div className="globe-controls">
          <button
            className="pill"
            onClick={() => setRotation(rotation - 30)}
            aria-label="Rotate globe west"
          >
            ←
          </button>
          <span>Turn the world</span>
          <button
            className="pill"
            onClick={() => setRotation(rotation + 30)}
            aria-label="Rotate globe east"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
