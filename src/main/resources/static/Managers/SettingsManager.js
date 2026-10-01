import {API_ADAPTER} from "../api-adapter.js";
import {Popup} from "../Components/Popup.js";
import {GridLayout} from "../Components/GridLayout.js";
import {Button} from "../Components/Button.js";
import {BodyText} from "../Components/BodyText.js";
import {ICONS} from "../Static/Icons.js";
import {Modal} from "../Components/Modal.js";
import {PageLayout} from "../Components/PageLayout.js";
import {FileManager} from "./FileManager.js";
import {DomRegister} from "../Static/DomRegister.js";
import {Format} from "../Static/Format.js";

export class SettingsManager {
    static DefaultAccentColor = "#0070ff";
    static accentColor = undefined;

    static setAccentColor(color) {
        SettingsManager.accentColor = color;
        localStorage.setItem("accent-color", color);
        document.documentElement.style.setProperty("--accent-color", color);
    }

    static resetAccentColor() {
        SettingsManager.accentColor = undefined;
        localStorage.removeItem("accent-color");
        document.documentElement.style.removeProperty("--accent-color");
        if (DomRegister.accentColorPicker) DomRegister.accentColorPicker.value = SettingsManager.DefaultAccentColor;
    }

    static loadSettings() {
        const accentColor = localStorage.getItem("accent-color");
        if (accentColor) SettingsManager.accentColor = accentColor;

        SettingsManager.applySettings();
    }

    static applySettings() {
        if (SettingsManager.accentColor) document.documentElement.style.setProperty("--accent-color", SettingsManager.accentColor);
        if (DomRegister.accentColorPicker)
            DomRegister.accentColorPicker.value = SettingsManager.accentColor ?? SettingsManager.DefaultAccentColor;
    }

    static async openSettingsModal(options) {
        await new Promise(resolve => setTimeout(resolve, 1));

        const files = FileManager.Files;
        const totalSize = files.reduce((acc, file) => acc + (file.size ?? 0), 0);

        const accentColorText = new BodyText(undefined, {
            text: `Akzentfarbe: ${SettingsManager.accentColor ?? `${SettingsManager.DefaultAccentColor} (Standard)`}`,
        });

        const resetAccentColorButton = new Button(undefined, {
            identifier: "reset-accent-color-button",
            text: "Akzentfarbe zurücksetzen",
            onClick: () => {
                SettingsManager.resetAccentColor();
                Popup.info("Zurückgesetzt", "Die Akzentfarbe wurde zurückgesetzt", 3);
            }
        });

        const storageText = new BodyText(undefined, {
            text: `${files.length} ${files.length === 1 ? "Datei" : "Dateien"}, insgesamt ${Format.bytes(totalSize)}`,
        });

        const reloadFilesButton = new Button(undefined, {
            identifier: "reload-files-button",
            text: "Dateiliste neu laden",
            onClick: async () => {
                try {
                    await FileManager.LoadFiles();
                    Popup.info("Neu geladen", `${FileManager.Files.length} Dateien gefunden`, 3);
                } catch (e) {
                    Popup.error("Laden fehlgeschlagen", e.message ?? e);
                }
            }
        });

        const backendText = new BodyText(undefined, {
            text: `Backend: ${API_ADAPTER.API_HTTP_URL}`,
        });

        const checkBackendButton = new Button(undefined, {
            identifier: "test-http-connection-button",
            text: "Backend-Verbindung prüfen",
            onClick: async () => {
                const httpOk = await API_ADAPTER.ensureBackendConnection();
                if (httpOk) Popup.debug("Verbunden", "Backend ist erreichbar");
                else Popup.error("Nicht erreichbar", "Backend ist nicht erreichbar");
            }
        });

        const layout = new PageLayout([
            {
                icon: ICONS.SETTINGS,
                name: "General Settings",
                title: "Allgemein",
                components: [accentColorText, resetAccentColorButton]
            },
            {
                icon: ICONS.SERVER,
                name: "Storage Settings",
                title: "Speicher",
                components: [storageText, reloadFilesButton]
            },
            {
                icon: ICONS.DEVELOPER_SETTINGS,
                name: "Developer Settings",
                title: "Entwickler",
                components: [backendText, checkBackendButton]
            }
        ], options);

        const settingsModal = new Modal("Einstellungen", [
                layout,
                new GridLayout(undefined, {
                    identifier: "settings-buttons-grid",
                    columns: 1,
                    rows: 1,
                    components: [
                        new Button(undefined, {
                            identifier: "settings-modal-close",
                            className: "prominent-button secondary centered",
                            text: "Schließen",
                            onClick: () => {
                                settingsModal.destroy();
                            }
                        })
                    ]})
            ], { canBeClosedManually: options?.canBeClosedManually ?? true }
        );

        await settingsModal.render();
    }
}
