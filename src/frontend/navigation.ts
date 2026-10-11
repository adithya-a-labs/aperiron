import { catalog } from './engine';
import { GAME_ENABLED } from './features';

export const pages = ['explore', 'country', 'compare', 'dna', 'trips', 'market', 'impact', 'optimizer', 'more'] as const;
export type Page = typeof pages[number];
export interface Selection { passport: string; destination: string; comparison: string }
export function readPage(hash: string): Page {
  const value = hash.replace(/^#\//, '').split('?')[0];
  if (!GAME_ENABLED && ['market', 'impact', 'optimizer'].includes(value)) return 'explore';
  return pages.includes(value as Page) ? value as Page : 'explore';
}
export function readSelection(hash: string, fallback: Selection): Selection {
  const params = new URLSearchParams(hash.split('?')[1]);
  const valid = (key: string, choices: readonly { id: string }[], previous: string) => {
    const value = params.get(key)?.toUpperCase();
    return choices.some(c => c.id === value) ? value! : previous;
  };
  return {
    passport: valid('passport', catalog.passports, fallback.passport),
    destination: valid('destination', catalog.destinations, fallback.destination),
    comparison: valid('comparison', catalog.passports, fallback.comparison),
  };
}
export function pageHash(page: Page, selection: Selection, inspect?: 'second'): string {
  const params = new URLSearchParams({ passport: selection.passport, destination: selection.destination, comparison: selection.comparison });
  if (page === 'country' && inspect) params.set('inspect', inspect);
  return `#/${page}?${params}`;
}
