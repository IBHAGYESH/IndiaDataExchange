const apiRoutes = {
  auth: {
    nonce: (walletAddress: string) => `/auth/nonce/${walletAddress}`,
    verify: `/auth/verify`,
    usdcStatus: (walletAddress: string) => `/auth/usdc-status/${walletAddress}`,
    buildOptin: `/auth/build-optin`,
    submitOptin: `/auth/submit-optin`,
  },
  datasets: {
    list: `/api/datasets`,
    get: (id: string) => `/api/datasets/${id}`,
    create: `/api/datasets`,
    update: (id: string) => `/api/datasets/${id}`,
    delete: (id: string) => `/api/datasets/${id}`,
    download: (id: string) => `/api/datasets/${id}/download`,
  },
  bounties: {
    list: `/api/bounties`,
    get: (id: string) => `/api/bounties/${id}`,
    create: `/api/bounties`,
    confirm: (id: string) => `/api/bounties/${id}/confirm`,
    submit: (id: string) => `/api/bounties/${id}/submit`,
    accept: (id: string, subId: string) => `/api/bounties/${id}/accept/${subId}`,
    confirmAccept: (id: string, subId: string) => `/api/bounties/${id}/accept/${subId}/confirm`,
    refund: (id: string) => `/api/bounties/${id}/refund`,
    confirmRefund: (id: string) => `/api/bounties/${id}/refund/confirm`,
  },
  user: {
    profile: `/api/user/profile`,
    account: `/api/user/account`,
    listings: `/api/user/listings`,
    purchases: `/api/user/purchases`,
    bounties: `/api/user/bounties`,
    submissions: `/api/user/submissions`,
  },
  admin: {
    stats: `/api/admin/stats`,
    datasets: `/api/admin/datasets`,
    datasetStatus: (id: string) => `/api/admin/datasets/${id}/status`,
    bounties: `/api/admin/bounties`,
    bountyStatus: (id: string) => `/api/admin/bounties/${id}/status`,
  },
};

export default apiRoutes;
