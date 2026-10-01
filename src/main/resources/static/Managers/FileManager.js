import {DomRegister} from "../Static/DomRegister.js";
import {SidebarService} from "../Services/SidebarService.js";
import {Popup} from "../Components/Popup.js";
import {FileEntry} from "../Components/FileEntry.js";
import {Modal} from "../Components/Modal.js";
import {BodyText} from "../Components/BodyText.js";
import {GridLayout} from "../Components/GridLayout.js";
import {Button} from "../Components/Button.js";
import {API_ADAPTER} from "../api-adapter.js";

export class FileManager {
    static MainContainer = DomRegister.mainContainer;
    static UploadInputContainer = DomRegister.uploadInput.container;

    static _files = {};
    static set Files(value) {
        this._files = value.reduce((acc, file) => {
            acc[file.id] = file;
            return acc;
        }, {});
        SidebarService.setFiles(this.Files);
    }
    static get Files() {
        // Return a copy of the files array
        return Object.values(this._files);
    }

    static _activeFile = undefined;
    static get ActiveFile() { return this._activeFile; }

    static _empty = true;
    static set Empty(value) {
        switch (value) {
            case true:
                this.MainContainer.classList.add("empty");
                this.UploadInputContainer.classList.add("centered");
                this.UploadInputContainer.classList.remove("bottom");
                this._empty = true;
                break;

            case false:
                this.MainContainer.classList.remove("empty");
                this.UploadInputContainer.classList.remove("centered");
                this.UploadInputContainer.classList.add("bottom");
                this._empty = false;
                break;
        }
    }

    static async LoadFiles() {
        const files = await API_ADAPTER.getFiles();
        this.Files = files.map(file => new FileEntry(file));
    }

    static ClearActiveFile(options) {
        if (this._activeFile) {
            this._activeFile.unload();
            this._activeFile = undefined;
        }
        this.Empty = true;
        if (options?.updateHistory ?? true) this._updateHistory("/");
    }

    static SetActiveFile(fileId, options) {
        const file = this._files[fileId];
        if (!file) throw new Error("File does not exist");

        if (this._activeFile) this._activeFile.unload();
        file.load();
        this._activeFile = file;
        this.Empty = false;

        if (options?.updateHistory ?? true) this._updateHistory(`/file/${fileId}`);
    }

    static GetFile(fileId) {
        return this._files[fileId];
    }

    static async UploadFile(file, onProgress) {
        const response = await API_ADAPTER.uploadFile(file, onProgress);
        const fileEntry = new FileEntry(response);
        this._files[fileEntry.id] = fileEntry;
        SidebarService.setFiles(this.Files);
        return fileEntry;
    }

    static async ConfirmDeleteFile(fileId) {
        const file = this._files[fileId];
        if (!file) return;

        await new Promise(resolve => setTimeout(resolve, 1));
        const modal = new Modal("Datei löschen?", [
            new BodyText(undefined, {
                text: `„${file.filename}“ wird endgültig gelöscht. Geteilte Links funktionieren danach nicht mehr.`,
            }),
            new GridLayout(undefined, {
                identifier: "delete-file-buttons-grid",
                columns: 2,
                rows: 1,
                components: [
                    new Button(undefined, {
                        identifier: "delete-file-submit",
                        className: "prominent-button tertiary centered",
                        text: "Löschen",
                        onClick: () => {
                            this.DeleteFile(fileId);
                            modal.destroy();
                        }
                    }),
                    new Button(undefined, {
                        identifier: "delete-file-cancel",
                        className: "prominent-button secondary centered",
                        text: "Abbrechen",
                        onClick: () => modal.destroy()
                    })
                ]
            })
        ]);
        await modal.render();
    }

    static DeleteFile(fileId) {
        API_ADAPTER.deleteFile(fileId)
            .then(() => {
                const file = this._files[fileId];
                if (this._activeFile?.id === fileId) this.ClearActiveFile();
                delete this._files[fileId];
                file.delete();
                SidebarService.setFiles(this.Files);
                Popup.info("Gelöscht", `„${file.filename}“ wurde gelöscht`, 3);
            })
            .catch(reason => {
                Popup.error("Löschen fehlgeschlagen", reason);
            })
    }

    static _updateHistory(path) {
        if (window.location.pathname !== path) window.history.pushState({}, "", path);
    }

    // Reads the selected file from /file/{id} (shared links) or ?file={id}
    static FileIdFromLocation() {
        const match = window.location.pathname.match(/^\/file\/([0-9a-fA-F-]{36})\/?$/);
        if (match) return match[1];
        return new URLSearchParams(window.location.search).get("file");
    }
}
