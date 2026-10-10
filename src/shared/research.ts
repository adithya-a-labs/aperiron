import type { TravellerContext } from "./contracts";

export interface ResearchRequest {
  passportId: string;
  destinationId: string;
  purpose: NonNullable<TravellerContext["purpose"]>;
}

/** Retrieved model text is unreviewed and never a DestinationRequirements record. */
export interface ResearchResponse {
  answer: string;
  model: string;
  retrievedAt: string;
  disclaimer: string;
}

export function isResearchResponse(value: unknown): value is ResearchResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ResearchResponse>;
  return [data.answer, data.model, data.retrievedAt, data.disclaimer].every(
    (field) => typeof field === "string" && field.trim().length > 0,
  );
}
