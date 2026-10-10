/** Provisional frontend view contract. Not the frozen core-engine API. */
export type CountryId = string
export type AccessLevel = 'visa_free' | 'visa_on_arrival' | 'evisa' | 'visa_required' | 'restricted' | 'unknown'
export interface Country { id: CountryId; name: string; isoNumeric: string }
export interface DestinationAccess { countryId: CountryId; access: AccessLevel }
export interface Requirements {
  passportId: CountryId
  destinationId: CountryId
  access: AccessLevel
  dataKind: 'sample' | 'sourced'
  purpose: string
  stay: string | null
  documents: readonly string[]
  application: string | null
  fee: string | null
  processing: string | null
  verifiedAt: string | null
  sources: readonly { title: string; url: string }[]
}
export interface FrontendAdapter {
  datasetLabel: string
  getPassports(): readonly Country[]
  getDestinations(): readonly Country[]
  getAccess(passportId: CountryId): readonly DestinationAccess[]
  getRequirements(passportId: CountryId, destinationId: CountryId): Requirements | null
}
export const ACCESS_LABELS: Record<AccessLevel, string> = {
  visa_free: 'Visa-free', visa_on_arrival: 'Visa on arrival', evisa: 'eVisa',
  visa_required: 'Visa required', restricted: 'Restricted', unknown: 'Unknown',
}
