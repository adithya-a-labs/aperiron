import type { AccessLevel, Country, FrontendAdapter } from '../frontend/types'

// Deliberately fictional fixtures: no claim about current visa requirements.
const countries: readonly Country[] = [
  { id: 'IN', name: 'India', isoNumeric: '356' },
  { id: 'DE', name: 'Germany', isoNumeric: '276' },
  { id: 'JP', name: 'Japan', isoNumeric: '392' },
  { id: 'US', name: 'United States', isoNumeric: '840' },
  { id: 'BR', name: 'Brazil', isoNumeric: '076' },
  { id: 'ZA', name: 'South Africa', isoNumeric: '710' },
]
const sampleAccess: Record<string, readonly AccessLevel[]> = {
  IN: ['unknown', 'visa_required', 'evisa', 'visa_required', 'visa_on_arrival', 'unknown'],
  DE: ['evisa', 'unknown', 'visa_free', 'visa_free', 'visa_free', 'visa_on_arrival'],
  JP: ['evisa', 'visa_free', 'unknown', 'visa_free', 'visa_free', 'visa_required'],
}
export const mockFrontendAdapter: FrontendAdapter = {
  datasetLabel: 'Fictional sample · 3 passports / 6 destinations',
  getPassports: () => countries.slice(0, 3).map(country => ({ ...country })),
  getDestinations: () => countries.map(country => ({ ...country })),
  getAccess: passportId => countries.map((country, index) => ({
    countryId: country.id, access: sampleAccess[passportId]?.[index] ?? 'unknown',
  })),
  getRequirements(passportId, destinationId) {
    if (!sampleAccess[passportId] || !countries.some(country => country.id === destinationId)) return null
    const access = this.getAccess(passportId).find(item => item.countryId === destinationId)?.access ?? 'unknown'
    return {
      passportId, destinationId, access, dataKind: 'sample', purpose: 'Tourism (sample scenario)',
      stay: null, documents: [], application: null, fee: null,
      processing: null, verifiedAt: null, sources: [],
    }
  },
}
