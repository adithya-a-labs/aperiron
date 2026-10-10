import { useEffect, useMemo, useRef, useState } from "react";
import {
  geoNaturalEarth1,
  geoOrthographic,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topology from "world-atlas/countries-110m.json";
import type { PassportView } from "../shared/contracts";
import { accessColors, accessLabels } from "../frontend/engine";

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
const countryCoords = new Map(COUNTRIES.map(c => [c.id, c.coordinates]));
function getCurvyPath(p1: [number, number], p2: [number, number]): string {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return `M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]}`;

  const ux = dx / dist;
  const uy = dy / dist;
  let nx = -uy;
  let ny = ux;
  // Always orient normal upwards towards north on the map (negative Y is up)
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }

  const pt = (uFrac: number, nPix: number): [number, number] => [
    Math.round((p1[0] + ux * (uFrac * dist) + nx * nPix) * 10) / 10,
    Math.round((p1[1] + uy * (uFrac * dist) + ny * nPix) * 10) / 10,
  ];

  if (dist >= 140) {
    // Whimsical double-loop flight trajectory matching user illustration
    const h = Math.min(Math.max(dist * 0.22, 24), 50);

    const p0 = pt(0, 0);
    // 1. Departure
    const c1a = pt(0.08, -h * 0.1);
    const c1b = pt(0.18, -h * 0.2);
    const end1 = pt(0.24, -h * 0.15);

    // 2. Loop 1 (loops upwards & crosses itself)
    const c2a = pt(0.38, h * 0.75);
    const c2b = pt(0.16, h * 0.75);
    const end2 = pt(0.32, -h * 0.05);

    // 3. Central crest wave
    const c3a = pt(0.42, h * 0.85);
    const c3b = pt(0.56, h * 0.85);
    const end3 = pt(0.66, -h * 0.05);

    // 4. Loop 2 (loops downwards & crosses itself)
    const c4a = pt(0.58, -h * 0.75);
    const c4b = pt(0.80, -h * 0.75);
    const end4 = pt(0.74, -h * 0.18);

    // 5. Arrival
    const c5a = pt(0.82, -h * 0.12);
    const c5b = pt(0.92, 0);
    const end5 = pt(1.0, 0);

    return `M ${p0[0]} ${p0[1]} C ${c1a[0]} ${c1a[1]}, ${c1b[0]} ${c1b[1]}, ${end1[0]} ${end1[1]} C ${c2a[0]} ${c2a[1]}, ${c2b[0]} ${c2b[1]}, ${end2[0]} ${end2[1]} C ${c3a[0]} ${c3a[1]}, ${c3b[0]} ${c3b[1]}, ${end3[0]} ${end3[1]} C ${c4a[0]} ${c4a[1]}, ${c4b[0]} ${c4b[1]}, ${end4[0]} ${end4[1]} C ${c5a[0]} ${c5a[1]}, ${c5b[0]} ${c5b[1]}, ${end5[0]} ${end5[1]}`;
  } else {
    // Graceful arch wave for shorter distances
    const h = Math.min(Math.max(dist * 0.28, 14), 32);
    const p0 = pt(0, 0);
    const c1 = pt(0.28, h * 0.75);
    const c2 = pt(0.72, h * 0.75);
    const p3 = pt(1.0, 0);
    return `M ${p0[0]} ${p0[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p3[0]} ${p3[1]}`;
  }
}

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
  const svgRef = useRef<SVGSVGElement>(null);
  const routeRef = useRef<SVGGElement>(null);
  const [rotation, setRotation] = useState(-20);
  const projection = useMemo(
    () =>
      globe
        ? geoOrthographic()
            .scale(205)
            .translate([400, 225])
            .rotate([rotation, -15])
        : geoNaturalEarth1().scale(145).translate([400, 240]),
    [globe, rotation],
  );
  const path = useMemo(
    () => geoPath(projection),
    [projection],
  );

  useEffect(() => {
    if (svgRef.current) {
      try {
        svgRef.current.setCurrentTime(0);
      } catch {}
    }
    if (routeRef.current) {
      const anims = routeRef.current.querySelectorAll("animate, animateMotion, animateTransform");
      anims.forEach((el) => {
        try {
          (el as SVGAnimationElement).beginElement();
        } catch {}
      });
    }
  }, [selected, view.passportId]);

  return (
    <div className={`world-map ${globe ? "globe-map" : ""}`}>
      <svg
        ref={svgRef}
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
                    ? "#a3a5a3"
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
            fill={isPassportCountry ? '#a3a5a3' : accessColors[access.accessLevel]}
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
        {Boolean(selected && view.passportId && selected !== view.passportId) && (() => {
          const originCoords = countryCoords.get(view.passportId);
          const destCoords = countryCoords.get(selected!);
          if (!originCoords || !destCoords) return null;
          const originVisible = !globe || path({ type: "Point", coordinates: originCoords }) !== null;
          const destVisible = !globe || path({ type: "Point", coordinates: destCoords }) !== null;
          const p1 = projection(originCoords);
          const p2 = projection(destCoords);
          if (!p1 || !p2) return null;
          const curveD = getCurvyPath(p1, p2);
          const maskId = `route-draw-mask-${view.passportId}-${selected}`;

          return (
            <g
              ref={routeRef}
              key={`route-${view.passportId}-${selected}`}
              className="map-route"
              pointerEvents="none"
              aria-hidden="true"
            >
              <defs>
                <mask id={maskId}>
                  <path
                    d={curveD}
                    fill="none"
                    stroke="white"
                    strokeWidth="32"
                    strokeLinecap="round"
                    pathLength="100"
                    className="route-mask-line"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="100"
                      to="0"
                      dur="1.2s"
                      fill="freeze"
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.25 0.1 0.25 1"
                    />
                  </path>
                </mask>
              </defs>

              {/* Anchor dot under origin pin */}
              {originVisible && (
                <circle cx={p1[0]} cy={p1[1]} r={2.5} fill="#000000" />
              )}

              {/* Origin map pin (marked from start) */}
              {originVisible && (
                <g
                  transform={`translate(${p1[0]},${p1[1] - 8})`}
                  className="map-pin"
                >
                  <path
                    d="M0-9a6 6 0 0 1 6 6C6 2 0 8 0 8S-6 2-6-3a6 6 0 0 1 6-6"
                    fill="#D00000"
                    stroke="#000000"
                    strokeWidth={0.6}
                  />
                  <circle cy="-3" r="2" fill="#fffdf7" />
                </g>
              )}

              {/* Curvy dashed animated route line in black */}
              {originVisible && destVisible && (
                <path
                  d={curveD}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  mask={`url(#${maskId})`}
                />
              )}

              {/* Red arrow flying at head of the path */}
              {originVisible && destVisible && (
                <g>
                  <animateMotion
                    path={curveD}
                    dur="1.2s"
                    rotate="auto"
                    fill="freeze"
                    calcMode="spline"
                    keyTimes="0;1"
                    keySplines="0.25 0.1 0.25 1"
                  />
                  <path
                    d="M-8,-4.5 L5,0 L-8,4.5 L-5,0 Z"
                    fill="#D00000"
                    stroke="#000000"
                    strokeWidth={0.6}
                  />
                </g>
              )}

              {/* Anchor dot under destination pin */}
              {destVisible && (
                <circle cx={p2[0]} cy={p2[1]} r={2.5} fill="#000000" />
              )}

              {/* Destination map pin popping up when arrow arrives */}
              {destVisible && (
                <g transform={`translate(${p2[0]},${p2[1]})`}>
                  <g className="map-pin-pop">
                    <animateTransform
                      attributeName="transform"
                      type="scale"
                      values="0;0;1.35;0.92;1"
                      keyTimes="0;0.72;0.86;0.94;1"
                      dur="1.6s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0;1;1;1"
                      keyTimes="0;0.72;0.86;0.94;1"
                      dur="1.6s"
                      fill="freeze"
                    />
                    <g transform="translate(0,-8)" className="map-pin">
                      <path
                        d="M0-9a6 6 0 0 1 6 6C6 2 0 8 0 8S-6 2-6-3a6 6 0 0 1 6-6"
                        fill="#D00000"
                        stroke="#000000"
                        strokeWidth={0.6}
                      />
                      <circle cy="-3" r="2" fill="#fffdf7" />
                    </g>
                  </g>
                </g>
              )}
            </g>
          );
        })()}
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
