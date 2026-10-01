import {ICONS} from "../Static/Icons.js";
import {Format} from "../Static/Format.js";

export const UPLOAD_STATES = {
    QUEUED: "queued",
    UPLOADING: "uploading",
    PROCESSING: "processing",
    DONE: "done",
    FAILED: "failed",
    CANCELLED: "cancelled",
}

export class UploadItem {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }

    _container;
    _nameElement;
    _statusElement;
    _percentElement;
    _progressFill;
    _actionElement;
    _retryElement;

    _file;
    get file() { return this._file; }

    _state = UPLOAD_STATES.QUEUED;
    get state() { return this._state; }
    get isActive() { return this._state === UPLOAD_STATES.QUEUED || this._state === UPLOAD_STATES.UPLOADING || this._state === UPLOAD_STATES.PROCESSING; }

    _loaded = 0;
    get loaded() { return this._loaded; }
    get total() { return this._file.size; }

    // Smoothed upload speed in bytes per second
    _speed = 0;
    _lastSample;

    _onAction = () => {};
    _onRetry = () => {};

    constructor(parentContainer, details) {
        this._parentContainer = parentContainer;
        this._file = details.file;
        this._onAction = details.onAction ?? this._onAction;
        this._onRetry = details.onRetry ?? this._onRetry;

        this._container = document.createElement("div");
        this._container.classList.add("upload-item");

        const icon = document.createElement("div");
        icon.classList.add("icon-container", "upload-item-icon");
        icon.innerHTML = ICONS.DOCUMENT;
        this._container.appendChild(icon);

        this._nameElement = document.createElement("p");
        this._nameElement.classList.add("upload-item-name");
        this._nameElement.innerText = this._file.name;
        this._nameElement.title = this._file.name;
        this._container.appendChild(this._nameElement);

        this._percentElement = document.createElement("p");
        this._percentElement.classList.add("upload-item-percent");
        this._container.appendChild(this._percentElement);

        const actions = document.createElement("div");
        actions.classList.add("upload-item-actions");
        this._container.appendChild(actions);

        this._retryElement = document.createElement("div");
        this._retryElement.classList.add("icon-container", "upload-item-action", "hidden");
        this._retryElement.innerHTML = ICONS.RETRY;
        this._retryElement.title = "Erneut versuchen";
        this._retryElement.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._onRetry(this);
        });
        actions.appendChild(this._retryElement);

        this._actionElement = document.createElement("div");
        this._actionElement.classList.add("icon-container", "upload-item-action");
        this._actionElement.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._onAction(this);
        });
        actions.appendChild(this._actionElement);

        const progressTrack = document.createElement("div");
        progressTrack.classList.add("upload-item-progress");
        this._progressFill = document.createElement("div");
        this._progressFill.classList.add("upload-item-progress-fill");
        progressTrack.appendChild(this._progressFill);
        this._container.appendChild(progressTrack);

        this._statusElement = document.createElement("p");
        this._statusElement.classList.add("upload-item-status");
        this._container.appendChild(this._statusElement);

        this.setState(UPLOAD_STATES.QUEUED);
    }

    setState(state, message) {
        this._container.classList.remove(`state-${this._state}`);
        this._state = state;
        this._container.classList.add(`state-${state}`);
        this._retryElement.classList.toggle("hidden", state !== UPLOAD_STATES.FAILED && state !== UPLOAD_STATES.CANCELLED);

        switch (state) {
            case UPLOAD_STATES.QUEUED:
                this._setProgress(0);
                this._statusElement.innerText = `Wartet ... · ${Format.bytes(this.total)}`;
                this._setAction(ICONS.CLOSE, "Aus der Warteschlange entfernen");
                break;

            case UPLOAD_STATES.UPLOADING:
                this._lastSample = { time: performance.now(), loaded: this._loaded };
                this._statusElement.innerText = `Starte Upload ... · ${Format.bytes(this.total)}`;
                this._setAction(ICONS.CLOSE, "Upload abbrechen");
                break;

            case UPLOAD_STATES.PROCESSING:
                this._setProgress(1);
                this._statusElement.innerText = `Wird auf dem Server gespeichert ... · ${Format.bytes(this.total)}`;
                this._setAction(ICONS.CLOSE, "Upload abbrechen");
                break;

            case UPLOAD_STATES.DONE:
                this._setProgress(1);
                this._percentElement.innerText = "Fertig";
                this._statusElement.innerText = message ?? `Hochgeladen · ${Format.bytes(this.total)}`;
                this._setAction(ICONS.CLOSE, "Ausblenden");
                break;

            case UPLOAD_STATES.FAILED:
                this._percentElement.innerText = "Fehler";
                this._statusElement.innerText = message ?? "Upload fehlgeschlagen";
                this._setAction(ICONS.CLOSE, "Ausblenden");
                break;

            case UPLOAD_STATES.CANCELLED:
                this._percentElement.innerText = "Abgebrochen";
                this._statusElement.innerText = `Abgebrochen · ${Format.bytes(this.total)}`;
                this._setAction(ICONS.CLOSE, "Ausblenden");
                break;
        }
    }

    updateProgress(loaded) {
        const now = performance.now();
        const elapsed = (now - this._lastSample.time) / 1000;
        if (elapsed >= 0.5) {
            const currentSpeed = (loaded - this._lastSample.loaded) / elapsed;
            this._speed = this._speed ? this._speed * 0.6 + currentSpeed * 0.4 : currentSpeed;
            this._lastSample = { time: now, loaded };
        }

        this._loaded = loaded;
        this._setProgress(this.total > 0 ? loaded / this.total : 1);

        const parts = [`${Format.bytes(loaded)} von ${Format.bytes(this.total)}`];
        if (this._speed > 0) {
            parts.push(`${Format.bytes(this._speed)}/s`);
            parts.push(`noch ${Format.duration((this.total - loaded) / this._speed)}`);
        }
        this._statusElement.innerText = parts.join(" · ");
    }

    reset() {
        this._loaded = 0;
        this._speed = 0;
        this.setState(UPLOAD_STATES.QUEUED);
    }

    _setProgress(fraction) {
        const percent = Math.min(100, Math.max(0, fraction * 100));
        this._progressFill.style.width = `${percent}%`;
        this._percentElement.innerText = `${Math.floor(percent)} %`;
    }

    _setAction(icon, title) {
        this._actionElement.innerHTML = icon;
        this._actionElement.title = title;
    }

    render() {
        if (!this._parentContainer) throw new Error("Parent container needs to be set before rendering");
        this._parentContainer.appendChild(this._container);
    }

    destroy() {
        this._container.classList.add("destroyed");
        setTimeout(() => this._container.remove(), 200);
    }
}
