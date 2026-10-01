import {DomRegister} from "../Static/DomRegister.js";
import {API_ADAPTER} from "../api-adapter.js";
import {FileManager} from "./FileManager.js";
import {Popup} from "../Components/Popup.js";
import {UploadItem, UPLOAD_STATES} from "../Components/UploadItem.js";
import {ICONS} from "../Static/Icons.js";
import {SidebarService} from "../Services/SidebarService.js";

export class UploadManager {
    static dropzone = DomRegister.overview.dropzone;
    static dropzoneTitle = DomRegister.overview.dropzoneTitle;
    static fileInput = DomRegister.overview.fileInput;
    static uploadList = DomRegister.overview.uploadList;
    static dropTarget = DomRegister.mainContainer;

    static DefaultDropzoneTitle = "Dateien hierher ziehen";
    static HideFinishedAfter = 6000;

    static _items = [];
    static _current = undefined;
    static _request = undefined;
    static _aborted = false;

    static get Items() { return this._items; }
    static get IsUploading() { return this._items.some(item => item.isActive); }

    // Combined progress of all uploads that are still running or waiting
    static get Progress() {
        const active = this._items.filter(item => item.isActive);
        const total = active.reduce((acc, item) => acc + item.total, 0);
        const loaded = active.reduce((acc, item) => acc + item.loaded, 0);
        return { count: active.length, loaded, total };
    }

    static init() {
        DomRegister.overview.dropzoneIcon.innerHTML = ICONS.UPLOAD;

        this.fileInput.addEventListener("change", () => {
            this.addFiles(this.fileInput.files);
            this.fileInput.value = "";
        });

        // Files can be dropped anywhere on the main area, the dropzone highlights
        ["dragenter", "dragover"].forEach(type => this.dropTarget.addEventListener(type, (e) => {
            if (!e.dataTransfer?.types.includes("Files")) return;
            e.preventDefault();
            FileManager.ShowOverview();
            this.dropzone.classList.add("dragging");
            this.dropzoneTitle.innerText = "Loslassen zum Hochladen";
        }));
        this.dropTarget.addEventListener("dragleave", (e) => {
            if (this.dropTarget.contains(e.relatedTarget)) return;
            this._resetDropzone();
        });
        this.dropTarget.addEventListener("drop", (e) => {
            if (!e.dataTransfer?.types.includes("Files")) return;
            e.preventDefault();
            this._resetDropzone();
            this.addFiles(e.dataTransfer.files);
        });

        window.addEventListener("beforeunload", (e) => {
            if (!this.IsUploading) return;
            e.preventDefault();
            e.returnValue = "";
        });
    }

    static openFileDialog() {
        FileManager.ShowOverview();
        this.fileInput.click();
    }

    static addFiles(fileList) {
        const files = Array.from(fileList ?? []);
        if (files.length === 0) return;

        for (const file of files) {
            const item = new UploadItem(this.uploadList, {
                file,
                onAction: (item) => this._onItemAction(item),
                onRetry: (item) => this._retry(item),
            });
            item.render();
            this._items.push(item);
        }

        this._update();
        this._next();
    }

    static _onItemAction(item) {
        switch (item.state) {
            case UPLOAD_STATES.QUEUED:
                item.setState(UPLOAD_STATES.CANCELLED);
                this._remove(item);
                break;

            case UPLOAD_STATES.UPLOADING:
            case UPLOAD_STATES.PROCESSING:
                this._aborted = true;
                this._request?.abort();
                break;

            case UPLOAD_STATES.FAILED:
            case UPLOAD_STATES.CANCELLED:
            case UPLOAD_STATES.DONE:
                this._remove(item);
                break;
        }
    }

    static _retry(item) {
        item.reset();
        this._update();
        this._next();
    }

    // Uploads run one after another, so every file gets the full bandwidth
    static async _next() {
        if (this._current) return;
        const item = this._items.find(item => item.state === UPLOAD_STATES.QUEUED);
        if (!item) return this._update();

        this._current = item;
        item.setState(UPLOAD_STATES.UPLOADING);

        this._aborted = false;
        const { request, promise } = API_ADAPTER.uploadFile(item.file, (loaded, total) => {
            if (item.state !== UPLOAD_STATES.UPLOADING) return;
            item.updateProgress(loaded);
            if (loaded >= total) item.setState(UPLOAD_STATES.PROCESSING);
            this._update();
        });
        this._request = request;

        try {
            const response = await promise;
            const fileEntry = FileManager.AddFile(response);
            item.setState(UPLOAD_STATES.DONE);
            FileManager.HighlightFile(fileEntry.id);
            setTimeout(() => {
                if (item.state === UPLOAD_STATES.DONE) this._remove(item);
            }, this.HideFinishedAfter);
        } catch (e) {
            if (this._aborted) {
                item.setState(UPLOAD_STATES.CANCELLED);
            } else {
                item.setState(UPLOAD_STATES.FAILED, `Fehlgeschlagen: ${e.message ?? e}`);
                Popup.error("Upload fehlgeschlagen", `${item.file.name}: ${e.message ?? e}`);
            }
        } finally {
            this._current = undefined;
            this._request = undefined;
        }

        if (!this.IsUploading) this._announceFinished();
        this._update();
        this._next();
    }

    static _announceFinished() {
        const done = this._items.filter(item => item.state === UPLOAD_STATES.DONE);
        if (done.length === 1) Popup.info("Hochgeladen", `„${done[0].file.name}“ wurde hochgeladen`, 3);
        else if (done.length > 1) Popup.info("Hochgeladen", `${done.length} Dateien wurden hochgeladen`, 3);
    }

    static _remove(item) {
        this._items = this._items.filter(i => i !== item);
        item.destroy();
        this._update();
    }

    static _resetDropzone() {
        this.dropzone.classList.remove("dragging");
        this.dropzoneTitle.innerText = this.DefaultDropzoneTitle;
    }

    static _update() {
        this.dropzone.classList.toggle("busy", this.IsUploading);
        this.uploadList.classList.toggle("empty", this._items.length === 0);
        SidebarService.setUploadProgress(this.Progress);
    }
}
