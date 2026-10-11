import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus, Trash2, X, Users, ArrowRight } from "lucide-react";
import { catalog } from "../../frontend/engine";
import type { Profile, Trip } from "../../shared/assistant/schemas";
import { useTripPlanner } from "../../store/tripPlannerStore";

const countries = [...catalog.passports].sort((a, b) =>
  a.name.localeCompare(b.name),
);
export function newTraveller(
  passportId = "",
  index = 1,
): Trip["travellers"][number] {
  return {
    id: crypto.randomUUID(),
    label: `Traveller ${index}`,
    profile: {
      passportId,
      passportType: "ordinary",
      residenceCountryId: null,
      heldDocuments: [],
      purpose: "tourism",
      activity: null,
      departureDate: null,
      returnDate: null,
      durationDays: null,
      preferences: { regionIds: [], accessLevels: [], budget: null },
      language: "en",
    },
  };
}
function CountryOptions({ optional = false }: { optional?: boolean }) {
  return (
    <>
      <option value="">
        {optional ? "Not specified" : "Choose a passport"}
      </option>
      {countries.map((c) => (
        <option value={c.id} key={c.id}>
          {c.name}
        </option>
      ))}
    </>
  );
}

export function TripSetup({
  initial,
  passport,
  onClose,
}: {
  initial: Trip | null;
  passport: string;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Trip>(() =>
    structuredClone(
      initial ?? {
        name: "",
        travellers: [newTraveller(passport)],
        departureDate: null,
        returnDate: null,
        durationDays: null,
        budget: null,
        shortlistCountryIds: [],
      },
    ),
  );
  const [amount, setAmount] = useState(
    initial?.budget?.amount.toString() ?? "",
  );
  const [currency, setCurrency] = useState(initial?.budget?.currency ?? "INR");
  const [localError, setLocalError] = useState("");
  const {
    save,
    saveCopy,
    saving,
    error,
    conflict,
    sessionLost,
    reload,
    loading,
    clearError,
  } = useTripPlanner();
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    el.querySelector<HTMLInputElement>("input")?.focus();
    return () => el.close();
  }, []);
  const update = (index: number, value: Partial<Trip["travellers"][number]>) =>
    setDraft((d) => ({
      ...d,
      travellers: d.travellers.map((p, i) =>
        i === index ? { ...p, ...value } : p,
      ),
    }));
  const profile = (index: number, value: Partial<Profile>) =>
    update(index, {
      profile: { ...draft.travellers[index].profile, ...value },
    });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLocalError("");
    clearError();
    const duration =
      draft.departureDate && draft.returnDate
        ? (Date.parse(draft.returnDate) - Date.parse(draft.departureDate)) /
            86400000 +
          1
        : draft.durationDays;
    if (duration !== null && duration < 1) {
      setLocalError("The return date must be on or after departure.");
      return;
    }
    const trip: Trip = {
      ...draft,
      name: draft.name.trim(),
      durationDays: duration,
      budget: amount === "" ? null : { amount: Number(amount), currency },
      travellers: draft.travellers.map((t) => ({
        ...t,
        label: t.label.trim(),
        profile: {
          ...t.profile,
          departureDate: null,
          returnDate: null,
          durationDays: null,
        },
      })),
    };
    if (await (sessionLost ? saveCopy(trip) : save(trip))) onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="trip-dialog"
      aria-labelledby="trip-setup-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <form onSubmit={submit}>
        <header className="trip-dialog-header">
          <div>
            <span className="eyebrow">YOUR PEOPLE, YOUR PLANS</span>
            <h2 id="trip-setup-title">
              {initial ? "Edit your trip" : "Start a shared adventure"}
            </h2>
          </div>
          <button
            type="button"
            className="trip-icon"
            aria-label="Close trip setup"
            disabled={saving}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </header>
        <fieldset disabled={saving} className="trip-form-fields">
          <label>
            Trip name
            <input
              autoFocus
              required
              maxLength={150}
              value={draft.name}
              placeholder="Our autumn escape"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <div className="trip-form-grid">
            <label>
              Departure date
              <input
                type="date"
                value={draft.departureDate ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, departureDate: e.target.value || null })
                }
              />
            </label>
            <label>
              Return date
              <input
                type="date"
                min={draft.departureDate ?? undefined}
                value={draft.returnDate ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, returnDate: e.target.value || null })
                }
              />
            </label>
            <label>
              Duration, if dates are flexible
              <input
                type="number"
                min={1}
                max={3650}
                disabled={!!(draft.departureDate && draft.returnDate)}
                value={draft.durationDays ?? ""}
                placeholder="Days"
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    durationDays: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </label>
          </div>
          <div className="trip-form-grid two">
            <label>
              Group budget preference (optional)
              <input
                type="number"
                min={0}
                max={1000000000}
                step="any"
                value={amount}
                placeholder="Enter amount"
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {Intl.supportedValuesOf("currency").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="trip-section-title">
            <h3>
              <Users size={19} /> Your travellers
            </h3>
            <span>{draft.travellers.length} / 6</span>
          </div>
          {draft.travellers.map((person, index) => (
            <section
              className="trip-person-form"
              key={person.id}
              aria-label={`Traveller ${index + 1}`}
            >
              <div className="trip-person-top">
                <span className={`trip-avatar tone-${index % 4}`}>
                  {index + 1}
                </span>
                <strong>Traveller {index + 1}</strong>
                <button
                  type="button"
                  className="trip-icon"
                  disabled={draft.travellers.length === 1}
                  aria-label={`Remove traveller ${index + 1}`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      travellers: draft.travellers.filter(
                        (t) => t.id !== person.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <div className="trip-form-grid">
                <label>
                  Name or nickname
                  <input
                    required
                    maxLength={80}
                    value={person.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </label>
                <label>
                  Passport country
                  <select
                    required
                    value={person.profile.passportId}
                    onChange={(e) =>
                      profile(index, { passportId: e.target.value })
                    }
                  >
                    <CountryOptions />
                  </select>
                </label>
                <label>
                  Travel purpose
                  <select
                    value={person.profile.purpose}
                    onChange={(e) =>
                      profile(index, {
                        purpose: e.target.value as Profile["purpose"],
                      })
                    }
                  >
                    <option value="tourism">Tourism</option>
                    <option value="business">Business</option>
                    <option value="conference">Conference</option>
                    <option value="transit">Transit</option>
                  </select>
                </label>
              </div>
              <details>
                <summary>Passport type, residence & held documents</summary>
                <p className="trip-muted">
                  These details may affect entry rules. Residence and existing
                  visas do not automatically grant access.
                </p>
                <div className="trip-form-grid two">
                  <label>
                    Passport type
                    <select
                      value={person.profile.passportType}
                      onChange={(e) =>
                        profile(index, {
                          passportType: e.target
                            .value as Profile["passportType"],
                        })
                      }
                    >
                      <option value="ordinary">Ordinary</option>
                      <option value="diplomatic">Diplomatic</option>
                      <option value="service">Service</option>
                    </select>
                  </label>
                  <label>
                    Country of residence
                    <select
                      value={person.profile.residenceCountryId ?? ""}
                      onChange={(e) =>
                        profile(index, {
                          residenceCountryId: e.target.value || null,
                        })
                      }
                    >
                      <CountryOptions optional />
                    </select>
                  </label>
                </div>
                {person.profile.heldDocuments.map((doc, docIndex) => (
                  <div className="trip-document" key={doc.id}>
                    <div className="trip-form-grid">
                      <label>
                        Document type
                        <select
                          value={doc.kind}
                          onChange={(e) =>
                            profile(index, {
                              heldDocuments: person.profile.heldDocuments.map(
                                (d) =>
                                  d.id === doc.id
                                    ? {
                                        ...d,
                                        kind: e.target.value as typeof doc.kind,
                                      }
                                    : d,
                              ),
                            })
                          }
                        >
                          <option value="visa">Visa</option>
                          <option value="residence_permit">
                            Residence permit
                          </option>
                        </select>
                      </label>
                      <label>
                        Issuing country
                        <select
                          required
                          value={doc.issuerCountryId}
                          onChange={(e) =>
                            profile(index, {
                              heldDocuments: person.profile.heldDocuments.map(
                                (d) =>
                                  d.id === doc.id
                                    ? { ...d, issuerCountryId: e.target.value }
                                    : d,
                              ),
                            })
                          }
                        >
                          <CountryOptions optional />
                        </select>
                      </label>
                      <button
                        type="button"
                        className="trip-text-button"
                        onClick={() =>
                          profile(index, {
                            heldDocuments: person.profile.heldDocuments.filter(
                              (d) => d.id !== doc.id,
                            ),
                          })
                        }
                      >
                        Remove document {docIndex + 1}
                      </button>
                    </div>
                    <div className="trip-form-grid">
                      <label>
                        Valid from
                        <input
                          type="date"
                          value={doc.validFrom ?? ""}
                          onChange={(e) =>
                            profile(index, {
                              heldDocuments: person.profile.heldDocuments.map(
                                (d) =>
                                  d.id === doc.id
                                    ? {
                                        ...d,
                                        validFrom: e.target.value || null,
                                      }
                                    : d,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Valid until
                        <input
                          type="date"
                          min={doc.validFrom ?? undefined}
                          value={doc.validUntil ?? ""}
                          onChange={(e) =>
                            profile(index, {
                              heldDocuments: person.profile.heldDocuments.map(
                                (d) =>
                                  d.id === doc.id
                                    ? {
                                        ...d,
                                        validUntil: e.target.value || null,
                                      }
                                    : d,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Entries
                        <select
                          value={doc.entryType ?? ""}
                          onChange={(e) =>
                            profile(index, {
                              heldDocuments: person.profile.heldDocuments.map(
                                (d) =>
                                  d.id === doc.id
                                    ? {
                                        ...d,
                                        entryType: (e.target.value ||
                                          null) as typeof doc.entryType,
                                      }
                                    : d,
                              ),
                            })
                          }
                        >
                          <option value="">Not specified</option>
                          <option value="single">Single</option>
                          <option value="multiple">Multiple</option>
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="trip-text-button"
                  disabled={person.profile.heldDocuments.length >= 10}
                  onClick={() =>
                    profile(index, {
                      heldDocuments: [
                        ...person.profile.heldDocuments,
                        {
                          id: crypto.randomUUID(),
                          kind: "visa",
                          issuerCountryId: "",
                          validFrom: null,
                          validUntil: null,
                          entryType: null,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={16} /> Add visa or residence permit
                </button>
              </details>
            </section>
          ))}
          <button
            type="button"
            className="trip-button secondary"
            disabled={draft.travellers.length >= 6}
            onClick={() =>
              setDraft({
                ...draft,
                travellers: [
                  ...draft.travellers,
                  newTraveller("", draft.travellers.length + 1),
                ],
              })
            }
          >
            <Plus size={18} /> Add traveller
          </button>
        </fieldset>
        {(localError || error) && (
          <div className="trip-error" role="alert">
            {localError || error}
            {conflict && (
              <>
                <p>
                  Your draft is kept. Load the latest saved version before
                  saving these edits.
                </p>
                <button
                  type="button"
                  className="trip-text-button"
                  disabled={loading}
                  onClick={() => void reload()}
                >
                  Load latest revision
                </button>
              </>
            )}
          </div>
        )}
        <footer className="trip-dialog-footer">
          <p className="trip-muted">
            {sessionLost
              ? "The saved trip is unavailable. Save this draft as a new local copy."
              : "Saved in this browser’s local session for up to 7 days."}
          </p>
          <button
            type="submit"
            className="trip-button primary"
            disabled={saving || conflict}
          >
            {saving
              ? "Saving…"
              : sessionLost
                ? "Save as new trip"
                : "Save trip"}
            <ArrowRight size={18} />
          </button>
        </footer>
      </form>
    </dialog>
  );
}
