import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Bot,
  CircleAlert,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  assistant,
  AssistantError,
  errorMessage,
  type AssistantMessage,
  type Conversation,
  type CountryContext,
} from "../frontend/assistantClient";
import type { Profile } from "../shared/assistant/schemas";

type DrawerStatus =
  | "idle"
  | "preparing"
  | "needs_context"
  | "ready"
  | "unavailable"
  | "error";

type ChatItem =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; message: AssistantMessage };

const MAX_MESSAGE_LENGTH = 4000;

function mapProfile(passportId: string): Profile {
  return {
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
  };
}

function isMapProfile(profile: Profile | null, passportId: string) {
  return Boolean(
    profile &&
      profile.passportId === passportId &&
      profile.passportType === "ordinary" &&
      profile.residenceCountryId === null &&
      profile.heldDocuments.length === 0 &&
      profile.purpose === "tourism" &&
      profile.activity === null &&
      profile.departureDate === null &&
      profile.returnDate === null &&
      profile.durationDays === null &&
      profile.preferences.regionIds.length === 0 &&
      profile.preferences.accessLevels.length === 0 &&
      profile.preferences.budget === null &&
      profile.language === "en",
  );
}

function toChatItems(messages: readonly AssistantMessage[]): ChatItem[] {
  return messages.map((message) =>
    message.role === "assistant"
      ? { id: message.id, role: "assistant", message }
      : { id: message.id, role: "user", text: message.text },
  );
}

function messageError(error: unknown) {
  const message = errorMessage(error);
  if (error instanceof AssistantError && error.retryAfter > 0) {
    return `${message} Try again in about ${error.retryAfter} seconds.`;
  }
  return message;
}

type TextBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const RESPONSE_METADATA = new Set([
  "cards",
  "claims",
  "questions",
  "actions",
  "warnings",
  "evidenceIds",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function readableJsonValue(value: unknown, depth = 0): string {
  if (depth > 3) return "Additional details are available in this answer.";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "Not provided";
  if (Array.isArray(value)) {
    return value
      .map((item) => readableJsonValue(item, depth + 1).replace(/\s*\n\s*/g, " "))
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join("\n");
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .map(([key, nested]) => {
        const rendered = readableJsonValue(nested, depth + 1);
        return rendered ? `${humanizeKey(key)}: ${rendered}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

/** Some providers place a schema-shaped JSON object inside the text field.
 * Keep the UI readable without trusting or rendering arbitrary HTML. */
function normaliseAnswerText(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed;
  if (!fenced.startsWith("{") && !fenced.startsWith("[")) return text;

  try {
    const parsed: unknown = JSON.parse(fenced);
    if (isRecord(parsed)) {
      for (const key of ["text", "answer", "message", "summary", "content"]) {
        if (typeof parsed[key] === "string" && parsed[key].trim()) {
          return parsed[key].trim();
        }
      }
      const sections = Object.entries(parsed)
        .filter(([key]) => !RESPONSE_METADATA.has(key))
        .map(([key, value]) => {
          const rendered = readableJsonValue(value);
          return rendered ? `**${humanizeKey(key)}**:\n${rendered}` : "";
        })
        .filter(Boolean);
      return sections.join("\n\n") || "The assistant returned no readable answer text.";
    }
    if (Array.isArray(parsed)) {
      const list = readableJsonValue(parsed);
      if (list) return list;
    }
  } catch {
    // Plain text that happens to start with a brace remains visible as entered.
  }
  return text;
}

function headingText(line: string) {
  return line.match(/^#{1,3}\s+(.+)$/)?.[1] ??
    line.match(/^\*\*(.+?)\*\*:?\s*$/)?.[1] ?? null;
}

function listItemText(line: string) {
  return line.match(/^(?:[-*•])\s+(.+)$/)?.[1] ?? null;
}

function answerBlocks(text: string): TextBlock[] {
  const lines = normaliseAnswerText(text).split(/\r?\n/);
  const blocks: TextBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index++;
      continue;
    }
    const heading = headingText(line);
    if (heading) {
      blocks.push({ type: "heading", text: heading });
      index++;
      continue;
    }
    const item = listItemText(line);
    if (item) {
      const items: string[] = [];
      while (index < lines.length) {
        const next = listItemText(lines[index].trim());
        if (!next) break;
        items.push(next);
        index++;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const paragraph = [line];
    index++;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || headingText(next) || listItemText(next)) break;
      paragraph.push(next);
      index++;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks.length > 0
    ? blocks
    : [{ type: "paragraph", text: "The assistant returned no readable answer text." }];
}

function InlineMarkdown({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

function FormattedAssistantText({ text }: { text: string }) {
  return (
    <div className="country-chat-answer">
      {answerBlocks(text).map((block, index) => {
        if (block.type === "heading") {
          return <h3 key={index}><InlineMarkdown text={block.text} /></h3>;
        }
        if (block.type === "list") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><InlineMarkdown text={item} /></li>
              ))}
            </ul>
          );
        }
        return <p key={index}><InlineMarkdown text={block.text} /></p>;
      })}
    </div>
  );
}

function AnswerCard({
  card,
}: {
  card: AssistantMessage["cards"][number];
}) {
  switch (card.type) {
    case "summary":
      return (
        <section className="country-chat-card">
          <b>{card.payload.title}</b>
          <p>{card.payload.text}</p>
        </section>
      );
    case "requirement":
      return (
        <section className="country-chat-card">
          <b>{card.payload.title}</b>
          {card.payload.condition && <p>{card.payload.condition}</p>}
        </section>
      );
    case "condition":
    case "gap":
      return (
        <section className="country-chat-card condition">
          <p>{card.payload.text}</p>
        </section>
      );
    case "comparison":
      return (
        <section className="country-chat-card">
          <b>{card.payload.title}</b>
          <dl>
            {card.payload.rows.map((row) => (
              <div key={`${row.label}-${row.value}`}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "source":
      return (
        <section className="country-chat-card source">
          <p>Source reference available in this conversation.</p>
        </section>
      );
    case "checklist":
      return (
        <section className="country-chat-card condition">
          <p>Preparation items need reviewed sources before they become a checklist.</p>
        </section>
      );
  }
  return null;
}

function AssistantAnswer({
  message,
  disabled,
  onAsk,
}: {
  message: AssistantMessage;
  disabled: boolean;
  onAsk: (question: string) => void;
}) {
  return (
    <>
      <FormattedAssistantText text={message.text} />
      {message.cards.map((card, index) => (
        <AnswerCard key={`${card.type}-${index}`} card={card} />
      ))}
      {message.claims.length > 0 && (
        <details className="country-chat-evidence">
          <summary>Evidence status</summary>
          <ul>
            {message.claims.map((claim) => (
              <li key={claim.id}>
                <span>{claim.text}</span>
                <b className={`country-chat-support ${claim.support}`}>
                  {claim.support}
                </b>
              </li>
            ))}
          </ul>
        </details>
      )}
      {message.warnings.map((warning, index) => (
        <p className="country-chat-warning" key={`${warning}-${index}`}>
          {warning}
        </p>
      ))}
      {message.questions.length > 0 && (
        <div className="country-chat-followups" aria-label="Suggested follow-up questions">
          {message.questions.map((question) => (
            <button
              type="button"
              key={`${question.field}-${question.text}`}
              onClick={() => onAsk(question.text)}
              disabled={disabled}
            >
              {question.text}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function CountryChatDrawer({
  open,
  passportId,
  passportName,
  destinationId,
  destinationName,
  onClose,
}: {
  open: boolean;
  passportId: string;
  passportName: string;
  destinationId: string;
  destinationName: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const preparationAbort = useRef<AbortController | null>(null);
  const messageAbort = useRef<AbortController | null>(null);
  const preparationId = useRef(0);
  const [status, setStatus] = useState<DrawerStatus>("idle");
  const [context, setContext] = useState<CountryContext | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [jobStage, setJobStage] = useState("");
  const selectedProfile = useMemo(() => mapProfile(passportId), [passportId]);

  const prepare = useCallback(
    (replaceExistingProfile: boolean) => {
      preparationAbort.current?.abort();
      messageAbort.current?.abort();
      const controller = new AbortController();
      preparationAbort.current = controller;
      const currentPreparation = ++preparationId.current;
      setStatus("preparing");
      setContext(null);
      setConversation(null);
      setMessages([]);
      setDraft("");
      setError("");
      setIsSending(false);
      setJobStage("");

      void (async () => {
        try {
          const capabilities = await assistant.capabilities(controller.signal);
          if (controller.signal.aborted || currentPreparation !== preparationId.current) return;
          if (!capabilities.features.countryChat) {
            setStatus("unavailable");
            return;
          }

          const current = await assistant.getProfile(controller.signal);
          if (controller.signal.aborted || currentPreparation !== preparationId.current) return;
          if (
            current.profile &&
            !isMapProfile(current.profile, passportId) &&
            !replaceExistingProfile
          ) {
            setStatus("needs_context");
            return;
          }

          const activeProfile = isMapProfile(current.profile, passportId)
            ? current
            : await assistant.saveProfile(selectedProfile, current, controller.signal);
          if (controller.signal.aborted || currentPreparation !== preparationId.current) return;
          const contextRef = {
            kind: "country" as const,
            profileRevision: activeProfile.revision,
            destinationId,
          };
          const countryContext = await assistant.countryContext(
            contextRef,
            controller.signal,
          );
          const nextConversation = await assistant.createConversation(
            contextRef,
            controller.signal,
          );
          if (controller.signal.aborted || currentPreparation !== preparationId.current) return;
          setContext(countryContext);
          setConversation(nextConversation);
          setStatus("ready");
        } catch (caught) {
          if (controller.signal.aborted || currentPreparation !== preparationId.current) return;
          setError(messageError(caught));
          setStatus("error");
        }
      })();
    },
    [destinationId, passportId, selectedProfile],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    prepare(false);
    return () => {
      preparationAbort.current?.abort();
      messageAbort.current?.abort();
    };
  }, [destinationId, open, passportId, prepare]);

  useEffect(() => {
    if (open && status === "ready") {
      const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [open, status]);

  const refreshConversation = useCallback(
    async (conversationId: string) => {
      try {
        const history = await assistant.getConversation(conversationId);
        setConversation({
          id: history.id,
          revision: history.revision,
          contextRef: history.contextRef,
          contextHash: history.contextHash,
          messageIds: history.messageIds,
          activeJobId: history.activeJobId,
          createdAt: history.createdAt,
        });
        setMessages(toChatItems(history.messages));
      } catch {
        // The visible error remains actionable even if a stale conversation cannot reload.
      }
    },
    [],
  );

  const sendQuestion = useCallback(
    async (value: string) => {
      const text = value.trim();
      if (!text || !conversation || status !== "ready" || isSending) return;

      const contextRef = conversation.contextRef;
      if (contextRef.kind !== "country") return;
      const controller = new AbortController();
      messageAbort.current?.abort();
      messageAbort.current = controller;
      const clientMessageId = crypto.randomUUID();
      const expectedRevision = conversation.revision;
      setDraft("");
      setError("");
      setIsSending(true);
      setJobStage("waiting");
      setMessages((previous) => [
        ...previous,
        { id: clientMessageId, role: "user", text },
      ]);
      setConversation({ ...conversation, revision: expectedRevision + 1 });

      try {
        const answer = await assistant.sendConversationMessage(
          conversation.id,
          {
            clientMessageId,
            expectedConversationRevision: expectedRevision,
            contextRef,
            intent: "ask",
            text,
            dataPolicy: { travelBuddy: "cache_only", research: "never" },
          },
          controller.signal,
          (job) => setJobStage(job.stage),
        );
        if (controller.signal.aborted) return;
        setMessages((previous) => [
          ...previous,
          { id: answer.id, role: "assistant", message: answer },
        ]);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(messageError(caught));
        if (
          caught instanceof AssistantError &&
          ["CONTEXT_CHANGED", "REVISION_CONFLICT"].includes(caught.code)
        ) {
          setStatus("error");
        } else {
          void refreshConversation(conversation.id);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSending(false);
          setJobStage("");
        }
      }
    },
    [conversation, isSending, refreshConversation, status],
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(draft);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const close = () => {
    preparationAbort.current?.abort();
    messageAbort.current?.abort();
    onClose();
  };

  const ready = status === "ready";
  return (
    <dialog
      ref={dialogRef}
      className="country-chat-drawer"
      aria-labelledby="country-chat-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="country-chat-shell">
        <header className="country-chat-header">
          <div>
            <span className="eyebrow">APERIRON GUIDE</span>
            <h2 id="country-chat-title">Ask about {destinationName}</h2>
            <p>Map context, not travel advice.</p>
          </div>
          <button
            type="button"
            className="country-chat-close"
            onClick={close}
            aria-label="Close assistant chat"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <section className="country-chat-context" aria-label="Current assistant context">
          <MapPin aria-hidden="true" />
          <div>
            <b>{passportName} → {destinationName}</b>
            <span>Ordinary passport · tourism · no dates or document exceptions</span>
          </div>
        </section>

        <section className="country-chat-messages" role="log" aria-live="polite" aria-relevant="additions text">
          {status === "preparing" && (
            <div className="country-chat-state">
              <LoaderCircle className="country-chat-spinner" aria-hidden="true" />
              <div>
                <b>Preparing this country context</b>
                <p>Loading only the local, selected passport and destination context.</p>
              </div>
            </div>
          )}

          {status === "unavailable" && (
            <div className="country-chat-state unavailable" role="status">
              <CircleAlert aria-hidden="true" />
              <div>
                <b>Chat is not configured on this app instance.</b>
                <p>The map stays available. Add the server-only Groq configuration to enable assistant answers.</p>
              </div>
            </div>
          )}

          {status === "needs_context" && (
            <div className="country-chat-state needs-context">
              <Sparkles aria-hidden="true" />
              <div>
                <b>Use this Explore selection for the chat?</b>
                <p>Your local assistant already has a different traveller context. Continuing will replace its saved profile with this ordinary-tourism map context and start a new conversation.</p>
                <button type="button" className="button" onClick={() => prepare(true)}>
                  Use {passportName} for {destinationName}
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="country-chat-state unavailable" role="alert">
              <CircleAlert aria-hidden="true" />
              <div>
                <b>Chat could not start.</b>
                <p>{error || "Please try again."}</p>
                <button type="button" className="pill" onClick={() => prepare(false)}>
                  <RefreshCw aria-hidden="true" /> Try again
                </button>
              </div>
            </div>
          )}

          {ready && messages.length === 0 && (
            <div className="country-chat-welcome">
              <Bot aria-hidden="true" />
              <div>
                <b>Hi — I can explain the selected map context.</b>
                <p>The snapshot and any answer remain unverified. I will not search the web or refresh provider data from this chat.</p>
              </div>
            </div>
          )}

          {messages.map((item) => (
            <article className={`country-chat-message ${item.role}`} key={item.id}>
              <span className="country-chat-message-label">
                {item.role === "assistant" ? "aperiron guide" : "You"}
              </span>
              {item.role === "assistant" ? (
                <AssistantAnswer
                  message={item.message}
                  disabled={!ready || isSending}
                  onAsk={(question) => void sendQuestion(question)}
                />
              ) : (
                <p>{item.text}</p>
              )}
            </article>
          ))}

          {isSending && (
            <div className="country-chat-pending" role="status">
              <LoaderCircle className="country-chat-spinner" aria-hidden="true" />
              <span>{jobStage === "researching" ? "Checking approved source leads…" : "Preparing an answer…"}</span>
            </div>
          )}

          {ready && context && messages.length === 0 && context.suggestedQuestions.length > 0 && (
            <div className="country-chat-followups" aria-label="Suggested questions">
              {context.suggestedQuestions.map((question) => (
                <button
                  type="button"
                  key={question}
                  disabled={isSending}
                  onClick={() => void sendQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </section>

        {error && ready && (
          <p className="country-chat-inline-error" role="alert">{error}</p>
        )}

        <form className="country-chat-form" ref={formRef} onSubmit={submit}>
          <label className="sr-only" htmlFor="country-chat-input">Ask the assistant about this destination</label>
          <textarea
            ref={inputRef}
            id="country-chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={onInputKeyDown}
            disabled={!ready || isSending}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={2}
            placeholder={ready ? `Ask about ${destinationName}` : "Prepare the country context to chat"}
          />
          <button
            type="submit"
            className="country-chat-send"
            disabled={!ready || isSending || !draft.trim()}
            aria-label="Send message"
          >
            <Send aria-hidden="true" />
          </button>
          <span className="country-chat-hint">Enter to send · Shift+Enter for a new line</span>
        </form>
      </div>
    </dialog>
  );
}
