import { ensureReady } from "./bootstrap";
import { expressApp } from "./server";

const serverInit = async () => {
  await ensureReady();
  const server = expressApp.listen();

  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};

serverInit().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
