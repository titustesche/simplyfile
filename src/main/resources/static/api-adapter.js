export class API_ADAPTER {
    // Frontend and backend are served by the same Spring Boot app
    static API_HTTP_URL = window.location.origin;

    static async ensureBackendConnection() {
        return await fetch(`${API_ADAPTER.API_HTTP_URL}/status`, {
            method: "GET",
        })
            .then(response => {
                return response.ok;
            })
            .catch(() => false)
    }

    static getFiles() {
        return fetch(`${API_ADAPTER.API_HTTP_URL}/file/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) return [];
                    throw new Error(response.statusText);
                }
                return response.json();
            })
    }

    static deleteFile(fileId) {
        return fetch(`${API_ADAPTER.API_HTTP_URL}/file/${fileId}`, {
            method: "DELETE",
        })
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
            })
    }

    static getFileContent(fileId) {
        return fetch(`${API_ADAPTER.API_HTTP_URL}/file/${fileId}/download`, {
            method: "GET",
        })
            .then(response => {
                if (!response.ok) throw new Error(response.statusText);
                return response.text();
            })
    }

    // XMLHttpRequest instead of fetch, because fetch cannot report upload progress.
    // Returns the running request (for abort()) and a promise with the uploaded file.
    static uploadFile(file, onProgress) {
        const request = new XMLHttpRequest();
        const promise = new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);

            request.open("POST", `${API_ADAPTER.API_HTTP_URL}/file/upload`);
            request.responseType = "json";

            request.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable && onProgress) onProgress(e.loaded, e.total);
            });
            request.addEventListener("load", () => {
                if (request.status >= 200 && request.status < 300) resolve(request.response);
                else reject(new Error(request.statusText || `HTTP ${request.status}`));
            });
            request.addEventListener("error", () => reject(new Error("Netzwerkfehler")));
            request.addEventListener("abort", () => reject(new Error("Abgebrochen")));

            request.send(formData);
        });

        return { request, promise };
    }
}
