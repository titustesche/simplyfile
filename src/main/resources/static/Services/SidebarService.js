import {DomRegister} from "../Static/DomRegister.js";
import {Button} from "../Components/Button.js";
import {ICONS} from "../Static/Icons.js";
import {SettingsManager} from "../Managers/SettingsManager.js";
import {FileManager} from "../Managers/FileManager.js";
import {UploadManager} from "../Managers/UploadManager.js";
import {Format} from "../Static/Format.js";

export const SidebarService = {
    controlsContainer: undefined,
    navigation: {},

    storageInfo: undefined,
    uploadInfo: undefined,
    uploadInfoText: undefined,
    uploadInfoFill: undefined,

    setupSidebar: () => {
        if (!DomRegister.sidebarContainer) throw new Error("Sidebar container not found");
        SidebarService.controlsContainer = document.createElement("div");
        SidebarService.controlsContainer.classList.add("sidebar-controls");

        SidebarService.navigation.files = new Button(SidebarService.controlsContainer, {
            icon: ICONS.FOLDER,
            identifier: "files-button",
            text: "Meine Dateien",
            className: "sidebar-nav-button",
            onClick: () => FileManager.ShowOverview()
        });

        const uploadButton = new Button(SidebarService.controlsContainer, {
            icon: ICONS.UPLOAD,
            identifier: "upload-file-button",
            text: "Datei hochladen",
            className: "prominent-button",
            onClick: () => UploadManager.openFileDialog()
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

        SidebarService.navigation.files.render();
        uploadButton.render();
        settingsButton.render();

        DomRegister.sidebarContainer.appendChild(SidebarService.controlsContainer);

        // Status boxes at the bottom of the sidebar
        const infoContainer = document.createElement("div");
        infoContainer.classList.add("sidebar-info");

        SidebarService.uploadInfo = document.createElement("div");
        SidebarService.uploadInfo.classList.add("sidebar-info-box", "sidebar-upload-info", "hidden");
        SidebarService.uploadInfo.title = "Zu den Uploads";
        SidebarService.uploadInfo.addEventListener("click", () => FileManager.ShowOverview());
        const uploadTitle = document.createElement("p");
        uploadTitle.classList.add("sidebar-info-title");
        uploadTitle.innerText = "Uploads";
        SidebarService.uploadInfoText = document.createElement("p");
        SidebarService.uploadInfoText.classList.add("sidebar-info-text");
        const uploadTrack = document.createElement("div");
        uploadTrack.classList.add("upload-item-progress");
        SidebarService.uploadInfoFill = document.createElement("div");
        SidebarService.uploadInfoFill.classList.add("upload-item-progress-fill");
        uploadTrack.appendChild(SidebarService.uploadInfoFill);
        SidebarService.uploadInfo.append(uploadTitle, SidebarService.uploadInfoText, uploadTrack);

        SidebarService.storageInfo = document.createElement("div");
        SidebarService.storageInfo.classList.add("sidebar-info-box");

        infoContainer.append(SidebarService.uploadInfo, SidebarService.storageInfo);
        DomRegister.sidebarContainer.appendChild(infoContainer);
    },

    setActiveView: (view) => {
        for (const [name, button] of Object.entries(SidebarService.navigation)) {
            button._container.classList.toggle("active", name === view);
        }
    },

    setStorageInfo: (files) => {
        if (!SidebarService.storageInfo) return;
        const totalSize = files.reduce((acc, file) => acc + (file.size ?? 0), 0);
        const largest = files.reduce((acc, file) => (!acc || file.size > acc.size) ? file : acc, undefined);

        SidebarService.storageInfo.innerHTML = "";
        const title = document.createElement("p");
        title.classList.add("sidebar-info-title");
        title.innerText = "Speicher";
        const text = document.createElement("p");
        text.classList.add("sidebar-info-text");
        text.innerText = `${files.length} ${files.length === 1 ? "Datei" : "Dateien"} · ${Format.bytes(totalSize)}`;
        SidebarService.storageInfo.append(title, text);

        if (largest) {
            const largestText = document.createElement("p");
            largestText.classList.add("sidebar-info-text", "muted-text");
            largestText.innerText = `Größte: ${largest.filename} (${Format.bytes(largest.size)})`;
            largestText.title = largest.filename;
            SidebarService.storageInfo.appendChild(largestText);
        }
    },

    setUploadProgress: (progress) => {
        if (!SidebarService.uploadInfo) return;
        SidebarService.uploadInfo.classList.toggle("hidden", progress.count === 0);
        if (progress.count === 0) return;

        const fraction = progress.total > 0 ? progress.loaded / progress.total : 0;
        SidebarService.uploadInfoText.innerText =
            `${progress.count} ${progress.count === 1 ? "Datei" : "Dateien"} · ${Math.floor(fraction * 100)} % · ${Format.bytes(progress.loaded)} von ${Format.bytes(progress.total)}`;
        SidebarService.uploadInfoFill.style.width = `${fraction * 100}%`;
    }
};
