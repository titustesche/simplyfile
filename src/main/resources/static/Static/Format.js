export const Format = {
    bytes: (n) => {
        if (!Number.isFinite(n)) return "–";
        let s;
        if (n < 1024) return n + " B";
        if (n < 1048576) s = (n / 1024).toFixed(1) + " KB";
        else if (n < 1073741824) s = (n / 1048576).toFixed(1) + " MB";
        else s = (n / 1073741824).toFixed(2) + " GB";
        return s.replace(".", ",");
    },

    duration: (seconds) => {
        if (!Number.isFinite(seconds) || seconds < 0) return "–";
        seconds = Math.ceil(seconds);
        if (seconds < 60) return `${seconds} s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min ${seconds % 60} s`;
        return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
    },

    fileLink: (id) => new URL(`/file/${id}`, window.location.origin).href,
    downloadLink: (id) => `/file/${id}/download`,
}
