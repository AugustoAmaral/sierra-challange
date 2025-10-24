function getFile(id: string) {
  const fileUrl = `http://localhost:3000/api/file/${id}`;
  window.open(fileUrl, "_blank");
}

export default getFile;
