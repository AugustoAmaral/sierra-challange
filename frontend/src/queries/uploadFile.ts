import client from "./queryClient";

async function uploadFile(files: File[]) {
  return client.api.upload.post({ files });
}

export default uploadFile;
