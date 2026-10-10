import { getFullCatalog } from "../data/catalog";
import { BASELINE_ACCESS_MATRIX } from "../data/baselineMatrix";
import { MockAperironEngine } from "../mocks/mockEngine";
import { success, type AccessLevel } from "../shared/contracts";

// The current matrix is a prototype, not verified travel advice. Do not expose
// the data module's fabricated generic fees, application URLs or stay limits.
export const engine = new MockAperironEngine(getFullCatalog(), {
  baselineMatrix: BASELINE_ACCESS_MATRIX,
  requirementsResolver: ({ passportId, destinationId, travellerContext }) =>
    success({
      recordId: `unverified-${passportId}-${destinationId}`,
      passportId,
      destinationId,
      purpose: travellerContext?.purpose ?? "tourism",
      accessLevel: "unknown",
      maxStayDays: null,
      documents: [],
      applicationChannel: {
        type: "none",
        name: "Not verified",
        notes: "Application information is unavailable.",
      },
      sources: [],
      verifiedAt: "",
      isSimulated: false,
      unresolvedConditions: [
        "Verified passport-specific requirements are not available in this prototype.",
      ],
    }),
});
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
