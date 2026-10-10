import type { Country, CountryId, DestinationAccess } from '../frontend/types'
export interface WorldMapProps {
  destinations: readonly Country[]
  access: readonly DestinationAccess[]
  selectedDestinationId: CountryId | null
  onSelectDestination: (id: CountryId) => void
}
export function WorldMap({ destinations, onSelectDestination }: WorldMapProps) {
  return <div className="map-placeholder"><p>Select a destination to inspect its sample entry requirements.</p>
    <div className="destination-list">{destinations.map(country => <button key={country.id} onClick={() => onSelectDestination(country.id)}>{country.name}</button>)}</div>
  </div>
}
