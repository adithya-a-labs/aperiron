import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { useEffect } from 'react';
import { isTravelDetails, record, travelKey, type TravelDetails, type TravelResponse } from '../shared/travelDetails';

interface DetailState { entries: Record<string, TravelDetails>; messages: Record<string, string>; refreshing: Record<string, boolean> }
export function createTravelDetailsStore(fetchImpl: typeof fetch = fetch) {
  const store = createStore<DetailState>(() => ({ entries: {}, messages: {}, refreshing: {} }));
  const reads = new Map<string, Promise<void>>(), refreshes = new Map<string, Promise<void>>();
  const apply = (payload: unknown, passport: string, destination?: string) => {
    const v = record(payload); if (!Array.isArray(v.entries)) throw new Error();
    const entries = v.entries.filter(isTravelDetails).filter(d => d.passportId === passport && (!destination || d.destinationId === destination));
    store.setState(s => {
      const next = { ...s.entries };
      for (const d of entries) { const key = travelKey(d.passportId, d.destinationId); if (!next[key] || Date.parse(next[key].fetchedAt) <= Date.parse(d.fetchedAt)) next[key] = d; }
      return { entries: next, ...(destination ? { messages: { ...s.messages, [travelKey(passport, destination)]: typeof v.message === 'string' ? v.message : '' } } : {}) };
    });
    return v as unknown as TravelResponse;
  };
  const load = (passport: string) => {
    const existing = reads.get(passport); if (existing) return existing;
    const task = (async () => {
      try { const r = await fetchImpl(`/api/travel-details?passportId=${encodeURIComponent(passport)}`); if (r.ok) apply(await r.json(), passport); } catch { /* Static/offline app retains the bundled experience. */ }
    })().finally(() => reads.delete(passport));
    reads.set(passport, task); return task;
  };
  const refresh = (passport: string, destination: string, force = false) => {
    if (passport === destination) return Promise.resolve();
    const key = travelKey(passport, destination), existing = refreshes.get(key); if (existing) return existing;
    store.setState(s => ({ refreshing: { ...s.refreshing, [key]: true } }));
    const task = (async () => {
      try {
        const r = await fetchImpl('/api/travel-details/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passportId: passport, destinationId: destination, purpose: 'tourism', passportType: 'ordinary', force }) });
        if (!r.ok) throw new Error(); apply(await r.json(), passport, destination);
      } catch { store.setState(s => ({ messages: { ...s.messages, [key]: 'Showing saved information; live details are unavailable.' } })); }
      finally { store.setState(s => ({ refreshing: { ...s.refreshing, [key]: false } })); }
    })().finally(() => refreshes.delete(key));
    refreshes.set(key, task); return task;
  };
  return { store, load, refresh };
}
export const travelDetailsStore = createTravelDetailsStore();
export function useTravelDetails(passport: string, destination: string, token: string | number | null, purpose = 'tourism') {
  const state = useStore(travelDetailsStore.store);
  useEffect(() => { void travelDetailsStore.load(passport); }, [passport]);
  useEffect(() => {
    if (token === null || purpose !== 'tourism' || passport === destination) return;
    const timer = window.setTimeout(() => void travelDetailsStore.refresh(passport, destination), 400);
    return () => window.clearTimeout(timer);
  }, [passport, destination, purpose, token]);
  const key = travelKey(passport, destination);
  const retained = (d: TravelDetails) => !d.expiresAt || Date.parse(d.expiresAt) > Date.now();
  return { entries: Object.values(state.entries).filter(d => d.passportId === passport && retained(d)),
    detail: purpose === 'tourism' && state.entries[key] && retained(state.entries[key]) ? state.entries[key] : undefined, message: state.messages[key], refreshing: state.refreshing[key] ?? false,
    refresh: () => travelDetailsStore.refresh(passport, destination, true) };
}
