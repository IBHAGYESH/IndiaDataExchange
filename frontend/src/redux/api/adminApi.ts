import { apiInstance } from "./apiInstance";
import apiRoutes from "./apiRoutes";

export const adminApi = apiInstance.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<{
      totalUsers: number;
      totalDatasets: number;
      totalBounties: number;
      totalVolume: number;
    }, void>({
      query: () => apiRoutes.admin.stats,
    }),

    getAdminDatasets: builder.query<{ datasets: unknown[]; total: number }, { page?: number; limit?: number }>({
      query: (params) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v !== undefined && sp.append(k, String(v)));
        return `${apiRoutes.admin.datasets}?${sp.toString()}`;
      },
    }),

    updateDatasetStatus: builder.mutation<unknown, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: apiRoutes.admin.datasetStatus(id),
        method: "PATCH",
        body: { status },
      }),
    }),

    getAdminBounties: builder.query<{ bounties: unknown[]; total: number }, { page?: number; limit?: number }>({
      query: (params) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v !== undefined && sp.append(k, String(v)));
        return `${apiRoutes.admin.bounties}?${sp.toString()}`;
      },
    }),

    updateBountyStatus: builder.mutation<unknown, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: apiRoutes.admin.bountyStatus(id),
        method: "PATCH",
        body: { status },
      }),
    }),
  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAdminDatasetsQuery,
  useUpdateDatasetStatusMutation,
  useGetAdminBountiesQuery,
  useUpdateBountyStatusMutation,
} = adminApi;
