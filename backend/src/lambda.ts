import type { Handler } from "aws-lambda";
import { getServerlessHandler } from "./bootstrap";

/**
 * Netlify Functions entry (see netlify/functions/api.ts).
 * Wraps the Express app with serverless-http after DB init.
 */
export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const fn = await getServerlessHandler();
  return fn(event, context);
};
