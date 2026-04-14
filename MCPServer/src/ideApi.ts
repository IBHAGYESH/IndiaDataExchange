export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export interface ListDatasetsQuery {
  limit?: number;
  page?: number;
  search?: string;
  category?: string;
  tags?: string;
  format?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: string;
}

function toQueryString(q: ListDatasetsQuery): string {
  const p = new URLSearchParams();
  if (q.limit != null) p.set("limit", String(q.limit));
  if (q.page != null) p.set("page", String(q.page));
  if (q.search) p.set("search", q.search);
  if (q.category) p.set("category", q.category);
  if (q.tags) p.set("tags", q.tags);
  if (q.format) p.set("format", q.format);
  if (q.minPrice) p.set("minPrice", q.minPrice);
  if (q.maxPrice) p.set("maxPrice", q.maxPrice);
  if (q.sortBy) p.set("sortBy", q.sortBy);
  if (q.sortOrder) p.set("sortOrder", q.sortOrder);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function ideListDatasets(
  ideBaseUrl: string,
  query: ListDatasetsQuery = {}
): Promise<unknown> {
  const base = stripTrailingSlash(ideBaseUrl);
  const url = `${base}/api/datasets${toQueryString(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IDE list failed: ${res.status} ${text.slice(0, 400)}`);
  }
  return res.json();
}

export async function ideGetDataset(
  ideBaseUrl: string,
  datasetId: string
): Promise<unknown> {
  const base = stripTrailingSlash(ideBaseUrl);
  const url = `${base}/api/datasets/${encodeURIComponent(datasetId)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IDE get dataset failed: ${res.status} ${text.slice(0, 400)}`);
  }
  return res.json();
}
