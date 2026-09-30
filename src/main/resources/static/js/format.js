function formatBytes(n) {
    if (!Number.isFinite(n)) return "–";
    let s;
    if (n < 1024) return n + " B";
    if (n < 1048576) s = (n / 1024).toFixed(1) + " KB";
    else if (n < 1073741824) s = (n / 1048576).toFixed(1) + " MB";
    else s = (n / 1073741824).toFixed(2) + " GB";
    return s.replace(".", ",");
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-bytes]").forEach((el) => {
        el.textContent = formatBytes(Number(el.textContent.trim()));
    });
});
