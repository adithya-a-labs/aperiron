import type { PassportView } from '../shared/contracts';
import { primaryAccess, type TravelDetails } from '../shared/travelDetails';
import { calculateAccessBreakdown } from './scoring';

/** Provider updates affect exploration only. Score remains the versioned snapshot score. */
export function composeExploration(view: PassportView, details: readonly TravelDetails[]): PassportView {
  const updates = new Map(details.filter(d => d.passportId === view.passportId).map(d => [d.destinationId, d]));
  const destinations = view.destinations.map(d => {
    const detail = updates.get(d.destinationId), level = detail && primaryAccess(detail);
    return level && !d.isSimulated && d.destinationId !== view.passportId
      ? { ...d, accessLevel: level, maxStayDays: null, notes: `Travel Buddy · fetched ${detail.fetchedAt} · unverified` } : d;
  });
  return { ...view, destinations, accessBreakdown: calculateAccessBreakdown(destinations.map(d => d.accessLevel)) };
}
