import { apiInstance } from "./apiInstance";
import apiRoutes from "./apiRoutes";
import { Bounty, Submission } from "@/types";

export const bountyApi = apiInstance.injectEndpoints({
  endpoints: (builder) => ({
    getBounties: builder.query<
      { bounties: Bounty[]; total: number; page: number; totalPages: number },
      {
        category?: string;
        status?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: (params) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => v !== undefined && sp.append(k, String(v)));
        return `${apiRoutes.bounties.list}?${sp.toString()}`;
      },
      providesTags: ["bounties"],
    }),

    getBounty: builder.query<{ bounty: Bounty & { submissions?: Submission[] } }, string>({
      query: (id) => apiRoutes.bounties.get(id),
      providesTags: (_r, _e, id) => [{ type: "bounty", id }],
    }),

    initiateBounty: builder.mutation<
      { unsignedTxnGroupBase64: string[]; bountyId: string; bountyData: unknown },
      { title: string; description: string; category: string; tags: string[]; rewardUSDC: number; deadline: string }
    >({
      query: (body) => ({ url: apiRoutes.bounties.create, method: "POST", body }),
    }),

    confirmBounty: builder.mutation<
      { bounty: Bounty },
      { bountyId: string; txId: string; bountyData: unknown }
    >({
      query: ({ bountyId, ...body }) => ({
        url: apiRoutes.bounties.confirm(bountyId),
        method: "POST",
        body,
      }),
      invalidatesTags: ["bounties"],
    }),

    submitToBounty: builder.mutation<{ submission: Submission }, { bountyId: string; formData: FormData }>({
      query: ({ bountyId, formData }) => ({
        url: apiRoutes.bounties.submit(bountyId),
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: (_r, _e, { bountyId }) => [{ type: "bounty", id: bountyId }],
    }),

    acceptSubmission: builder.mutation<
      { unsignedTxnBase64: string; submissionId: string },
      { bountyId: string; submissionId: string }
    >({
      query: ({ bountyId, submissionId }) => ({
        url: apiRoutes.bounties.accept(bountyId, submissionId),
        method: "POST",
      }),
    }),

    confirmAcceptance: builder.mutation<
      { txId: string; downloadUrl: string },
      { bountyId: string; submissionId: string; txId: string }
    >({
      query: ({ bountyId, submissionId, txId }) => ({
        url: apiRoutes.bounties.confirmAccept(bountyId, submissionId),
        method: "POST",
        body: { txId },
      }),
      invalidatesTags: (_r, _e, { bountyId }) => ["bounties", { type: "bounty", id: bountyId }],
    }),

    initiateRefund: builder.mutation<{ unsignedTxnBase64: string }, string>({
      query: (bountyId) => ({ url: apiRoutes.bounties.refund(bountyId), method: "POST" }),
    }),

    confirmRefund: builder.mutation<{ success: boolean }, { bountyId: string; txId: string }>({
      query: ({ bountyId, txId }) => ({
        url: apiRoutes.bounties.confirmRefund(bountyId),
        method: "POST",
        body: { txId },
      }),
      invalidatesTags: ["bounties"],
    }),
  }),
});

export const {
  useGetBountiesQuery,
  useGetBountyQuery,
  useInitiateBountyMutation,
  useConfirmBountyMutation,
  useSubmitToBountyMutation,
  useAcceptSubmissionMutation,
  useConfirmAcceptanceMutation,
  useInitiateRefundMutation,
  useConfirmRefundMutation,
} = bountyApi;
