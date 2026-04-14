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
    const confirm = (resume as { confirm?: unknown }).confirm;
    if (typeof confirm !== "boolean") {
      res.status(400).json({
        error: 'Resume requests require { "threadId": string, "resume": { "confirm": boolean } }',
      });
      return;
    }
    await runChatAgent({ kind: "resume", threadId, confirm }, res);
    return;
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    res.status(400).json({
      error:
        'Body must include { "message": string, "threadId"?: string } or { "threadId": string, "resume": { "confirm": boolean } }',
    });
    return;
  }

  await runChatAgent({ kind: "start", threadId, message }, res);
});

const port = Number(process.env.PORT) || 5055;
app.listen(port, () => {
  console.log(`AI-Agent server listening on http://localhost:${port}`);
});
