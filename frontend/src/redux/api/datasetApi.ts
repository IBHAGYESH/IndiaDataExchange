import { apiInstance } from "./apiInstance";
import apiRoutes from "./apiRoutes";
import { Dataset } from "@/types";

interface ListDatasetsResponse {
  datasets: Dataset[];
  total: number;
  page: number;
  totalPages: number;
}

interface ListDatasetsParams {
  category?: string;
  tags?: string;
  format?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const datasetApi = apiInstance.injectEndpoints({
  endpoints: (builder) => ({
    getDatasets: builder.query<ListDatasetsResponse, ListDatasetsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== "") searchParams.append(k, String(v));
        });
        return `${apiRoutes.datasets.list}?${searchParams.toString()}`;
      },
      providesTags: ["datasets"],
    }),

    getDataset: builder.query<{ dataset: Dataset }, string>({
      query: (id) => apiRoutes.datasets.get(id),
      providesTags: (_result, _error, id) => [{ type: "dataset", id }],
    }),

    createDataset: builder.mutation<{ dataset: Dataset }, FormData>({
      query: (body) => ({
        url: apiRoutes.datasets.create,
        method: "POST",
        body,
        formData: true,
      }),
      invalidatesTags: ["datasets"],
    }),

    updateDataset: builder.mutation<{ dataset: Dataset }, { id: string; updates: Partial<Dataset> }>({
      query: ({ id, updates }) => ({
        url: apiRoutes.datasets.update(id),
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["datasets"],
    }),

    deleteDataset: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: apiRoutes.datasets.delete(id), method: "DELETE" }),
      invalidatesTags: ["datasets"],
    }),
  }),
});

export const {
  useGetDatasetsQuery,
  useLazyGetDatasetsQuery,
  useGetDatasetQuery,
  useCreateDatasetMutation,
  useUpdateDatasetMutation,
  useDeleteDatasetMutation,
} = datasetApi;
