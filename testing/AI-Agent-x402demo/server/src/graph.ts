import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
} from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { stripTrailingSlash } from "./ideClient.js";
import type { IdeMcpBridge } from "./mcpIdeBridge.js";
import type { PaymentFetchContext } from "./paymentFetch.js";
import { parsePurchaseBody, processDownloadedFile } from "./processFile.js";
import type { DatasetSummary, EmitFn, PurchaseProposal } from "./types.js";

const PickSchema = z.object({
  datasetId: z.string().describe("The dataset _id from the catalog JSON"),
  rationale: z
    .string()
    .describe("One short sentence why this dataset fits the user message"),
});

const ContinueSchema = z.object({
  satisfied: z
    .boolean()
    .describe("True if the user's goal is fully met using the data summaries collected so far"),
  nextDatasetId: z
    .string()
    .nullable()
    .describe(
      "If not satisfied, the exact _id of one remaining (not yet purchased) dataset to buy next; otherwise null"
    ),
  rationale: z.string().describe("Brief reasoning"),
});

const AgentState = Annotation.Root({
  userPrompt: Annotation<string>,
  datasets: Annotation<DatasetSummary[] | null>,
  chosenDatasetId: Annotation<string | null>,
  purchaseResultJson: Annotation<string | null>,
  processedSummary: Annotation<string | null>,
  datasetNotes: Annotation<string>({
    reducer: (a, b) => {
      if (b == null || b === "") return a;
      if (!a) return b;
      return `${a}\n\n---\n\n${b}`;
    },
    default: () => "",
  }),
  purchasedDatasetIds: Annotation<string[]>({
    reducer: (existing, update) => {
      const u = update ?? [];
      return [...new Set([...existing, ...u])];
    },
    default: () => [],
  }),
  researchComplete: Annotation<boolean>({
    reducer: (prev, next) => (next === true ? true : prev),
    default: () => false,
  }),
  finalAnswer: Annotation<string | null>,
  error: Annotation<string | null>,
});

export type AgentStateType = typeof AgentState.State;

export interface BuildGraphDeps {
  emit: EmitFn;
  ideBaseUrl: string;
  ideFrontendBaseUrl: string;
  ideMcp: IdeMcpBridge;
  payment: PaymentFetchContext;
  getThreadId: () => string;
}

function maxPriceFilter(datasets: DatasetSummary[]): DatasetSummary[] {
  const raw = process.env.MAX_DATASET_PRICE_USDC?.trim();
  if (!raw) return datasets;
  const max = Number(raw);
  if (Number.isNaN(max)) return datasets;
  return datasets.filter((d) => (d.priceUSDC ?? 0) <= max);
}

function marketplacePath(id: string): string {
  return `/marketplace/${id}`;
}

export function buildDatasetAgentGraph(
  deps: BuildGraphDeps,
  checkpointer: MemorySaver
) {
  const { emit, ideBaseUrl, ideFrontendBaseUrl, ideMcp, payment, getThreadId } =
    deps;
  const base = stripTrailingSlash(ideBaseUrl);
  const front = stripTrailingSlash(ideFrontendBaseUrl);

  const listDatasets = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    emit({
      type: "step",
      step: "list_datasets",
      detail: "MCP ide_list_datasets",
    });
    try {
      const limitRaw = process.env.MCP_LIST_DATASETS_LIMIT?.trim();
      const limit =
        limitRaw && !Number.isNaN(Number(limitRaw)) && Number(limitRaw) > 0
          ? Number(limitRaw)
          : 50;
      let datasets = await ideMcp.listDatasets({ limit });
      datasets = maxPriceFilter(datasets);
      if (datasets.length === 0) {
        return {
          error:
            "No datasets returned from MCP catalog (or all filtered by MAX_DATASET_PRICE_USDC).",
        };
      }
      emit({
        type: "step",
        step: "list_datasets",
        detail: `Loaded ${datasets.length} dataset(s)`,
      });
      return { datasets, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: msg };
    }
  };

  const selectDataset = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    emit({
      type: "step",
      step: "select_dataset",
      detail: "Asking gpt-4o-mini to pick a dataset",
    });
    const datasets = state.datasets ?? [];
    if (datasets.length === 0) {
      return { error: "Internal: no datasets in state" };
    }
    const purchased = new Set(state.purchasedDatasetIds ?? []);
    const pool = datasets.filter((d) => !purchased.has(d._id));
    if (pool.length === 0) {
      return {
        error: "No datasets left in the catalog that have not been purchased in this session.",
        researchComplete: true,
      };
    }
    const catalog = pool.map((d) => ({
      _id: d._id,
      title: d.title,
      description: (d.description ?? "").slice(0, 400),
      category: d.category,
      priceUSDC: d.priceUSDC,
    }));
    const model = new ChatOpenAI({
      configuration: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      modelName: "gpt-4o-mini",
      temperature: 0,
    });
    const structured = model.withStructuredOutput(PickSchema);
    const contextBlock =
      (state.datasetNotes ?? "").trim().length > 0
        ? `\n\nData gathered so far (summaries from datasets already purchased in this session):\n${state.datasetNotes}\n`
        : "";
    try {
      const picked = await structured.invoke([
        {
          role: "system",
          content:
            "You choose one dataset _id from the catalog that best advances the user's goal. Only pick an _id that appears in the catalog. Prefer datasets not yet summarized if the user needs more data.",
        },
        {
          role: "user",
          content: `User message:\n${state.userPrompt}${contextBlock}\n\nCatalog (JSON):\n${JSON.stringify(catalog, null, 2)}`,
        },
      ]);
      const exists = pool.some((d) => d._id === picked.datasetId);
      if (!exists) {
        return {
          error: `Model picked unknown dataset id: ${picked.datasetId}`,
        };
      }
      emit({
        type: "step",
        step: "choose_dataset",
        detail: `${picked.datasetId} — ${picked.rationale}`,
      });
      return { chosenDatasetId: picked.datasetId, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `Dataset selection failed: ${msg}` };
    }
  };

  const awaitPurchaseConfirm = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    const id = state.chosenDatasetId;
    if (!id) {
      return { error: "No dataset selected for purchase confirmation." };
    }
    const ds = state.datasets?.find((d) => d._id === id);
    let title = ds?.title ?? id;
    let priceUSDC = ds?.priceUSDC ?? 0;
    let category = ds?.category;
    try {
      const fresh = await ideMcp.getDataset(id);
      const d = fresh.dataset;
      if (d) {
        title = d.title ?? title;
        priceUSDC = d.priceUSDC ?? priceUSDC;
        category = d.category ?? category;
      }
    } catch {
      /* use catalog snapshot */
    }
    const proposal: PurchaseProposal = {
      datasetId: id,
      title,
      priceUSDC,
      publicUrl: `${front}${marketplacePath(id)}`,
      category,
    };
    emit({
      type: "pending_confirmation",
      threadId: getThreadId(),
      proposal,
    });
    const decision = interrupt(proposal) as unknown as { confirm: boolean };
    if (!decision || decision.confirm !== true) {
      return {
        error: "Purchase cancelled — you declined this dataset.",
        researchComplete: true,
      };
    }
    return { error: null };
  };

  const purchaseAndDownload = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    const id = state.chosenDatasetId;
    if (!id) return { error: "No dataset id to purchase" };
    emit({
      type: "step",
      step: "purchasing",
      detail: `Agent x402 + GET ${base}/api/datasets/${id}/download`,
    });
    const url = `${base}/api/datasets/${id}/download`;
    try {
      const res = await payment.fetchWithPayment(url, {
        headers: {
          "x-payment-wallet": payment.payerAddress,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        return {
          error: `Download failed: HTTP ${res.status} ${t.slice(0, 400)}`,
        };
      }
      const body = await res.json();
      const json = JSON.stringify(body);
      emit({
        type: "step",
        step: "download_ready",
        detail: body.fileName ? `fileName=${body.fileName}` : "success",
      });
      return { purchaseResultJson: json, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `x402 / download error: ${msg}` };
    }
  };

  const processFile = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    const raw = state.purchaseResultJson;
    if (!raw) return { error: "No purchase result to process" };
    const body = parsePurchaseBody(raw);
    if (!body?.downloadUrl) {
      return { error: `Unexpected purchase body (missing downloadUrl): ${raw.slice(0, 300)}` };
    }
    emit({
      type: "step",
      step: "downloading",
      detail: body.fileName ?? body.downloadUrl,
    });
    try {
      const capRaw = process.env.MAX_DOWNLOAD_BYTES?.trim();
      const cap =
        capRaw && !Number.isNaN(Number(capRaw)) && Number(capRaw) > 0
          ? Number(capRaw)
          : undefined;
      const summary = await processDownloadedFile(
        body.downloadUrl,
        body.fileName ?? "download",
        cap
      );
      emit({
        type: "step",
        step: "analyzing",
        detail: "Built text/CSV/JSON summary",
      });
      return { processedSummary: summary, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { error: `File processing failed: ${msg}` };
    }
  };

  const mergeResults = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    const id = state.chosenDatasetId;
    const summary = state.processedSummary;
    if (!id || !summary) return {};
    const block = `### Dataset ${id}\n${summary}`;
    emit({
      type: "step",
      step: "merge",
      detail: `Recorded summary for ${id}`,
    });
    return {
      datasetNotes: block,
      purchasedDatasetIds: [id],
      purchaseResultJson: null,
      processedSummary: null,
      error: null,
    };
  };

  const decideContinue = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return { researchComplete: true };
    const datasets = state.datasets ?? [];
    const purchased = new Set(state.purchasedDatasetIds ?? []);
    const pool = datasets.filter((d) => !purchased.has(d._id));
    if (pool.length === 0) {
      emit({
        type: "step",
        step: "decide_continue",
        detail: "No unpurchased datasets left — finishing",
      });
      return { researchComplete: true };
    }
    emit({
      type: "step",
      step: "decide_continue",
      detail: "Checking if another dataset purchase is needed",
    });
    const catalog = pool.map((d) => ({
      _id: d._id,
      title: d.title,
      description: (d.description ?? "").slice(0, 320),
      category: d.category,
      priceUSDC: d.priceUSDC,
    }));
    const model = new ChatOpenAI({
      configuration: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      modelName: "gpt-4o-mini",
      temperature: 0,
    });
    const structured = model.withStructuredOutput(ContinueSchema);
    try {
      const out = await structured.invoke([
        {
          role: "system",
          content:
            "You plan the next step for an India Data Exchange agent. If the user's goal is fully answered using ONLY the summaries collected so far, set satisfied=true. If not, pick exactly one nextDatasetId from the remaining catalog (not yet purchased). Never pick an id not in the catalog JSON.",
        },
        {
          role: "user",
          content: `User goal:\n${state.userPrompt}\n\nSummaries from purchased datasets so far:\n${state.datasetNotes || "(none)"}\n\nRemaining datasets (JSON):\n${JSON.stringify(catalog, null, 2)}`,
        },
      ]);
      emit({
        type: "step",
        step: "plan",
        detail: `${out.satisfied ? "Done researching" : "Another dataset may help"} — ${out.rationale}`,
      });
      if (out.satisfied) {
        return { researchComplete: true };
      }
      if (
        !out.nextDatasetId ||
        !pool.some((d) => d._id === out.nextDatasetId)
      ) {
        return { researchComplete: true };
      }
      return {
        chosenDatasetId: out.nextDatasetId,
        researchComplete: false,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      emit({ type: "step", step: "decide_continue", detail: `Fallback: finish (${msg})` });
      return { researchComplete: true };
    }
  };

  const respond = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    emit({ type: "step", step: "respond", detail: "gpt-4o-mini final answer" });
    const model = new ChatOpenAI({
      configuration: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      modelName: "gpt-4o-mini",
      temperature: 0.1,
      streaming: true,
    });

    const err = state.error?.trim() ?? "";
    const notes = state.datasetNotes?.trim() ?? "";
    const hasNotes = notes.length > 0;
    const cancelled = err.includes("declined") || err.includes("cancelled");
    const pipelineOk = hasNotes && !err;

    const userContent = [
      cancelled
        ? "Pipeline status: USER_CANCELLED — the user declined a purchase confirmation."
        : pipelineOk
          ? "Pipeline status: SUCCESS — x402 purchase(s) you confirmed completed (agent wallet); summaries below are from those files."
          : err
            ? `Pipeline status: FAILED.\nError:\n${err}`
            : "Pipeline status: INCOMPLETE — no file summaries produced.",
      `User request:\n${state.userPrompt}`,
      state.chosenDatasetId && !hasNotes
        ? `Last focused dataset _id: ${state.chosenDatasetId}`
        : "",
      hasNotes ? `Collected file summaries:\n${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const system = cancelled
      ? "The user declined buying a dataset. Acknowledge briefly and invite them to try again with a new request. Do not blame wallet or IDE."
      : pipelineOk
        ? "You are the India Data Exchange AI agent. The user explicitly confirmed each purchase. Summarize what was bought and what the combined data shows; answer their question. Do not claim payment failed or mention insufficient balance."
        : "You are the India Data Exchange AI agent. Explain what went wrong and suggest fixes (agent wallet USDC/ALGO, IDE_API_BASE_URL, IDE_MCP_BASE_URL, keys) where relevant. Be concise.";

    let full = "";
    const stream = await model.stream([
      { role: "system", content: system },
      { role: "user", content: userContent },
    ]);
    for await (const chunk of stream) {
      const c = chunk.content;
      const piece =
        typeof c === "string"
          ? c
          : Array.isArray(c)
            ? JSON.stringify(c)
            : String(c);
      full += piece;
    }
    return { finalAnswer: full };
  };

  function routeAfterConfirm(state: AgentStateType): string {
    if (state.error) return "cancelled";
    return "purchase";
  }

  function routeAfterMerge(state: AgentStateType): string {
    if (state.error) return "fail";
    return "decide";
  }

  function routeAfterDecide(state: AgentStateType): string {
    if (state.researchComplete) return "done";
    return "more";
  }

  return new StateGraph(AgentState)
    .addNode("list_datasets", listDatasets)
    .addNode("select_dataset", selectDataset)
    .addNode("await_confirm", awaitPurchaseConfirm)
    .addNode("purchase_and_download", purchaseAndDownload)
    .addNode("process_file", processFile)
    .addNode("merge_results", mergeResults)
    .addNode("decide_continue", decideContinue)
    .addNode("respond", respond)
    .addEdge(START, "list_datasets")
    .addEdge("list_datasets", "select_dataset")
    .addEdge("select_dataset", "await_confirm")
    .addConditionalEdges("await_confirm", routeAfterConfirm, {
      cancelled: "respond",
      purchase: "purchase_and_download",
    })
    .addEdge("purchase_and_download", "process_file")
    .addEdge("process_file", "merge_results")
    .addConditionalEdges("merge_results", routeAfterMerge, {
      fail: "respond",
      decide: "decide_continue",
    })
    .addConditionalEdges("decide_continue", routeAfterDecide, {
      done: "respond",
      more: "await_confirm",
    })
    .addEdge("respond", END)
    .compile({ checkpointer });
}

export function createAgentCheckpointer(): MemorySaver {
  return new MemorySaver();
}
