import {DomRegister} from "../Static/DomRegister.js";
import {Popup} from "../Components/Popup.js";
import {SettingsManager} from "../Managers/SettingsManager.js";

export const HeaderService = {
    setupHeader: () => {
        if (!DomRegister.accentColorPicker)
            Popup.debug("Light error", "Could not determine accent color picker");
        else {
            DomRegister.accentColorPicker.addEventListener("input", () => {
                const hexToHSV = (hex) => {
                    // Remove # if present
                    hex = hex.replace('#', '');

                    // Convert hex to RGB
                    const r = parseInt(hex.substring(0, 2), 16) / 255;
                    const g = parseInt(hex.substring(2, 4), 16) / 255;
                    const b = parseInt(hex.substring(4, 6), 16) / 255;

                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const delta = max - min;

                    let h = 0;
                    let s = max === 0 ? 0 : delta / max;
                    let v = max;

                    if (delta !== 0) {
                        if (max === r) {
                            h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
                        } else if (max === g) {
                            h = ((b - r) / delta + 2) / 6;
                        } else {
                            h = ((r - g) / delta + 4) / 6;
                        }
                    }
                
                    return {
                        h: Math.round(h * 360),
                        s: Math.round(s * 100),
                        v: Math.round(v * 100)
                    };
                };
                
                const hsv = hexToHSV(DomRegister.accentColorPicker.value);
                SettingsManager.setAccentColor(DomRegister.accentColorPicker.value, hsv);
                document.documentElement.style.setProperty("--accent-color", DomRegister.accentColorPicker.value);
            });
        }
    }
}