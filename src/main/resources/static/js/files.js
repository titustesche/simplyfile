document.addEventListener("DOMContentLoaded", () => {
    const dropzone = document.getElementById("dropzone");
    const dropzoneTitle = document.getElementById("dropzoneTitle");
    const fileInput = document.getElementById("fileInput");
    const search = document.getElementById("fileSearch");
    const sortButton = document.getElementById("sortButton");
    const list = document.getElementById("fileList");
    const emptyState = document.getElementById("emptyState");
    const rows = Array.from(list.querySelectorAll(".fileRow"));

    const defaultTitle = dropzoneTitle.textContent;
    const defaultEmpty = emptyState.textContent;

    // Upload

    async function upload(files) {
        if (!files || files.length === 0) return;

        dropzone.classList.remove("error");
        dropzone.classList.add("busy");

        let failed = 0;
        for (let i = 0; i < files.length; i++) {
            dropzoneTitle.textContent = `Lade hoch … (${i + 1}/${files.length})`;
            const formData = new FormData();
            formData.append("file", files[i]);
            try {
                const r = await fetch("/file/upload", { method: "POST", body: formData });
                if (!r.ok) failed++;
            } catch (e) {
                failed++;
            }
        }

        dropzone.classList.remove("busy");
        if (failed > 0) {
            dropzone.classList.add("error");
            dropzoneTitle.textContent = `${failed} von ${files.length} Uploads fehlgeschlagen`;
            if (failed < files.length) setTimeout(() => window.location.reload(), 1500);
            return;
        }
        window.location.reload();
    }

    fileInput.addEventListener("change", () => {
        upload(Array.from(fileInput.files));
        fileInput.value = "";
    });

    ["dragenter", "dragover"].forEach((type) => dropzone.addEventListener(type, (e) => {
        e.preventDefault();
        dropzone.classList.add("dragging");
        dropzoneTitle.textContent = "Loslassen zum Hochladen";
    }));

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragging");
        dropzoneTitle.textContent = defaultTitle;
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragging");
        upload(Array.from(e.dataTransfer.files));
    });

    // Search & sort

    const sorts = [
        { label: "Name A–Z", cmp: (a, b) => a.dataset.name.localeCompare(b.dataset.name) },
        { label: "Name Z–A", cmp: (a, b) => b.dataset.name.localeCompare(a.dataset.name) },
        { label: "Größte zuerst", cmp: (a, b) => Number(b.dataset.size) - Number(a.dataset.size) },
    ];
    let sortIndex = 0;

    function render() {
        const q = search.value.trim().toLowerCase();
        let visible = 0;

        rows.sort(sorts[sortIndex].cmp).forEach((row) => {
            const match = !q || row.dataset.name.toLowerCase().includes(q);
            row.hidden = !match;
            if (match) visible++;
            list.appendChild(row);
        });

        sortButton.textContent = sorts[sortIndex].label;
        emptyState.hidden = visible > 0;
        emptyState.textContent = q ? `Keine Treffer für „${search.value.trim()}“.` : defaultEmpty;
    }

    search.addEventListener("input", render);
    sortButton.addEventListener("click", () => {
        sortIndex = (sortIndex + 1) % sorts.length;
        render();
    });

    // Copy share link

    list.addEventListener("click", async (e) => {
        const button = e.target.closest("[data-copy]");
        if (!button) return;

        const label = button.querySelector("span");
        const link = new URL(button.dataset.link, window.location.origin).href;
        try {
            await navigator.clipboard.writeText(link);
            label.textContent = "Kopiert ✓";
        } catch (err) {
            window.prompt("Link kopieren:", link);
        }
        setTimeout(() => (label.textContent = "Link kopieren"), 1600);
    });

    render();
});
