/**
 * Netlify catch-all function: proxies every request to the Express app via serverless-http.
 * Requires `npm run build` so `dist/lambda.js` exists before deploy.
 */
export { handler } from "../../dist/lambda";
