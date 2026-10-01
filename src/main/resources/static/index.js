import {Modal} from "./Components/Modal.js";
import {API_ADAPTER} from "./api-adapter.js";
import {Popup} from "./Components/Popup.js";
import {SidebarService} from "./Services/SidebarService.js";
import {HeaderService} from "./Services/HeaderService.js";
import {SettingsManager} from "./Managers/SettingsManager.js";
import {FileManager} from "./Managers/FileManager.js";
import {UploadManager} from "./Managers/UploadManager.js";
import {FileListService} from "./Services/FileListService.js";
import {BodyText} from "./Components/BodyText.js";

const selectFileFromLocation = () => {
    const fileId = FileManager.FileIdFromLocation();
    if (!fileId) return FileManager.ShowOverview({ updateHistory: false });

    if (FileManager.GetFile(fileId)) {
        FileManager.SetActiveFile(fileId, { updateHistory: false });
    } else {
        FileManager.ShowOverview();
        Popup.error("Datei nicht gefunden", "Die Datei existiert nicht oder wurde gelöscht");
    }
};

window.onload = async () => {
    const httpOk = await API_ADAPTER.ensureBackendConnection();

    if (!httpOk) {
        await new Modal("Keine Verbindung zum Backend", [
            new BodyText(undefined, {
                identifier: "http-status",
                text: "HTTP: Nicht erreichbar",
                className: "http-status"
            })
        ], { canBeClosedManually: false }).render();
        return;
    }

    SettingsManager.loadSettings();
    SidebarService.setupSidebar();
    HeaderService.setupHeader();
    FileListService.setupFileList();
    UploadManager.init();

    try {
        await FileManager.LoadFiles();
        selectFileFromLocation();
        window.addEventListener("popstate", selectFileFromLocation);
    }

    catch (e) {
        Popup.debug("Initialization failed", e.message);
    }
}
