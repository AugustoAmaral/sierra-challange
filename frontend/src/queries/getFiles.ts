import client from "./queryClient";

function getFiles(textSearch?: string, content?: boolean) {
  return client.api.files
    .get({
      query: { limit: 100, offset: 0, textSearch, content },
    })
    .then(({ data }) => ({
      ...data,
      files: data?.files.map((file) => ({
        ...file,
        createdAt: new Date(file.createdAt),
      })),
    }));
}

export default getFiles;
