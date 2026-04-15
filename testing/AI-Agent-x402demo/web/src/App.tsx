import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

export type PurchaseProposal = {
  datasetId: string;
  title: string;
  priceUSDC: number;
  publicUrl: string;
  category?: string;
};

export type DatasetChoiceCandidate = {
  datasetId: string;
  title: string;
  priceUSDC: number;
  publicUrl: string;
  category?: string;
  matchNote: string;
};

type PendingResolution = "confirmed" | "declined" | "superseded";

type TranscriptItem =
  | { id: string; kind: "user"; content: string }
  | { id: string; kind: "assistant"; content: string }
  | {
      id: string;
      kind: "activity";
      time: string;
      step: string;
      detail?: string;
    }
  | {
      id: string;
      kind: "pending";
      threadId: string;
      proposal: PurchaseProposal;
      resolved?: PendingResolution;
    }
  | {
      id: string;
      kind: "pending_choice";
      threadId: string;
      candidates: DatasetChoiceCandidate[];
      resolved?: PendingResolution;
      /** Set when user confirms a row (for display) */
      chosenDatasetId?: string;
    };

type SseEvent =
  | { type: "step"; step: string; detail?: string }
  | { type: "thread"; threadId: string }
  | {
      type: "pending_dataset_choice";
      threadId: string;
      candidates: DatasetChoiceCandidate[];
    }
  | {
      type: "pending_confirmation";
      threadId: string;
      proposal: PurchaseProposal;
    }
  | { type: "message"; role: "assistant"; content: string }
  | { type: "error"; message: string }
  | { type: "done"; threadId: string; awaitingConfirmation?: boolean };

function agentBaseUrl(): string {
  return (
    import.meta.env.VITE_AGENT_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5055"
  );
}

function parseSseBlocks(
  buffer: string,
): { events: SseEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: SseEvent[] = [];
  for (const block of parts) {
    const line = block.split("\n").find((l) => l.startsWith("data:"));
    if (!line) continue;
    const raw = line.slice(5).trim();
    try {
      events.push(JSON.parse(raw) as SseEvent);
    } catch {
      /* ignore */
    }
  }
  return { events, rest };
}

async function consumeSseResponse(
  res: Response,
  handlers: {
    onStep: (step: string, detail?: string) => void;
    onThread: (threadId: string) => void;
    onPendingChoice: (
      threadId: string,
      candidates: DatasetChoiceCandidate[],
    ) => void;
    onPending: (threadId: string, proposal: PurchaseProposal) => void;
    onAssistant: (content: string) => void;
    onError: (message: string) => void;
    onDone: (threadId: string, awaitingConfirmation: boolean) => void;
  },
): Promise<void> {
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    handlers.onError(`HTTP ${res.status} ${t.slice(0, 200)}`);
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    handlers.onError("No response body stream.");
    return;
  }
  const decoder = new TextDecoder();
  let buf = "";
  let lastDone: { threadId: string; awaiting: boolean } | undefined;

  const flushEvents = (events: SseEvent[]) => {
    for (const ev of events) {
      if (ev.type === "step") handlers.onStep(ev.step, ev.detail);
      else if (ev.type === "thread") handlers.onThread(ev.threadId);
      else if (ev.type === "pending_dataset_choice") {
        handlers.onPendingChoice(ev.threadId, ev.candidates);
      } else if (ev.type === "pending_confirmation") {
        handlers.onPending(ev.threadId, ev.proposal);
      } else if (ev.type === "message" && ev.role === "assistant") {
        handlers.onAssistant(ev.content);
      } else if (ev.type === "error") handlers.onError(ev.message);
      else if (ev.type === "done") {
        lastDone = {
          threadId: ev.threadId,
          awaiting: Boolean(ev.awaitingConfirmation),
        } satisfies { threadId: string; awaiting: boolean };
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const { events, rest } = parseSseBlocks(buf);
    buf = rest;
    flushEvents(events);
  }
  const tail = buf.trim();
  if (tail) {
    const { events } = parseSseBlocks(tail + "\n\n");
    flushEvents(events);
  }
  if (lastDone !== undefined) {
    handlers.onDone(lastDone.threadId, lastDone.awaiting);
  }
}

export default function App() {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID());
  const idRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const sweepUnresolvedForThread = useCallback((tid: string) => {
    setTranscript((prev) =>
      prev.map((t) => {
        if (t.threadId !== tid) return t;
        if (t.kind !== "pending" && t.kind !== "pending_choice") return t;
        if (t.resolved !== undefined) return t;
        return { ...t, resolved: "superseded" as const };
      }),
    );
  }, []);

  const pushUser = useCallback((content: string) => {
    idRef.current += 1;
    setTranscript((prev) => [
      ...prev,
      { id: `u-${idRef.current}`, kind: "user", content },
    ]);
  }, []);

  const pushAssistant = useCallback((content: string) => {
    idRef.current += 1;
    setTranscript((prev) => [
      ...prev,
      { id: `a-${idRef.current}`, kind: "assistant", content },
    ]);
  }, []);

  const pushActivity = useCallback((step: string, detail?: string) => {
    idRef.current += 1;
    const time = new Date().toLocaleTimeString();
    setTranscript((prev) => [
      ...prev,
      { id: `s-${idRef.current}`, kind: "activity", time, step, detail },
    ]);
  }, []);

  const pushPendingChoice = useCallback(
    (tid: string, candidates: DatasetChoiceCandidate[]) => {
      setTranscript((prev) => {
        const time = new Date().toLocaleTimeString();
        const next: TranscriptItem[] = [];
        for (const t of prev) {
          if (t.kind !== "pending_choice" || t.threadId !== tid) {
            next.push(t);
            continue;
          }
          if (t.resolved === "confirmed" || t.resolved === "declined") {
            idRef.current += 1;
            next.push({
              id: `s-${idRef.current}`,
              kind: "activity",
              time,
              step: t.resolved === "confirmed" ? "selected" : "declined",
              detail:
                t.resolved === "confirmed" && t.chosenDatasetId
                  ? `Chose dataset ${t.chosenDatasetId}`
                  : "Cancelled dataset selection",
            });
            continue;
          }
          if (t.resolved === "superseded") {
            next.push(t);
            continue;
          }
          idRef.current += 1;
          next.push({
            id: `s-${idRef.current}`,
            kind: "activity",
            time,
            step: "superseded",
            detail: "New dataset shortlist replaced this step.",
          });
        }
        idRef.current += 1;
        next.push({
          id: `c-${idRef.current}`,
          kind: "pending_choice",
          threadId: tid,
          candidates,
        });
        return next;
      });
    },
    [],
  );

  const pushPending = useCallback((tid: string, proposal: PurchaseProposal) => {
    setTranscript((prev) => {
      const time = new Date().toLocaleTimeString();
      const next: TranscriptItem[] = [];
      for (const t of prev) {
        if (t.kind !== "pending" || t.threadId !== tid) {
          next.push(t);
          continue;
        }
        if (t.resolved === "confirmed" || t.resolved === "declined") {
          idRef.current += 1;
          next.push({
            id: `s-${idRef.current}`,
            kind: "activity",
            time,
            step: t.resolved === "confirmed" ? "confirmed" : "declined",
            detail:
              t.resolved === "confirmed"
                ? `Proceeding with x402 for "${t.proposal.title}"`
                : `Declined "${t.proposal.title}"`,
          });
          continue;
        }
        if (t.resolved === "superseded") {
          next.push(t);
          continue;
        }
        idRef.current += 1;
        next.push({
          id: `s-${idRef.current}`,
          kind: "activity",
          time,
          step: "superseded",
          detail: `Previous purchase confirmation replaced (was "${t.proposal.title}")`,
        });
      }
      idRef.current += 1;
      next.push({
        id: `p-${idRef.current}`,
        kind: "pending",
        threadId: tid,
        proposal,
      });
      return next;
    });
  }, []);

  const resolvePending = useCallback(
    (pendingItemId: string, resolved: "confirmed" | "declined") => {
      setTranscript((prev) =>
        prev.map((t) =>
          t.id === pendingItemId && t.kind === "pending"
            ? { ...t, resolved }
            : t,
        ),
      );
    },
    [],
  );

  const resolvePendingChoice = useCallback(
    (
      choiceItemId: string,
      resolved: "confirmed" | "declined",
      chosenDatasetId?: string,
    ) => {
      setTranscript((prev) =>
        prev.map((t) =>
          t.id === choiceItemId && t.kind === "pending_choice"
            ? { ...t, resolved, chosenDatasetId }
            : t,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [transcript]);

  const awaitingUserConfirm = useMemo(
    () =>
      transcript.some(
        (t) =>
          (t.kind === "pending" || t.kind === "pending_choice") &&
          t.resolved === undefined,
      ),
    [transcript],
  );

  const runStream = useCallback(
    async (
      body: Record<string, unknown>,
      options: { expectAssistantIfNotWaiting?: boolean } = {},
    ) => {
      let finalAssistant: string | null = null;
      let sawError = false;
      let doneAwaiting = false;

      const res = await fetch(`${agentBaseUrl()}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
      });

      await consumeSseResponse(res, {
        onStep: (step, detail) => pushActivity(step, detail),
        onThread: (tid) => {
          setThreadId(tid);
        },
        onPendingChoice: (tid, candidates) => pushPendingChoice(tid, candidates),
        onPending: (tid, proposal) => pushPending(tid, proposal),
        onAssistant: (content) => {
          finalAssistant = content;
        },
        onError: (msg) => {
          sawError = true;
          pushAssistant(`Error: ${msg}`);
        },
        onDone: (tid, awaiting) => {
          doneAwaiting = awaiting;
          if (!awaiting) {
            sweepUnresolvedForThread(tid);
          }
        },
      });

      if (!sawError && !doneAwaiting && options.expectAssistantIfNotWaiting) {
        if (finalAssistant) {
          pushAssistant(finalAssistant);
        } else {
          pushAssistant(
            "No assistant message received. Check server logs and configuration.",
          );
        }
      }
    },
    [
      pushActivity,
      pushAssistant,
      pushPending,
      pushPendingChoice,
      sweepUnresolvedForThread,
    ],
  );

  const send = useCallback(async () => {
    const message = input.trim();
    if (!message || busy || awaitingUserConfirm) return;
    setInput("");
    pushUser(message);
    setBusy(true);
    try {
      await runStream(
        { message, threadId },
        { expectAssistantIfNotWaiting: true },
      );
    } catch (e) {
      pushAssistant(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [
    awaitingUserConfirm,
    busy,
    input,
    pushAssistant,
    pushUser,
    runStream,
    threadId,
  ]);

  const submitDatasetChoice = useCallback(
    async (
      choiceItemId: string,
      payload: { datasetId: string } | { declineChoice: true },
    ) => {
      if (busy) return;
      const row = transcript.find(
        (t) => t.id === choiceItemId && t.kind === "pending_choice",
      );
      if (!row || row.kind !== "pending_choice" || row.resolved) return;
      if ("datasetId" in payload) {
        resolvePendingChoice(choiceItemId, "confirmed", payload.datasetId);
      } else {
        resolvePendingChoice(choiceItemId, "declined");
      }
      setBusy(true);
      try {
        await runStream(
          {
            threadId: row.threadId,
            resume:
              "declineChoice" in payload
                ? { declineChoice: true }
                : { datasetId: payload.datasetId },
          },
          { expectAssistantIfNotWaiting: true },
        );
      } catch (e) {
        pushAssistant(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [busy, pushAssistant, resolvePendingChoice, runStream, transcript],
  );

  const confirmPurchase = useCallback(
    async (pendingItemId: string, confirm: boolean) => {
      if (busy) return;
      const row = transcript.find(
        (t) => t.id === pendingItemId && t.kind === "pending",
      );
      if (!row || row.kind !== "pending" || row.resolved) return;
      resolvePending(pendingItemId, confirm ? "confirmed" : "declined");
      setBusy(true);
      try {
        await runStream(
          { threadId: row.threadId, resume: { confirm } },
          { expectAssistantIfNotWaiting: true },
        );
      } catch (e) {
        pushAssistant(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [busy, pushAssistant, resolvePending, runStream, transcript],
  );

  const newChat = useCallback(() => {
    if (busy) return;
    setTranscript([]);
    setThreadId(crypto.randomUUID());
    setInput("");
  }, [busy]);

  function resolvedPurchaseLabel(resolved: PendingResolution): string {
    if (resolved === "confirmed")
      return "You confirmed — proceeding with x402 payment.";
    if (resolved === "declined") return "You declined — purchase skipped.";
    return "This step was closed automatically (conversation continued).";
  }

  return (
    <div className="layout">
      <header className="header">
        <h1>India Data Exchange — AI Agent (x402 Demo)</h1>
        <p className="sub">
          LangGraph + OpenAI + USDC payment against your IDE API. Agent URL:{" "}
          <code>{agentBaseUrl()}</code>
        </p>
        <p className="sub hint">
          Each purchase runs in two steps: pick one of the top catalog matches,
          then confirm payment. Every extra dataset repeats both steps. Use{" "}
          <strong>New chat</strong> for a fresh thread when you change topic.
        </p>
        <div className="header-actions">
          <button type="button" className="btn-secondary" onClick={newChat}>
            New chat
          </button>
        </div>
      </header>

      <section className="chat-panel">
        <div
          className="transcript"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {transcript.length === 0 ? (
            <p className="empty-hint">
              Send a message to search the catalog. You will choose a dataset
              from the top matches, then confirm each x402 purchase.
            </p>
          ) : null}
          {transcript.map((item) => {
            if (item.kind === "user") {
              return (
                <div key={item.id} className="bubble user">
                  {item.content}
                </div>
              );
            }
            if (item.kind === "assistant") {
              return (
                <div key={item.id} className="bubble assistant">
                  {item.content}
                </div>
              );
            }
            if (item.kind === "pending_choice") {
              return (
                <div key={item.id} className="choice-card">
                  <div className="choice-title">Choose a dataset</div>
                  <p className="choice-sub">
                    Pick one of the top matches (then you will confirm payment on
                    the next card).
                  </p>
                  <ol className="choice-list">
                    {item.candidates.map((c) => (
                      <li key={c.datasetId} className="choice-row">
                        <div className="choice-row-head">
                          <strong>{c.title}</strong>
                          <span className="choice-price">
                            {typeof c.priceUSDC === "number"
                              ? `${c.priceUSDC} USDC`
                              : "—"}
                          </span>
                        </div>
                        <p className="choice-note">{c.matchNote}</p>
                        <p className="choice-links">
                          <a
                            href={c.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open listing
                          </a>
                        </p>
                        {!item.resolved ? (
                          <button
                            type="button"
                            className="btn-pick"
                            disabled={busy}
                            onClick={() =>
                              void submitDatasetChoice(item.id, {
                                datasetId: c.datasetId,
                              })
                            }
                          >
                            Select for purchase
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  {!item.resolved ? (
                    <div className="choice-footer">
                      <button
                        type="button"
                        className="btn-decline"
                        disabled={busy}
                        onClick={() =>
                          void submitDatasetChoice(item.id, {
                            declineChoice: true,
                          })
                        }
                      >
                        Cancel selection
                      </button>
                    </div>
                  ) : (
                    <p className="pending-resolved">
                      {item.resolved === "confirmed" && item.chosenDatasetId
                        ? `Selected dataset ${item.chosenDatasetId} — waiting for payment confirmation…`
                        : resolvedPurchaseLabel(item.resolved)}
                    </p>
                  )}
                </div>
              );
            }
            if (item.kind === "pending") {
              const p = item.proposal;
              return (
                <div key={item.id} className="pending-card">
                  <div className="pending-title">Confirm purchase</div>
                  <p className="pending-line">
                    <strong>{p.title}</strong>
                  </p>
                  <p className="pending-line">
                    Price:{" "}
                    <strong>
                      {typeof p.priceUSDC === "number"
                        ? `${p.priceUSDC} USDC`
                        : "—"}
                    </strong>
                  </p>
                  <p className="pending-line">
                    <a href={p.publicUrl} target="_blank" rel="noreferrer">
                      Open public listing
                    </a>
                  </p>
                  {item.resolved ? (
                    <p className="pending-resolved">
                      {resolvedPurchaseLabel(item.resolved)}
                    </p>
                  ) : (
                    <div className="pending-actions">
                      <button
                        type="button"
                        className="btn-decline"
                        disabled={busy}
                        onClick={() => void confirmPurchase(item.id, false)}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="btn-confirm"
                        disabled={busy}
                        onClick={() => void confirmPurchase(item.id, true)}
                      >
                        Confirm purchase
                      </button>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={item.id} className="activity-row">
                <span className="activity-time">{item.time}</span>
                <span className="activity-step">{item.step}</span>
                {item.detail ? (
                  <div className="activity-detail">{item.detail}</div>
                ) : null}
              </div>
            );
          })}
          <div ref={transcriptEndRef} />
        </div>
        <div className="composer">
          <textarea
            rows={2}
            placeholder="Describe what you need (e.g. street food sales data)…"
            value={input}
            disabled={busy || awaitingUserConfirm}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="button"
            disabled={busy || awaitingUserConfirm || !input.trim()}
            onClick={() => void send()}
          >
            {busy ? "Running…" : "Send"}
          </button>
        </div>
      </section>
    </div>
  );
}
