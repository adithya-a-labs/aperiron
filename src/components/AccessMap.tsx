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

import { COUNTRIES } from '../data/countryCatalog';
import { getMapCountryId } from '../data/mapCountries';

const world = feature(
  topology as unknown as Topology<{ countries: GeometryCollection }>,
  (topology as unknown as Topology<{ countries: GeometryCollection }>).objects
    .countries,
);
// Small islands and microstates omitted by 110m geography remain selectable.
const mappedIds = new Set(world.features.map(f => getMapCountryId(f.id, (f.properties as { name?: string })?.name)));
const pointCountries = COUNTRIES.filter(c => c.isDestinationSupported && !mappedIds.has(c.id));
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
        aria-label={`Snapshot access map for ${view.passportName}`}
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
            const code = getMapCountryId(f.id, (f.properties as { name?: string })?.name);
            const access = view.destinations.find(
              (d) => d.destinationId === code,
            );
            const isPassportCountry = code === view.passportId;
            const isSelected = Boolean(selected && selected === code);
            return (
              <path
                key={`${f.id ?? "country"}-${index}`}
                d={path(f) ?? ""}
                fill={
                  isPassportCountry
                    ? "#fc2b86"
                    : access
                      ? accessColors[access.accessLevel]
                      : `url(#${globe ? "globe-unsupported" : "unsupported"})`
                }
                opacity={isPassportCountry || isSelected ? 1 : access ? 0.8 : 1}
                stroke={isSelected ? "#032B43" : isPassportCountry ? "#032B43" : "#fffdf7"}
                strokeWidth={isSelected ? 2 : isPassportCountry ? 1.2 : 0.6}
                className={access ? "map-country" : ""}
                tabIndex={access && onSelect ? 0 : undefined}
                role={access && onSelect ? "button" : undefined}
                style={{ outline: "none" }}
                aria-label={
                  access
                    ? `${access.destinationName}: ${accessLabels[access.accessLevel]}`
                    : undefined
                }
                onClick={() => access && onSelect?.(code!)}
                onKeyDown={(e) => {
                  if (access && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect?.(code!);
                  }
                }}
              >
                <title>
                  {access
                    ? `${access.destinationName}: ${accessLabels[access.accessLevel]}`
                    : `${(f.properties as { name?: string })?.name}: outside catalog coverage`}
                </title>
              </path>
            );
          })}
        {pointCountries.map(country => {
          const access = view.destinations.find(d => d.destinationId === country.id);
          const point = path({ type: 'Point', coordinates: country.coordinates });
          if (!access || !point) return null;
          const isPassportCountry = country.id === view.passportId;
          const isSelected = selected === country.id;
          const label = country.name + ': ' + accessLabels[access.accessLevel];
          return <path key={country.id} d={point}
            fill={isPassportCountry ? '#fc2b86' : accessColors[access.accessLevel]}
            stroke={isSelected ? '#032B43' : isPassportCountry ? '#032B43' : '#fffdf7'}
            strokeWidth={isSelected ? 2.5 : isPassportCountry ? 1.5 : 0.8}
            className="map-country" role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined} aria-label={label}
            style={{ outline: "none" }}
            onClick={() => onSelect?.(country.id)}
            onKeyDown={e => {
              if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault(); onSelect(country.id);
              }
            }}><title>{label}</title></path>;
        })}
        {selected && (() => {
          const selectedFeature = world.features.find(
            (f) =>
              String(f.id) !== "010" &&
              getMapCountryId(f.id, (f.properties as { name?: string })?.name) ===
                selected,
          );
          if (selectedFeature) {
            return (
              <path
                d={path(selectedFeature) ?? ""}
                fill="none"
                stroke="#032B43"
                strokeWidth={2}
                style={{ outline: "none", pointerEvents: "none" }}
                aria-hidden="true"
              />
            );
          }
          const selectedPoint = pointCountries.find((c) => c.id === selected);
          if (selectedPoint) {
            const pt = path({ type: "Point", coordinates: selectedPoint.coordinates });
            if (pt) {
              return (
                <path
                  d={pt}
                  fill="none"
                  stroke="#032B43"
                  strokeWidth={2.5}
                  style={{ outline: "none", pointerEvents: "none" }}
                  aria-hidden="true"
                />
              );
            }
          }
          return null;
        })()}
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
