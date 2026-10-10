import { realEngine } from "../engine/realEngine";
import type { AperironEngine } from "../shared/engineApi";
import type { AccessLevel } from "../shared/contracts";

// One authoritative engine powers every active page and the UI store.
export const engine: AperironEngine = realEngine;
export const catalog = engine.getCatalog();
export const accessLabels: Record<AccessLevel, string> = {
  visa_free: "Visa-free",
  visa_on_arrival: "On arrival",
  evisa: "eVisa",
  visa_required: "Visa required",
  restricted: "Restricted",
  unknown: "Unknown",
};
export const accessColors: Record<AccessLevel, string> = {
  visa_free: "#136F63",
  visa_on_arrival: "#70bcb1",
  evisa: "#3F88C5",
  visa_required: "#FFBA08",
  restricted: "#D00000",
  unknown: "#c9c7bf",
};
