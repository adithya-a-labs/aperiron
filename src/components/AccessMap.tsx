import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { geoNaturalEarth1, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import topology from 'world-atlas/countries-110m.json';
import type { PassportView } from '../shared/contracts';
import { accessColors, accessLabels } from '../frontend/engine';
import { COUNTRIES } from '../data/countryCatalog';
import { getMapCountryId } from '../data/mapCountries';

const world = feature(topology as unknown as Topology<{ countries: GeometryCollection }>,
  (topology as unknown as Topology<{ countries: GeometryCollection }>).objects.countries);
const mappedIds = new Set(world.features.map(f => getMapCountryId(f.id, (f.properties as { name?: string })?.name)));
const pointCountries = COUNTRIES.filter(c => c.isDestinationSupported && !mappedIds.has(c.id));
const coordinates = new Map(COUNTRIES.map(c => [c.id, c.coordinates]));

export function WorldMap({ view, onSelect, selected, globe = false }: {
  view: PassportView; onSelect?: (id: string) => void; selected?: string; globe?: boolean;
}) {
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [rotation, setRotation] = useState(-20);
  const [focusedId, setFocusedId] = useState<string>();
  const projection = useMemo(() => globe
    ? geoOrthographic().scale(205).translate([400, 225]).rotate([rotation, -15])
    : geoNaturalEarth1().scale(145).translate([400, 240]), [globe, rotation]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const accessById = new Map(view.destinations.map(d => [d.destinationId, d]));
  const shapes = [
    ...world.features.filter(f => String(f.id) !== '010').map((f, index) => ({
      key: `shape-${index}`, code: getMapCountryId(f.id, (f.properties as { name?: string })?.name),
      name: (f.properties as { name?: string })?.name, d: path(f),
    })),
    ...pointCountries.map(c => ({ key: c.id, code: c.id, name: c.name,
      d: path({ type: 'Point', coordinates: c.coordinates }) })),
  ].filter(shape => Boolean(shape.d));
  // Clipped-away globe countries never enter the DOM or keyboard order.
  const visible = shapes.filter(s => s.code && accessById.has(s.code))
    .sort((a, b) => accessById.get(a.code!)!.destinationName.localeCompare(accessById.get(b.code!)!.destinationName));
  const activeId = visible.find(s => s.code === focusedId)?.code
    ?? visible.find(s => s.code === selected)?.code ?? visible[0]?.code;

  function navigate(event: KeyboardEvent<SVGPathElement>, code: string) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect?.(code); return; }
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = visible.findIndex(s => s.code === code);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1
      : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + visible.length) % visible.length;
    const nextId = visible[next]?.code;
    setFocusedId(nextId);
    svg.current?.querySelector<SVGPathElement>(`[data-country="${nextId}"]`)?.focus();
  }
  const origin = coordinates.get(view.passportId);
  const destination = selected ? coordinates.get(selected) : undefined;
  const start = origin && projection(origin);
  const end = destination && projection(destination);

  return <div className={`world-map ${globe ? 'globe-map' : ''}`}>
    {onSelect && <p className="map-keyboard-help" id={`${id}-help`}>
      Map keyboard: arrow keys browse names; Enter selects. Tab leaves the map.
    </p>}
    <svg ref={svg} viewBox="0 0 800 450" role="group" aria-label={`Access map for ${view.passportName}`}
      aria-describedby={onSelect ? `${id}-help` : undefined}>
      <defs><pattern id={`${id}-unsupported`} width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="#e9e7df" /><path d="m0 5 5-5" stroke="#c0bdb4" strokeWidth=".8" />
      </pattern></defs>
      {globe && <circle cx="400" cy="225" r="205" fill="#e0eef0" />}
      {shapes.map(shape => {
        const access = shape.code ? accessById.get(shape.code) : undefined;
        const self = shape.code === view.passportId;
        const chosen = shape.code === selected;
        const label = access ? `${access.destinationName}: ${accessLabels[access.accessLevel]}${self ? ' (passport country)' : ''}`
          : `${shape.name}: outside catalog coverage`;
        return <path key={shape.key} d={shape.d!} data-country={shape.code}
          fill={self ? '#a3a5a3' : access ? accessColors[access.accessLevel] : `url(#${id}-unsupported)`}
          opacity={self || chosen || !access ? 1 : .8}
          stroke={chosen || self ? '#032B43' : '#fffdf7'} strokeWidth={chosen ? 2 : self ? 1.2 : .6}
          className={access && onSelect ? 'map-country' : undefined}
          tabIndex={access && onSelect ? shape.code === activeId ? 0 : -1 : undefined}
          role={access && onSelect ? 'button' : undefined} aria-label={access ? label : undefined}
          aria-pressed={access && onSelect ? chosen : undefined}
          onFocus={() => setFocusedId(shape.code)}
          onClick={() => { if (access) { setFocusedId(shape.code); onSelect?.(shape.code!); } }}
          onKeyDown={event => { if (access && onSelect) navigate(event, shape.code!); }}>
          <title>{label}</title>
        </path>;
      })}
      {/* A static connection indicates the pair, not an available flight route. */}
      {!globe && selected !== view.passportId && start && end && <g aria-hidden="true" pointerEvents="none">
        <path d={`M${start[0]},${start[1]} Q${(start[0] + end[0]) / 2},${Math.min(start[1], end[1]) - 24} ${end[0]},${end[1]}`}
          fill="none" stroke="#032b43" strokeWidth="1.5" strokeDasharray="5 4" />
        {[start, end].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#d00000" stroke="#fffdf7" strokeWidth="1.5" />)}
      </g>}
    </svg>
    {globe && <div className="globe-controls">
      <button className="pill" onClick={() => setRotation(r => r - 30)} aria-label="Rotate globe west">←</button>
      <span>Turn the world</span>
      <button className="pill" onClick={() => setRotation(r => r + 30)} aria-label="Rotate globe east">→</button>
    </div>}
  </div>;
}
