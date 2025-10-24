type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

type UploadOptions = {
  onProgress?: (progress: UploadProgress) => void;
};

type UploadResponse = {
  data?: {
    success: boolean;
    message: string;
    files: Array<{
      id: string;
      originalName: string;
      filename: string;
      size: number;
      sizeFormatted: string;
      mimeType: string;
      uploadedAt: string;
      url: string;
    }>;
  };
};

async function uploadFile(
  file: File,
  options?: UploadOptions
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    // Adiciona o arquivo ao FormData
    formData.append("files", file);

    // Configura o evento de progresso
    if (options?.onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          options.onProgress?.({
            loaded: e.loaded,
            total: e.total,
            percentage,
          });
        }
      });
    }

    // Configura o evento de conclusão
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ data: response });
        } catch {
          reject(new Error("Erro ao processar resposta do servidor"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(error);
        } catch {
          reject(new Error(`Erro HTTP: ${xhr.status}`));
        }
      }
    });

    // Configura o evento de erro
    xhr.addEventListener("error", () => {
      reject(new Error("Erro de rede ao fazer upload"));
    });

    // Configura o evento de cancelamento
    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelado"));
    });

    // Envia a requisição
    xhr.open("POST", "http://localhost:3000/api/upload");
    xhr.send(formData);
  });
}

export default uploadFile;
