import type { Country, Requirements } from '../frontend/types'
export interface DestinationPanelProps {
  passport: Country
  destination: Country | null
  requirements: Requirements | null
  onClose: () => void
}
export function DestinationPanel({ destination, passport, onClose }: DestinationPanelProps) {
  return <aside className="destination-panel"><p className="eyebrow">DESTINATION BRIEF</p>
    <h2>{destination?.name ?? 'Where will you go?'}</h2>
    <p>{destination ? `${passport.name} passport · fictional sample` : 'Choose a country on the map or in the destination list.'}</p>
    {destination && <button onClick={onClose}>Close destination</button>}
  </aside>
}
