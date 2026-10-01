import {DomRegister} from "../Static/DomRegister.js";

export class Popup {
    static info(title, message, timeout = 5) {
        this._renderPopup("#80ff80", title, message, timeout);
    }

    static warn(title, message, timeout = 5) {
        this._renderPopup("#ffff80", title, message, timeout);
    }

    static error(title, message, timeout = 5) {
        this._renderPopup("#ff8080", title, message, timeout);
    }

    static debug(title, message, timeout = 10) {
        this._renderPopup("#8080ff", title, message, timeout);
    }

    static _renderPopup(color, title, message, timeout) {
        if (!DomRegister.popupContainer) throw new Error("Popup container not found");
        const popup = document.createElement("div");
        popup.classList.add("popup");
        popup.style.setProperty("--popup-color", color);
        popup.style.setProperty("--timeout", timeout);

        const titleElement = document.createElement("h1");
        titleElement.classList.add("popup-title");
        titleElement.innerText = title;
        popup.appendChild(titleElement);

        const bodyElement = document.createElement("p");
        bodyElement.classList.add("popup-body");
        bodyElement.innerText = message;
        popup.appendChild(bodyElement);

        const progressBar = document.createElement("div");
        progressBar.classList.add("popup-progress-bar");
        progressBar.style.setProperty("--timeout", `${timeout}s`);
        popup.appendChild(progressBar);

        DomRegister.popupContainer.appendChild(popup);

        setTimeout(() => {
            popup.classList.add("destroyed");
        }, (timeout - 0.5) * 1000);

        setTimeout(() => {
            popup.remove();
        }, timeout * 1000);
    }
}