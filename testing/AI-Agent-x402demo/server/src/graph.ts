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
import type {
  DatasetChoiceCandidate,
  DatasetSummary,
  EmitFn,
  PurchaseProposal,
} from "./types.js";

/** Model proposes only genuinely relevant listings; we filter by fitScore before showing the user. */
const RelevantCandidatesSchema = z.object({
  relevantDatasets: z
    .array(
      z.object({
        datasetId: z.string(),
        matchNote: z
          .string()
          .describe(
            "One concrete sentence linking this listing (topic, region, time, format) to the user's request"
          ),
        fitScore: z
          .number()
          .int()
          .min(1)
          .max(10)
          .describe(
            "Honest 1–10 fit to the user's request; only include rows you would score 7+ (clear plausible value)"
          ),
      })
    )
    .max(5)
    .describe(
      "ONLY datasets that plausibly help the user's request. Best match first. Return FEWER than 5 if only 1–2 qualify — never pad with unrelated or tangential listings. Return an empty array if nothing in the catalog is a reasonable match. IMPORTANT: If several listings are ALL needed for one combined answer (e.g. compare A vs B), return ONLY the single best one to buy FIRST — the user buys one per round; later rounds will offer the rest."
    ),
});

/** Routes general chat vs marketplace dataset purchase flow. */
const IntentSchema = z.object({
  needsCatalogData: z
    .boolean()
    .describe(
      "True only if a good answer requires searching/buying India Data Exchange marketplace datasets (tabular/geo/business data files). False for greetings, thanks, small talk, generic Algorand/USDC help, or questions answerable without opening the catalog."
    ),
  reason: z
    .string()
    .max(180)
    .describe("One short phrase for logs (not shown to user)"),
});

const ContinueSchema = z.object({
  satisfied: z
    .boolean()
    .describe(
      "True only if summaries from already-purchased files are enough to answer the user's specific request fully and on-topic"
    ),
  postPurchaseAnalysis: z
    .string()
    .describe(
      "2–5 sentences comparing what the user asked for to what the downloaded summaries actually show; state gaps, wrong topic, or missing dimensions if any"
    ),
  rationale: z.string().describe("One-line conclusion (why stop or why buy another dataset)"),
});

const AgentState = Annotation.Root({
  userPrompt: Annotation<string>,
  /** Set by assess_intent: whether to run list_datasets → purchase pipeline. */
  needsDatasetData: Annotation<boolean>({
    value: (_prev, next) => next,
    default: () => false,
  }),
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
  purchaseCandidates: Annotation<DatasetChoiceCandidate[]>({
    value: (_prev, next) => next,
    default: () => [],
  }),
  researchComplete: Annotation<boolean>({
    reducer: (prev, next) => (next === true ? true : prev),
    default: () => false,
  }),
  /** User declined a further purchase/choice but summaries from earlier buys exist — answer from those. */
  declinedOptionalPurchase: Annotation<boolean>({
    value: (_prev, next) => next,
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

/** Keep chat-only replies to at most two lines for token/display limits. */
function clampToTwoLines(text: string, maxChars = 320): string {
  const t = text.trim().replace(/\r\n/g, "\n");
  const lines = t.split("\n").filter((l) => l.length > 0);
  const two = lines.slice(0, 2).join("\n");
  return two.length > maxChars ? `${two.slice(0, maxChars - 1)}…` : two;
}

export function buildDatasetAgentGraph(
  deps: BuildGraphDeps,
  checkpointer: MemorySaver
) {
  const { emit, ideBaseUrl, ideFrontendBaseUrl, ideMcp, payment, getThreadId } =
    deps;
  const base = stripTrailingSlash(ideBaseUrl);
  const front = stripTrailingSlash(ideFrontendBaseUrl);

  const assessIntent = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    emit({
      type: "step",
      step: "assess_intent",
      detail: "Checking whether marketplace datasets are required",
    });
    const model = new ChatOpenAI({
      configuration: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      modelName: "gpt-4o-mini",
      temperature: 0,
      maxTokens: 200,
    });
    const structured = model.withStructuredOutput(IntentSchema);
    try {
      const out = await structured.invoke([
        {
          role: "system",
          content: [
            "You gate an India Data Exchange assistant.",
            "needsCatalogData=true ONLY when the user wants data that would come from buying/downloading marketplace datasets (CSVs, regional stats, surveys, etc.).",
            "needsCatalogData=false for: hi/hello/thanks/bye, chit-chat, jokes, generic crypto/Algorand/USDC help, UI/how-to without data, or vague messages with no data need.",
            "When unsure but the message is only conversational, choose false.",
          ].join("\n"),
        },
        { role: "user", content: state.userPrompt },
      ]);
      emit({
        type: "step",
        step: "assess_intent",
        detail: `${out.needsCatalogData ? "Catalog flow" : "Chat-only"} — ${out.reason}`,
      });
      return { needsDatasetData: out.needsCatalogData, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      emit({
        type: "step",
        step: "assess_intent",
        detail: `Classification failed: ${msg.slice(0, 120)}`,
      });
      return {
        error: `Intent check failed: ${msg}`,
        needsDatasetData: false,
      };
    }
  };

  const briefChat = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    emit({
      type: "step",
      step: "brief_chat",
      detail: "Short LLM reply (max 2 lines, low tokens)",
    });
    if (state.error?.trim()) {
      return {
        finalAnswer: clampToTwoLines(
          `Something went wrong: ${state.error.trim().slice(0, 200)}`
        ),
      };
    }
    const model = new ChatOpenAI({
      configuration: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      modelName: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 90,
    });
    const msg = await model.invoke([
      {
        role: "system",
        content: [
          "You are a friendly India Data Exchange assistant.",
          "Reply in at most TWO lines total (one newline between lines is OK).",
          "Hard limit ~280 characters. No bullet lists longer than 2 lines.",
          "Do not start a dataset search or mention x402 unless the user explicitly asked about buying data.",
          "If they need marketplace data, say in one line they can ask a question that needs dataset files (e.g. regional sales, surveys).",
        ].join(" "),
      },
      { role: "user", content: state.userPrompt },
    ]);
    const raw =
      typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? JSON.stringify(msg.content)
          : String(msg.content ?? "");
    return { finalAnswer: clampToTwoLines(raw) };
  };

  function routeAfterAssess(state: AgentStateType): string {
    return state.needsDatasetData ? "data" : "chat";
  }

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

  const rankCandidates = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    emit({
      type: "step",
      step: "rank_candidates",
      detail: "Filtering catalog for relevant matches only (gpt-4o-mini)",
    });
    const datasets = state.datasets ?? [];
    if (datasets.length === 0) {
      return { error: "Internal: no datasets in state" };
    }
    const purchased = new Set(state.purchasedDatasetIds ?? []);
    const pool = datasets.filter((d) => !purchased.has(d._id));
    if (pool.length === 0) {
      return {
        error:
          "No datasets left in the catalog that have not been purchased in this session.",
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
    const poolById = new Map(pool.map((d) => [d._id, d]));
    const priorPurchaseCount = state.purchasedDatasetIds?.length ?? 0;

    /** Only one listing left — always offer it (LLM strict pass often wrongly drops the last piece). */
    if (pool.length === 1) {
      const d = pool[0]!;
      const candidates: DatasetChoiceCandidate[] = [
        {
          datasetId: d._id,
          title: d.title ?? d._id,
          priceUSDC: d.priceUSDC ?? 0,
          publicUrl: `${front}${marketplacePath(d._id)}`,
          category: d.category,
          matchNote:
            priorPurchaseCount > 0
              ? "Only unpurchased dataset left in this catalog — use it to cover the remaining part of your question after your earlier purchase(s)."
              : "Only dataset in the current catalog for your filters — confirm if it fits your goal.",
        },
      ];
      emit({
        type: "step",
        step: "rank_candidates",
        detail: "Single remaining listing — offering it for purchase",
      });
      return {
        purchaseCandidates: candidates,
        chosenDatasetId: null,
        error: null,
      };
    }

    const model = new ChatOpenAI({
      configuration: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      },
      modelName: "gpt-4o-mini",
      temperature: 0,
    });
    const structured = model.withStructuredOutput(RelevantCandidatesSchema);
    const contextBlock =
      (state.datasetNotes ?? "").trim().length > 0
        ? `\n\nSummaries from datasets ALREADY purchased in this session (do not suggest these again; suggest only what adds missing information):\n${state.datasetNotes}\n`
        : "";
    const MIN_FIT = 7;
    const MIN_FIT_RELAXED = 5;
    try {
      const out = await structured.invoke([
        {
          role: "system",
          content: [
            "You curate a SHORTLIST for an India Data Exchange buyer.",
            "The buyer selects ONE dataset per round, pays, then may see another shortlist.",
            "If their question needs MULTIPLE different listings (e.g. compare kirana vs street food), return ONLY the single best listing to buy FIRST; another round will offer the rest after summaries exist. Do not force the user to pick between two both-required options in one list.",
            "From the catalog JSON, include ONLY dataset _id values that plausibly help the user's request.",
            "Do NOT fill slots with unrelated listings — fewer rows is better than noisy rows.",
            "Order best match first. At most 5 ids. If only one or two qualify, return only those.",
            "If nothing reasonably matches, return relevantDatasets: [].",
            `Every datasetId MUST appear in the catalog (unpurchased pool size: ${pool.length}).`,
          ].join("\n"),
        },
        {
          role: "user",
          content: `User message:\n${state.userPrompt}${contextBlock}\n\nCatalog (JSON):\n${JSON.stringify(catalog, null, 2)}`,
        },
      ]);
      const buildCandidates = (minFit: number) => {
        const scored = (out.relevantDatasets ?? [])
          .filter(
            (row) =>
              poolById.has(row.datasetId) &&
              typeof row.fitScore === "number" &&
              row.fitScore >= minFit
          )
          .sort((a, b) => b.fitScore - a.fitScore);
        const seen = new Set<string>();
        const list: DatasetChoiceCandidate[] = [];
        for (const row of scored) {
          if (seen.has(row.datasetId)) continue;
          seen.add(row.datasetId);
          const d = poolById.get(row.datasetId)!;
          list.push({
            datasetId: d._id,
            title: d.title ?? d._id,
            priceUSDC: d.priceUSDC ?? 0,
            publicUrl: `${front}${marketplacePath(d._id)}`,
            category: d.category,
            matchNote: row.matchNote,
          });
          if (list.length >= 5) break;
        }
        return list;
      };

      let candidates = buildCandidates(MIN_FIT);
      let usedRelaxedFollowUp = false;
      if (
        candidates.length === 0 &&
        priorPurchaseCount > 0 &&
        pool.length > 0
      ) {
        candidates = buildCandidates(MIN_FIT_RELAXED);
        usedRelaxedFollowUp = candidates.length > 0;
      }
      if (candidates.length === 0) {
        return {
          error:
            "No remaining catalog listings pass the relevance bar for your request (or none scored high enough). Try different keywords, a broader or narrower topic, or start a New chat.",
          researchComplete: true,
          purchaseCandidates: [],
          chosenDatasetId: null,
        };
      }

      /** Do not make the user pick between two legs of one combined answer on round 1. */
      let sequentialNote = "";
      const looksLikeMultiPartCommerceQuestion =
        priorPurchaseCount === 0 &&
        pool.length >= 2 &&
        candidates.length > 1 &&
        /\b(should i|which one|which option|vs\.?|versus|compare|or a|or an)\b/i.test(
          state.userPrompt
        );
      if (looksLikeMultiPartCommerceQuestion) {
        candidates = candidates.slice(0, 1);
        sequentialNote = " — first of a sequential plan (one purchase per round)";
      }

      const fitLabel = usedRelaxedFollowUp
        ? `fit≥${MIN_FIT_RELAXED} (follow-up round)`
        : `fit≥${MIN_FIT}`;
      emit({
        type: "step",
        step: "rank_candidates",
        detail: `${candidates.length} relevant match(es) for user choice (${fitLabel})${sequentialNote}`,
      });
      return {
        purchaseCandidates: candidates,
        chosenDatasetId: null,
        error: null,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        error: `Dataset ranking failed: ${msg}`,
        purchaseCandidates: [],
        chosenDatasetId: null,
      };
    }
  };

  const awaitDatasetChoice = async (
    state: AgentStateType
  ): Promise<Partial<AgentStateType>> => {
    if (state.error) return {};
    const candidates = state.purchaseCandidates;
    if (candidates.length === 0) {
      return { error: "No purchase candidates to choose from." };
    }
    emit({
      type: "pending_dataset_choice",
      threadId: getThreadId(),
      candidates,
    });
    const decision = interrupt({ candidates }) as unknown as {
      datasetId?: string;
      declineChoice?: boolean;
    };
    if (!decision || decision.declineChoice === true) {
      const hasPriorSummaries = (state.datasetNotes ?? "").trim().length > 0;
      if (hasPriorSummaries) {
        emit({
          type: "step",
          step: "dataset_choice_declined",
          detail:
            "User skipped another listing; answering from already-purchased summaries",
        });
        return {
          error: null,
          researchComplete: true,
          declinedOptionalPurchase: true,
          purchaseCandidates: [],
          chosenDatasetId: null,
        };
      }
      return {
        error: "Dataset selection cancelled.",
        researchComplete: true,
        purchaseCandidates: [],
        chosenDatasetId: null,
      };
    }
    const id = decision.datasetId?.trim();
    if (!id || !candidates.some((c) => c.datasetId === id)) {
      return {
        error: "Invalid dataset choice — id not in the offered list.",
        researchComplete: true,
        purchaseCandidates: [],
        chosenDatasetId: null,
      };
    }
    emit({
      type: "step",
      step: "dataset_chosen",
      detail: id,
    });
    return {
      chosenDatasetId: id,
      purchaseCandidates: [],
      error: null,
    };
  };

  function routeAfterDatasetChoice(state: AgentStateType): string {
    if (state.error) return "fail";
    if (state.declinedOptionalPurchase) return "finish_with_data";
    return "confirm";
  }

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
      const hasPriorSummaries = (state.datasetNotes ?? "").trim().length > 0;
      if (hasPriorSummaries) {
        emit({
          type: "step",
          step: "extra_purchase_declined",
          detail:
            "User declined an additional dataset; using summaries from earlier confirmed purchase(s)",
        });
        return {
          error: null,
          researchComplete: true,
          declinedOptionalPurchase: true,
        };
      }
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
    const ds = state.datasets?.find((d) => d._id === id);
    const url =
      ds?.purchaseApiUrl?.trim() ||
      `${base}/api/datasets/${encodeURIComponent(id)}/download`;
    emit({
      type: "step",
      step: "purchasing",
      detail: `Agent x402 + GET ${url}`,
    });
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
          content: [
            "You are the post-purchase analyst for an India Data Exchange agent.",
            "The agent downloaded dataset files and produced TEXT summaries of their contents (not the full raw files).",
            "Compare the user's ORIGINAL request to what those summaries actually show.",
            "Set satisfied=true ONLY if the combined summaries already answer the user's question in substance (correct topic, enough coverage) without needing more files.",
            "If summaries are off-topic, too thin, missing requested geography/time/metrics, or leave important parts of the question unanswered, set satisfied=false.",
            "If not satisfied, the human will pick another dataset from a relevance-ranked shortlist — you do not choose ids.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `User goal:\n${state.userPrompt}`,
            "",
            "Summaries from purchased & processed files so far:",
            state.datasetNotes || "(none)",
            "",
            "Remaining unpurchased catalog entries (for context only — you already judged purchased content):",
            JSON.stringify(catalog, null, 2),
          ].join("\n"),
        },
      ]);
      const analysisPreview =
        out.postPurchaseAnalysis.length > 420
          ? `${out.postPurchaseAnalysis.slice(0, 420)}…`
          : out.postPurchaseAnalysis;
      emit({
        type: "step",
        step: "plan",
        detail: `${out.satisfied ? "Goal appears met by purchased data" : "Goal may need another dataset"}\n${analysisPreview}\n— ${out.rationale}`,
      });
      if (out.satisfied) {
        return { researchComplete: true };
      }
      return { researchComplete: false };
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
    const partialDecline =
      state.declinedOptionalPurchase === true && hasNotes && !err;
    const cancelled =
      !partialDecline &&
      (err.includes("declined") || err.includes("cancelled"));
    const pipelineOk = hasNotes && !err;

    const userContent = [
      cancelled
        ? "Pipeline status: USER_CANCELLED — the user declined a purchase confirmation before any usable file summaries existed."
        : partialDecline
          ? "Pipeline status: PARTIAL_SUCCESS — the user confirmed at least one earlier dataset purchase; summarized file content is below. They declined buying an additional optional dataset. Answer their question using ONLY these summaries; state clearly if something (e.g. exact weekly rupee earnings) is not in the data instead of inventing it."
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
      ? "The user declined buying a dataset before any data was available. Acknowledge briefly and invite them to try again. Do not blame wallet or IDE."
      : partialDecline
        ? "You are the India Data Exchange AI agent. The user already has summarized content from dataset(s) they paid for earlier in this conversation. They chose not to buy one more optional dataset. Still give the best possible answer from the summaries provided; note gaps or uncertainty where the summaries do not support a numeric claim (e.g. weekly earnings)."
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
    if (state.declinedOptionalPurchase) return "finish_with_data";
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

  function routeAfterRank(state: AgentStateType): string {
    if (state.error) return "fail";
    if (!state.purchaseCandidates?.length) return "fail";
    return "choice";
  }

  return new StateGraph(AgentState)
    .addNode("assess_intent", assessIntent)
    .addNode("brief_chat", briefChat)
    .addNode("list_datasets", listDatasets)
    .addNode("rank_candidates", rankCandidates)
    .addNode("await_dataset_choice", awaitDatasetChoice)
    .addNode("await_confirm", awaitPurchaseConfirm)
    .addNode("purchase_and_download", purchaseAndDownload)
    .addNode("process_file", processFile)
    .addNode("merge_results", mergeResults)
    .addNode("decide_continue", decideContinue)
    .addNode("respond", respond)
    .addEdge(START, "assess_intent")
    .addConditionalEdges("assess_intent", routeAfterAssess, {
      data: "list_datasets",
      chat: "brief_chat",
    })
    .addEdge("brief_chat", END)
    .addEdge("list_datasets", "rank_candidates")
    .addConditionalEdges("rank_candidates", routeAfterRank, {
      choice: "await_dataset_choice",
      fail: "respond",
    })
    .addConditionalEdges("await_dataset_choice", routeAfterDatasetChoice, {
      confirm: "await_confirm",
      fail: "respond",
      finish_with_data: "respond",
    })
    .addConditionalEdges("await_confirm", routeAfterConfirm, {
      finish_with_data: "respond",
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
      more: "rank_candidates",
    })
    .addEdge("respond", END)
    .compile({ checkpointer });
}

export function createAgentCheckpointer(): MemorySaver {
  return new MemorySaver();
}
