import "dotenv/config";
import cors from "cors";
import express from "express";
import { newThreadId, runChatAgent } from "./runner.js";

const app = express();
app.use(express.json({ limit: "256kb" }));

const corsOrigin = process.env.CORS_ORIGIN?.trim() || "*";
app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin,
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ide-ai-agent" });
});

app.post("/api/chat", async (req, res) => {
  const body = req.body as Record<string, unknown>;
  const threadIdRaw = body.threadId;
  const threadId =
    typeof threadIdRaw === "string" && threadIdRaw.trim()
      ? threadIdRaw.trim()
      : newThreadId();

  const resume = body.resume;
  if (resume != null && typeof resume === "object" && resume !== null) {
    const r = resume as Record<string, unknown>;
    if (r.declineChoice === true) {
      await runChatAgent(
        { kind: "resume", threadId, resume: { declineChoice: true } },
        res
      );
      return;
    }
    if (typeof r.datasetId === "string" && r.datasetId.trim()) {
      await runChatAgent(
        { kind: "resume", threadId, resume: { datasetId: r.datasetId.trim() } },
        res
      );
      return;
    }
    if (typeof r.confirm === "boolean") {
      await runChatAgent(
        { kind: "resume", threadId, resume: { confirm: r.confirm } },
        res
      );
      return;
    }
    res.status(400).json({
      error:
        'Resume requires one of: { "confirm": boolean }, { "datasetId": string }, { "declineChoice": true }',
    });
    return;
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    res.status(400).json({
      error:
        'Body must include { "message": string, "threadId"?: string } or { "threadId": string, "resume": { ... } }',
    });
    return;
  }

  await runChatAgent({ kind: "start", threadId, message }, res);
});

const port = Number(process.env.PORT) || 5055;
app.listen(port, () => {
  console.log(`AI-Agent server listening on http://localhost:${port}`);
});
