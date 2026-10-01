import {Popup} from "./Popup.js";
import {FileManager} from "../Managers/FileManager.js";
import {DomRegister} from "../Static/DomRegister.js";
import {API_ADAPTER} from "../api-adapter.js";
import {ContextMenu} from "./ContextMenu.js";
import {Button} from "./Button.js";
import {GridLayout} from "./GridLayout.js";
import {ICONS} from "../Static/Icons.js";
import {Format} from "../Static/Format.js";

export class FileEntry {
    static PreviewTextMaxSize = 256 * 1024;

    _container;
    _containerText;

    _detailsContainer;
    get detailsContainer() { return this._detailsContainer; }

    _id;
    get id() { return this._id; }

    _filename;
    get filename() { return this._filename; }

    _sha256;
    get sha256() { return this._sha256; }

    _type;
    get type() { return this._type; }

    _size;
    get size() { return this._size; }

    get link() { return Format.fileLink(this._id); }
    get downloadLink() { return Format.downloadLink(this._id); }

    constructor(file) {
        try {
            this._id = file.id;
            this._filename = file.filename ?? "Unbenannt";
            this._sha256 = file.sha256;
            this._type = file.type;
            this._size = file.size;
        } catch (e) {
            Popup.debug("Could not parse file", e);
        }
    }

    createListEntry() {
        if (this._container) return this._container;
        this._container = document.createElement("div");
        this._container.classList.add("file-row");
        this._container.title = "Details anzeigen";

        const icon = document.createElement("div");
        icon.classList.add("icon-container", "file-row-icon");
        icon.innerHTML = ICONS.DOCUMENT;
        this._container.appendChild(icon);

        this._containerText = document.createElement("p");
        this._containerText.classList.add("file-row-name");
        this._containerText.innerText = this._filename;
        this._container.appendChild(this._containerText);

        const size = document.createElement("p");
        size.classList.add("file-row-size");
        size.innerText = Format.bytes(this._size);
        this._container.appendChild(size);

        const type = document.createElement("p");
        type.classList.add("file-row-type");
        type.innerText = this._type ?? "–";
        this._container.appendChild(type);

        const actions = document.createElement("div");
        actions.classList.add("file-row-actions");
        this._container.appendChild(actions);

        const addAction = (icon, title, onClick) => {
            const action = document.createElement("div");
            action.classList.add("icon-container", "file-row-action");
            action.title = title;
            action.innerHTML = icon;
            action.addEventListener("click", (e) => {
                e.stopPropagation();
                onClick(e);
            });
            actions.appendChild(action);
            return action;
        };

        addAction(ICONS.LINK, "Link kopieren", () => this.copyLink());
        addAction(ICONS.DOWNLOAD, "Herunterladen", () => this.download());
        const optionsMenu = addAction(ICONS.DOTTED_MENU, "Weitere Aktionen", (e) => {
            const menu = new ContextMenu(optionsMenu, {
                sections: [
                    {
                        name: "basic",
                        items: [
                            {
                                text: "Details anzeigen",
                                icon: ICONS.DOCUMENT,
                                onClick: async () => FileManager.SetActiveFile(this._id)
                            },
                            {
                                text: "Herunterladen",
                                icon: ICONS.DOWNLOAD,
                                onClick: async () => this.download()
                            },
                            {
                                text: "Link kopieren",
                                icon: ICONS.LINK,
                                onClick: async () => this.copyLink()
                            },
                            {
                                text: "Löschen",
                                icon: ICONS.TRASHCAN,
                                onClick: async () => FileManager.ConfirmDeleteFile(this._id)
                            }
                        ]
                    }
                ]
            });

            menu.position = { x: e.clientX, y: e.clientY };
            menu.render();
            document.addEventListener("click", () => menu.destroy(), { once: true });
        });

        this._container.addEventListener("click", () => FileManager.SetActiveFile(this._id));
        return this._container;
    }

    highlight() {
        const row = this.createListEntry();
        row.classList.remove("highlighted");
        // Restart the animation
        void row.offsetWidth;
        row.classList.add("highlighted");
    }

    createDetailsElement() {
        if (this._detailsContainer) return this._detailsContainer;

        this._detailsContainer = document.createElement("div");
        this._detailsContainer.classList.add("file-details-container");
        this._detailsContainer.id = `file-details-container-${this._id}`;

        const backButton = new Button(undefined, {
            identifier: "file-details-back-button",
            icon: ICONS.ARROW_BACK,
            text: "Alle Dateien",
            className: "prominent-button secondary",
            onClick: () => FileManager.ShowOverview()
        });
        backButton.parentContainer = this._detailsContainer;
        backButton.render();

        // Title card
        const titleCard = this._createCard("file-details-title-card");
        const icon = document.createElement("div");
        icon.classList.add("icon-container", "file-details-icon");
        icon.innerHTML = ICONS.DOCUMENT;
        titleCard.appendChild(icon);

        const title = document.createElement("h1");
        title.classList.add("title");
        title.innerText = this._filename;
        titleCard.appendChild(title);

        const subtitle = document.createElement("p");
        subtitle.classList.add("message-timestamp");
        subtitle.innerText = `${this._type ?? "unbekannter Typ"} · ${Format.bytes(this._size)}`;
        titleCard.appendChild(subtitle);

        // Metadata card
        const infoCard = this._createCard();
        const infoGrid = document.createElement("div");
        infoGrid.classList.add("file-details-info");
        infoCard.appendChild(infoGrid);

        const addInfo = (label, value, copyable = false) => {
            const labelElement = document.createElement("p");
            labelElement.classList.add("file-details-label");
            labelElement.innerText = label;
            infoGrid.appendChild(labelElement);

            const valueElement = document.createElement("p");
            valueElement.classList.add("file-details-value");
            valueElement.innerText = value ?? "–";
            if (copyable && value) {
                valueElement.classList.add("copyable");
                valueElement.title = "Klicken zum Kopieren";
                valueElement.addEventListener("click", () => this._copy(value, label));
            }
            infoGrid.appendChild(valueElement);
        };

        addInfo("Größe", `${Format.bytes(this._size)} (${this._size} Bytes)`);
        addInfo("Typ", this._type);
        addInfo("SHA-256", this._sha256, true);
        addInfo("ID", this._id, true);
        addInfo("Link", this.link, true);

        // Actions
        const actionsCard = this._createCard();
        const actions = new GridLayout(undefined, {
            identifier: "file-details-actions",
            columns: 3,
            rows: 1,
            components: [
                new Button(undefined, {
                    identifier: "file-download-button",
                    icon: ICONS.DOWNLOAD,
                    text: "Herunterladen",
                    className: "prominent-button centered",
                    onClick: () => this.download()
                }),
                new Button(undefined, {
                    identifier: "file-copy-link-button",
                    icon: ICONS.LINK,
                    text: "Link kopieren",
                    className: "prominent-button secondary centered",
                    onClick: () => this.copyLink()
                }),
                new Button(undefined, {
                    identifier: "file-delete-button",
                    icon: ICONS.TRASHCAN,
                    text: "Löschen",
                    className: "prominent-button tertiary centered",
                    onClick: (e) => {
                        e?.stopPropagation();
                        FileManager.ConfirmDeleteFile(this._id);
                    }
                })
            ]
        });
        actions.parentContainer = actionsCard;
        actions.render();

        this._detailsContainer.appendChild(titleCard);
        this._detailsContainer.appendChild(infoCard);
        this._detailsContainer.appendChild(actionsCard);

        const preview = this._createPreview();
        if (preview) this._detailsContainer.appendChild(preview);

        return this._detailsContainer;
    }

    _createCard(className) {
        const card = document.createElement("div");
        card.classList.add("message-container", "file-details-card");
        if (className) card.classList.add(className);
        return card;
    }

    _createPreview() {
        const type = this._type ?? "";
        const isImage = type.startsWith("image/") && type !== "image/svg+xml";
        const isText = (type.startsWith("text/") || type === "application/json")
            && this._size <= FileEntry.PreviewTextMaxSize;
        if (!isImage && !isText) return undefined;

        const card = this._createCard("file-details-preview");
        const label = document.createElement("p");
        label.classList.add("file-details-label");
        label.innerText = "Vorschau";
        card.appendChild(label);

        if (isImage) {
            const image = document.createElement("img");
            image.src = this.downloadLink;
            image.alt = this._filename;
            card.appendChild(image);
        } else {
            const text = document.createElement("pre");
            text.innerText = "Lade Vorschau ...";
            card.appendChild(text);
            API_ADAPTER.getFileContent(this._id)
                .then(content => text.innerText = content)
                .catch(() => card.remove());
        }

        return card;
    }

    download() {
        const link = document.createElement("a");
        link.href = this.downloadLink;
        link.download = this._filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    async copyLink() {
        await this._copy(this.link, "Link");
    }

    async _copy(value, label) {
        try {
            await navigator.clipboard.writeText(value);
            Popup.info("Kopiert", `${label} wurde in die Zwischenablage kopiert`, 3);
        } catch (e) {
            window.prompt(`${label} kopieren:`, value);
        }
    }

    load() {
        DomRegister.detailsContainer.appendChild(this.createDetailsElement());
    }

    unload() {
        this._detailsContainer?.remove();
    }

    delete() {
        this.unload();
        this._container?.remove();
    }
}
