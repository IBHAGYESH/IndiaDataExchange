import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import config from "@/config";

const baseQueryWithReauth = async (args: Parameters<ReturnType<typeof fetchBaseQuery>>[0], api: Parameters<ReturnType<typeof fetchBaseQuery>>[1], extraOptions: Parameters<ReturnType<typeof fetchBaseQuery>>[2]) => {
  const result = await fetchBaseQuery({
    baseUrl: config.apiUrl,
    prepareHeaders: (headers) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("ide_jwt");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      }
      return headers;
    },
  })(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ide_jwt");
      localStorage.removeItem("ide_user");
      localStorage.removeItem("ide_wallet");
    }
  }

  return result;
};

export const apiInstance = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "user",
    "dataset",
    "datasets",
    "bounty",
    "bounties",
    "submission",
    "submissions",
    "purchase",
    "purchases",
  ],
  endpoints: () => ({}),
});
