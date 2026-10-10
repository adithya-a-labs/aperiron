import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createExplorerStore } from './explorerStore'
import { mockFrontendAdapter } from '../mocks/frontendAdapter'

describe('passport/destination selection boundary', () => {
  it('keeps the destination when switching passport and resolves matching details', () => {
    const store = createExplorerStore(mockFrontendAdapter)
    store.getState().selectDestination('JP')
    store.getState().selectPassport('DE')
    const { passportId, destinationId } = store.getState()
    const details = mockFrontendAdapter.getRequirements(passportId, destinationId!)
    assert.equal(destinationId, 'JP')
    assert.equal(details?.passportId, 'DE')
    assert.equal(details?.destinationId, 'JP')
    assert.equal(details?.access, 'visa_free')
    assert.equal(details?.dataKind, 'sample')
    assert.equal(details?.verifiedAt, null)
    assert.deepEqual(details?.sources, [])
  })
  it('rejects invalid selection IDs without corrupting a valid selection', () => {
    const store = createExplorerStore(mockFrontendAdapter)
    store.getState().selectDestination('JP')
    store.getState().selectPassport('XX')
    store.getState().selectDestination('XX')
    assert.equal(store.getState().passportId, 'IN')
    assert.equal(store.getState().destinationId, 'JP')
    assert.equal(mockFrontendAdapter.getRequirements('XX', 'JP'), null)
  })
  it('reset restores initial selection without editing the adapter', () => {
    const store = createExplorerStore(mockFrontendAdapter)
    store.getState().selectPassport('DE')
    store.getState().selectDestination('BR')
    store.getState().reset()
    assert.equal(store.getState().passportId, 'IN')
    assert.equal(store.getState().destinationId, null)
    assert.equal(mockFrontendAdapter.getAccess('XX').every(item => item.access === 'unknown'), true)
  })
})
