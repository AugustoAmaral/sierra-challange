import client from "./queryClient";

async function deleteFile(id: string) {
  return client.api.file({ id }).delete();
}

export default deleteFile;
