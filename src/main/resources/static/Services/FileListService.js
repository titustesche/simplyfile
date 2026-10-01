import {DomRegister} from "../Static/DomRegister.js";
import {TextInput} from "../Components/TextInput.js";
import {Button} from "../Components/Button.js";
import {ICONS} from "../Static/Icons.js";
import {Format} from "../Static/Format.js";

const SORTS = [
    { label: "Name A–Z", compare: (a, b) => a.filename.localeCompare(b.filename) },
    { label: "Name Z–A", compare: (a, b) => b.filename.localeCompare(a.filename) },
    { label: "Größte zuerst", compare: (a, b) => (b.size ?? 0) - (a.size ?? 0) },
    { label: "Kleinste zuerst", compare: (a, b) => (a.size ?? 0) - (b.size ?? 0) },
];

export const FileListService = {
    files: [],
    searchInput: undefined,
    sortButton: undefined,
    sortIndex: 0,

    setupFileList: () => {
        const filterContainer = DomRegister.overview.fileFilter;
        if (!filterContainer) throw new Error("File filter container not found");

        FileListService.searchInput = new TextInput(filterContainer, {
            identifier: "file-search",
            placeholder: "Dateien durchsuchen ...",
            censorInput: false
        });
        FileListService.searchInput.render();
        // Input events bubble up from the text input
        filterContainer.addEventListener("input", () => FileListService.render());

        FileListService.sortButton = new Button(filterContainer, {
            icon: ICONS.SWAP,
            identifier: "file-sort-button",
            text: SORTS[0].label,
            className: "prominent-button tertiary",
            onClick: () => {
                FileListService.sortIndex = (FileListService.sortIndex + 1) % SORTS.length;
                FileListService.sortButton._buttonElement.innerText = SORTS[FileListService.sortIndex].label;
                FileListService.render();
            }
        });
        FileListService.sortButton.render();
    },

    setFiles: (files) => {
        FileListService.files = files;
        const totalSize = files.reduce((acc, file) => acc + (file.size ?? 0), 0);
        DomRegister.overview.fileCount.innerText =
            `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} · ${Format.bytes(totalSize)}`;
        FileListService.render();
    },

    render: () => {
        const fileList = DomRegister.overview.fileList;
        fileList.innerHTML = "";

        const query = (FileListService.searchInput?.value ?? "").trim().toLowerCase();
        const visibleFiles = FileListService.files
            .filter(file => !query || file.filename.toLowerCase().includes(query))
            .sort(SORTS[FileListService.sortIndex].compare);

        fileList.classList.toggle("empty", visibleFiles.length === 0);

        if (visibleFiles.length === 0) {
            const infoText = document.createElement("p");
            infoText.classList.add("file-list-info-text");
            infoText.innerText = query
                ? `Keine Treffer für „${query}“`
                : "Noch keine Dateien – zieh etwas in das Feld oben.";
            fileList.appendChild(infoText);
            return;
        }

        visibleFiles.forEach(file => fileList.appendChild(file.createListEntry()));
    }
};
