import { Command } from "@langchain/langgraph";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import {
  buildDatasetAgentGraph,
  createAgentCheckpointer,
  type AgentStateType,
} from "./graph.js";
import { createIdeMcpBridge } from "./mcpIdeBridge.js";
import { createPaymentFetchContext } from "./paymentFetch.js";
import { createEmit, initSse, writeSse } from "./sse.js";
import type { SsePayload } from "./types.js";

const checkpointer = createAgentCheckpointer();

function getIdeBaseUrl(): string {
  const u = process.env.IDE_API_BASE_URL?.trim();
  if (!u) throw new Error("IDE_API_BASE_URL is required");
  return u;
}

function getIdeFrontendBaseUrl(): string {
  return (
    process.env.IDE_FRONTEND_BASE_URL?.trim() || "http://localhost:3000"
  );
}

/** Payload passed to LangGraph `Command({ resume })` — must match the waiting `interrupt()`. */
export type GraphResumePayload =
  | { confirm: boolean }
  | { datasetId: string }
  | { declineChoice: true };

export type RunChatInput =
  | { kind: "start"; threadId: string; message: string }
  | { kind: "resume"; threadId: string; resume: GraphResumePayload };

function isInterruptPayload(payload: unknown): boolean {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "__interrupt__" in (payload as Record<string, unknown>)
  );
}

export async function runChatAgent(
  input: RunChatInput,
  res: Response
): Promise<void> {
  initSse(res);
  const emit = createEmit(res);

  const send = (p: SsePayload) => {
    try {
      emit(p);
    } catch {
      /* client gone */
    }
  };

  const threadId = input.threadId;
  let ideMcp: Awaited<ReturnType<typeof createIdeMcpBridge>> | null = null;

  try {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      throw new Error("OPENAI_API_KEY is required");
    }
    ideMcp = await createIdeMcpBridge();
    const payment = createPaymentFetchContext();
    const graph = buildDatasetAgentGraph(
      {
        emit: send,
        ideBaseUrl: getIdeBaseUrl(),
        ideFrontendBaseUrl: getIdeFrontendBaseUrl(),
        ideMcp,
        payment,
        getThreadId: () => threadId,
      },
      checkpointer
    );

    send({ type: "thread", threadId });
    send({ type: "step", step: "start", detail: "Running LangGraph pipeline" });

    const streamOptions = {
      streamMode: ["updates", "values"] as ["updates", "values"],
      configurable: { thread_id: threadId },
    };

    const streamInput =
      input.kind === "resume"
        ? new Command({ resume: input.resume })
        : ({
            userPrompt: input.message,
            datasets: null,
            chosenDatasetId: null,
            purchaseCandidates: [],
            purchaseResultJson: null,
            processedSummary: null,
            datasetNotes: "",
            purchasedDatasetIds: [],
            researchComplete: false,
            finalAnswer: null,
            error: null,
          } satisfies AgentStateType);

    let awaitingConfirmation = false;
    let finalState: AgentStateType | null = null;

    const stream = await graph.stream(streamInput, streamOptions);
    for await (const item of stream) {
      if (!Array.isArray(item) || item.length < 2) continue;
      const [mode, payload] = item as [string, unknown];
      if (mode === "updates" && isInterruptPayload(payload)) {
        awaitingConfirmation = true;
        break;
      }
      if (mode === "values") {
        finalState = payload as AgentStateType;
      }
    }

    if (awaitingConfirmation) {
      send({ type: "done", threadId, awaitingConfirmation: true });
    } else {
      if (finalState?.finalAnswer) {
        send({
          type: "message",
          role: "assistant",
          content: finalState.finalAnswer,
        });
      }
      send({ type: "done", threadId });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    writeSse(res, { type: "error", message: msg });
    writeSse(res, { type: "done", threadId });
  } finally {
    try {
      await ideMcp?.close();
    } catch {
      /* ignore */
    }
    res.end();
  }
}

export function newThreadId(): string {
  return randomUUID();
}
