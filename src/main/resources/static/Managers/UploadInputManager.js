import {DomRegister} from "../Static/DomRegister.js";
import {FileManager} from "./FileManager.js";
import {Popup} from "../Components/Popup.js";
import {Format} from "../Static/Format.js";

export class UploadInput {
    static container = DomRegister.uploadInput.container;
    static input = DomRegister.uploadInput.input;
    static fileInput = DomRegister.uploadInput.fileInput;
    static chooseButton = DomRegister.uploadInput.chooseButton;
    static sendButton = DomRegister.uploadInput.sendButton;
    static dropTarget = DomRegister.mainContainer;

    static _files = [];
    static get Files() { return this._files; }
    static set Files(value) {
        this._files = Array.from(value ?? []);
        this.input.value = this._describeFiles();
        this.UpdateSendButtonState();
    }

    static _uploading = false;

    static UpdateSendButtonState() {
        if (this._files.length > 0 && !this._uploading) {
            this.sendButton.classList.remove("disabled");
        } else {
            this.sendButton.classList.add("disabled");
        }
    }

    static openFileDialog() {
        if (!this._uploading) this.fileInput.click();
    }

    static init() {
        this.sendButton.addEventListener("click", () => this._sendOrShake());
        this.chooseButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.openFileDialog();
        });
        this.input.addEventListener("click", () => this.openFileDialog());
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this._sendOrShake();
            }
        });

        this.fileInput.addEventListener("change", () => {
            this.Files = this.fileInput.files;
            this.fileInput.value = "";
        });

        // Drag & drop anywhere on the main area
        ["dragenter", "dragover"].forEach(type => this.dropTarget.addEventListener(type, (e) => {
            e.preventDefault();
            this.container.classList.add("dragging");
        }));
        this.dropTarget.addEventListener("dragleave", (e) => {
            if (!this.dropTarget.contains(e.relatedTarget)) this.container.classList.remove("dragging");
        });
        this.dropTarget.addEventListener("drop", (e) => {
            e.preventDefault();
            this.container.classList.remove("dragging");
            if (e.dataTransfer.files.length > 0) this.Files = e.dataTransfer.files;
        });

        this.UpdateSendButtonState();
        this.container.classList.add("centered");
    }

    static async _sendOrShake() {
        try {
            await this.send();
        } catch (e) {
            Popup.error("Upload fehlgeschlagen", e.message ?? e);
            this.container.classList.add("shake");
            setTimeout(() => this.container.classList.remove("shake"), 200);
        }
    }

    static async send() {
        if (this._uploading) return;
        const files = this._files;
        if (files.length === 0) throw new Error("Keine Datei ausgewählt");

        this._uploading = true;
        this.UpdateSendButtonState();

        let lastUploaded;
        let failed = 0;
        try {
            for (let i = 0; i < files.length; i++) {
                const prefix = files.length > 1 ? `(${i + 1}/${files.length}) ` : "";
                const setProgress = (progress) => {
                    this.input.value = `${prefix}Lade ${files[i].name} hoch ... ${Math.round(progress * 100)}%`;
                    this.container.style.setProperty("--upload-progress", `${progress * 100}%`);
                };
                setProgress(0);
                this.container.classList.add("uploading");

                try {
                    lastUploaded = await FileManager.UploadFile(files[i], setProgress);
                } catch (e) {
                    failed++;
                    Popup.error("Upload fehlgeschlagen", `${files[i].name}: ${e.message ?? e}`);
                }
            }
        } finally {
            this._uploading = false;
            this.container.classList.remove("uploading");
            this.container.style.removeProperty("--upload-progress");
        }

        const succeeded = files.length - failed;
        if (succeeded > 0) {
            Popup.info("Hochgeladen", succeeded === 1
                ? `„${lastUploaded.filename}“ wurde hochgeladen`
                : `${succeeded} Dateien wurden hochgeladen`);
        }

        this.Files = [];
        if (lastUploaded) FileManager.SetActiveFile(lastUploaded.id);
    }

    static _describeFiles() {
        if (this._files.length === 0) return "";
        const totalSize = this._files.reduce((acc, file) => acc + file.size, 0);
        if (this._files.length === 1) return `${this._files[0].name} (${Format.bytes(totalSize)})`;
        return `${this._files.length} Dateien ausgewählt (${Format.bytes(totalSize)})`;
    }
}
