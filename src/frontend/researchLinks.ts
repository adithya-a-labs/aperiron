import { safeTravelUrl } from '../shared/travelDetails';

/** Extract only explicit HTTPS leads. Keep the model answer as escaped text. */
export function researchLinks(answer: string): string[] {
  const candidates = answer.match(/https:\/\/[^\s<>"\]\)]+/g) ?? [];
  return [...new Set(candidates.map(value => safeTravelUrl(value.replace(/[.,;:!?]+$/, '')))
    .filter((value): value is string => value !== null))];
}
