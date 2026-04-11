import { apiInstance } from "./apiInstance";
import apiRoutes from "./apiRoutes";
import { User, UserDashboardStats } from "@/types";

export const userApi = apiInstance.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<{ user: User; stats: UserDashboardStats }, void>({
      query: () => apiRoutes.user.profile,
      providesTags: ["user"],
    }),

    updateProfile: builder.mutation<{ user: User }, { name?: string; bio?: string }>({
      query: (body) => ({ url: apiRoutes.user.profile, method: "PATCH", body }),
      invalidatesTags: ["user"],
    }),

    getListings: builder.query<{ datasets: unknown[]; total: number }, void>({
      query: () => apiRoutes.user.listings,
      providesTags: ["datasets"],
    }),

    getPurchases: builder.query<{ purchases: unknown[]; total: number }, void>({
      query: () => apiRoutes.user.purchases,
      providesTags: ["purchases"],
    }),

    getUserBounties: builder.query<{ bounties: unknown[]; total: number }, void>({
      query: () => apiRoutes.user.bounties,
      providesTags: ["bounties"],
    }),

    getSubmissions: builder.query<{ submissions: unknown[]; total: number }, void>({
      query: () => apiRoutes.user.submissions,
      providesTags: ["submissions"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetListingsQuery,
  useGetPurchasesQuery,
  useGetUserBountiesQuery,
  useGetSubmissionsQuery,
} = userApi;

// Re-export updateDataset from datasetApi for convenience in dashboard listings
export { useUpdateDatasetMutation } from "./datasetApi";
