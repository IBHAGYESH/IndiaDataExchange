import { apiInstance } from "./apiInstance";
import apiRoutes from "./apiRoutes";

export const authApi = apiInstance.injectEndpoints({
  endpoints: (builder) => ({
    getNonce: builder.query<{ nonce: string; expiresAt: number }, string>({
      query: (walletAddress) => apiRoutes.auth.nonce(walletAddress),
    }),
    verifyWallet: builder.mutation<
      { token: string; user: unknown; isNewUser: boolean },
      { walletAddress: string; signature: string; nonce: string }
    >({
      query: (body) => ({ url: apiRoutes.auth.verify, method: "POST", body }),
    }),
    getUsdcStatus: builder.query<{ isOptedIn: boolean; usdcBalance: number }, string>({
      query: (walletAddress) => apiRoutes.auth.usdcStatus(walletAddress),
    }),
    buildOptIn: builder.mutation<{ unsignedTxnBase64: string }, { walletAddress: string }>({
      query: (body) => ({ url: apiRoutes.auth.buildOptin, method: "POST", body }),
    }),
    submitOptIn: builder.mutation<
      { txId: string; success: boolean },
      { walletAddress: string; signedTxnBase64: string }
    >({
      query: (body) => ({ url: apiRoutes.auth.submitOptin, method: "POST", body }),
    }),
  }),
});

export const {
  useGetNonceQuery,
  useLazyGetNonceQuery,
  useVerifyWalletMutation,
  useLazyGetUsdcStatusQuery,
  useBuildOptInMutation,
  useSubmitOptInMutation,
} = authApi;
