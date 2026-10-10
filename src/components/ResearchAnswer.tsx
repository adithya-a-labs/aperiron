import { researchLinks } from '../frontend/researchLinks';

export function ResearchAnswer({ answer }: { answer: string }) {
  const links = researchLinks(answer);
  return <>
    <p>{answer}</p>
    {links.length > 0 && <div className="research-leads">
      <h4>Unverified source leads</h4>
      <p>These links came from web research. Check the source and its applicability.</p>
      <ul>{links.map((url, index) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">
        Lead {index + 1}: {new URL(url).hostname} ↗<span className="source-url">{url}</span>
      </a></li>)}</ul>
    </div>}
  </>;
}
