import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { CountryId, FrontendAdapter } from '../frontend/types'
import { mockFrontendAdapter } from '../mocks/frontendAdapter'

export function createExplorerStore(adapter: FrontendAdapter) {
  const initialPassport = adapter.getPassports()[0]?.id ?? ''
  return createStore<{
    passportId: CountryId
    destinationId: CountryId | null
    selectPassport: (id: CountryId) => void
    selectDestination: (id: CountryId | null) => void
    reset: () => void
  }>((set) => ({
    passportId: initialPassport,
    destinationId: null,
    selectPassport: id => {
      if (adapter.getPassports().some(country => country.id === id)) set({ passportId: id })
    },
    selectDestination: id => {
      if (id === null || adapter.getDestinations().some(country => country.id === id)) set({ destinationId: id })
    },
    reset: () => set({ passportId: initialPassport, destinationId: null }),
  }))
}
export const frontendAdapter = mockFrontendAdapter
const explorerStore = createExplorerStore(frontendAdapter)
export function useExplorer() { return useStore(explorerStore) }
