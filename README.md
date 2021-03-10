# rtk-query-grpc

This library wraps rtk-query to make it easier to use GRPc based APIs without loosing type-safety.

WIP API:
```ts
export const uploadAPI = createApi(createGrpcDefinition({
  client: UploadServicePromiseClient,
  clientArgs: ["http://localhost:8081"],
  reducerPath: "api",
  entityTypes: ["Upload"],
  endpoints: (builder) => ({
    listUploads: builder.query("listUploads", {
      query: (r: ListUploadsRequest.AsObject) =>
        new ListUploadsRequest()
          .setParent(r.parent)
          .setPageSize(r.pageSize)
          .setPageToken(r.pageToken),
      provides: ({ uploadsList }) => [
        ...uploadsList.map(({ name }) => builder.result("Upload", name)),
        builder.result("Upload", "LIST"),
      ],
    }),

    getUpload: builder.query("getUpload", {
      query: (r: GetUploadRequest.AsObject) =>
        new GetUploadRequest().setName(r.name),
      provides: (_, r) => [builder.result("Upload", r.name)],
    }),

    createUpload: builder.mutation("createUpload", {
      query: (r: CreateUploadRequest.AsObject) =>
        new CreateUploadRequest().setParent(r.parent).setUpload(new Upload()),
      invalidates: [builder.result("Upload", "LIST")],
    }),
    
    deleteUpload: builder.mutation("deleteUpload", {
      query: (r: DeleteUploadRequest.AsObject) =>
        new DeleteUploadRequest().setName(r.name),
      invalidates: (_, { name }) => [builder.result("Upload", name)],
    }),
  }),
}));

export const {
  useListUploadsQuery,
  useCreateUploadMutation,
  useDeleteUploadMutation,
} = uploadAPI;

```