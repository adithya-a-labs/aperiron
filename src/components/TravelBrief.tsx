import type { TravelDetails, TravelRule } from '../shared/travelDetails';

function RuleLine({ label, rule }: { label: string; rule: TravelRule }) {
  return <div className="travel-rule"><dt>{label}</dt><dd>
    <b>{rule.name}</b>{rule.duration && ` · ${rule.duration}`}
    {rule.condition && <p>{rule.condition}</p>}
    {rule.countryCodes.length > 0 && <p>Provider condition codes: {rule.countryCodes.join(', ')}. Check the linked guidance for eligibility.</p>}
    {rule.link && <a className="rule-action" href={rule.link} target="_blank" rel="noreferrer">{label === 'Arrival registration' ? 'Open registration form' : 'Open application / guidance'} ↗</a>}
  </dd></div>;
}
export function TravelBrief({ detail, message, refreshing, onRefresh, changed }: {
  detail?: TravelDetails; message?: string; refreshing: boolean; onRefresh: () => void; changed: boolean;
}) {
  return <section className="travel-brief" aria-label="Travel Buddy details">
    <div className="travel-heading"><div><span className="eyebrow">DESTINATION DETAILS</span>
      <h3>Entry & arrival information</h3></div>
      <button className="text-button" onClick={onRefresh} disabled={refreshing}>{refreshing ? 'Checking…' : 'Refresh details'}</button>
    </div>
    <p className="travel-status" role="status">{detail ? `Travel Buddy · last checked ${new Date(detail.fetchedAt).toLocaleString()} · unverified provider information` : 'Saved snapshot shown. Additional details appear when available.'}
      {changed && <span> · Requirements updated from the snapshot</span>}</p>
    {message && <p className="travel-status">{message}</p>}
    {detail && <>
      <dl className="requirements">
        <RuleLine label="Primary visa rule" rule={detail.primary} />
        {detail.secondary && <RuleLine label="Alternative option" rule={detail.secondary} />}
        {detail.exception && <RuleLine label="Conditional exception" rule={detail.exception} />}
        {detail.registration && <RuleLine label="Arrival registration" rule={detail.registration} />}
        <div><dt>Passport validity</dt><dd>{detail.passportValidity ?? 'Not provided'}</dd></div>
      </dl>
      <p className="travel-status">Application and registration links are supplied by Travel Buddy and may redirect. Arrival registration does not replace a visa. Confirm eligibility and supporting documents with the destination authority.</p>
      {detail.embassyUrl && <a href={detail.embassyUrl} target="_blank" rel="noreferrer">Embassy directory (third party) ↗</a>}
    </>}
  </section>;
}
