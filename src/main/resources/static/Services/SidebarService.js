import {DomRegister} from "../Static/DomRegister.js";
import {TextInput} from "../Components/TextInput.js";
import {Button} from "../Components/Button.js";
import {ICONS} from "../Static/Icons.js";
import {SettingsManager} from "../Managers/SettingsManager.js";
import {FileManager} from "../Managers/FileManager.js";
import {UploadInput} from "../Managers/UploadInputManager.js";

const SORTS = [
    { label: "Name A–Z", compare: (a, b) => a.filename.localeCompare(b.filename) },
    { label: "Name Z–A", compare: (a, b) => b.filename.localeCompare(a.filename) },
    { label: "Größte zuerst", compare: (a, b) => (b.size ?? 0) - (a.size ?? 0) },
];

export const SidebarService = {
    controlsContainer: undefined,
    fileContainer: null,
    files: [],

    searchInput: undefined,
    sortButton: undefined,
    sortIndex: 0,

    setupSidebar: () => {
        if (!DomRegister.sidebarContainer) throw new Error("Sidebar container not found");
        SidebarService.controlsContainer = document.createElement("div");
        SidebarService.controlsContainer.classList.add("sidebar-controls");

        const uploadButton = new Button(SidebarService.controlsContainer, {
            icon: ICONS.UPLOAD,
            identifier: "upload-file-button",
            text: "Datei hochladen",
            className: "prominent-button",
            onClick: () => {
                FileManager.ClearActiveFile();
                UploadInput.openFileDialog();
            }
        });

        const settingsButton = new Button(SidebarService.controlsContainer, {
            icon: ICONS.SETTINGS,
            identifier: "settings-button",
            className: "prominent-button secondary",
            text: "Einstellungen",
            onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                SettingsManager.openSettingsModal();
            }
        });

        uploadButton.render();
        settingsButton.render();

        // Search & sort
        const filterContainer = document.createElement("div");
        filterContainer.classList.add("sidebar-filter");

        SidebarService.searchInput = new TextInput(filterContainer, {
            identifier: "file-search",
            placeholder: "Dateien durchsuchen ...",
            censorInput: false
        });
        SidebarService.searchInput.render();
        // Input events bubble up from the text input
        filterContainer.addEventListener("input", () => SidebarService.setFiles(FileManager.Files));

        SidebarService.sortButton = new Button(filterContainer, {
            icon: ICONS.SWAP,
            identifier: "file-sort-button",
            text: SORTS[0].label,
            className: "prominent-button tertiary",
            onClick: () => {
                SidebarService.sortIndex = (SidebarService.sortIndex + 1) % SORTS.length;
                SidebarService.sortButton._buttonElement.innerText = SORTS[SidebarService.sortIndex].label;
                SidebarService.setFiles(FileManager.Files);
            }
        });
        SidebarService.sortButton.render();
        SidebarService.controlsContainer.appendChild(filterContainer);

        DomRegister.sidebarContainer.appendChild(SidebarService.controlsContainer);

        SidebarService.fileContainer = document.createElement("div");
        SidebarService.fileContainer.classList.add("conversation-container");
        DomRegister.sidebarContainer.appendChild(SidebarService.fileContainer);
    },

    setFiles: (files) => {
        if (!SidebarService.fileContainer) throw new Error("File container not found, did you forget to call setupSidebar()?");
        SidebarService.fileContainer.innerHTML = "";
        SidebarService.files = [];

        const query = (SidebarService.searchInput?.value ?? "").trim().toLowerCase();
        const visibleFiles = files.filter(file => !query || file.filename.toLowerCase().includes(query));

        const anyFiles = visibleFiles.length > 0;
        SidebarService.fileContainer.classList.toggle("empty", !anyFiles);

        if (!anyFiles) {
            const infoText = document.createElement("p");
            infoText.classList.add("sidebar-info-text");
            infoText.innerText = query ? `Keine Treffer für „${query}“` : "Noch keine Dateien";
            return SidebarService.fileContainer.appendChild(infoText);
        }

        visibleFiles.sort(SORTS[SidebarService.sortIndex].compare);

        visibleFiles.forEach(file => {
            SidebarService.fileContainer.appendChild(file.createSidebarEntry());
            SidebarService.files.push(file);
        });
    }
};
