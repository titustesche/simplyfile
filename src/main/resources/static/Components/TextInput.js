import {ICONS} from "../Static/Icons.js";

export class TextInput {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }
    _container;
    _textInput;
    _revealContentButton;
    _censoringOverlay;

    _censorInput;
    get censorInput() { return this._censorInput; }
    set censorInput(value) {
        this._censorInput = value;
        this._textInput.classList.toggle("censored", this.censorInput);
        this._censoringOverlay.classList.toggle("hidden", !this.censorInput);
        // Looks weird, but then it refreshes itself
        if (this.value !== undefined) this.value = this.value;
    }
    
    _value = "";
    get value() { return this._value; }
    set value(value) {
        this._value = value;

        if (this.censorInput) this.visibleValue = this._scribbleValue(value);
        else this._textInput.value = value;
    }

    _visibleValue;
    get visibleValue() { return this._visibleValue; }
    set visibleValue(value) {
        if (!value) {
            this._censoringOverlay.innerText = this._placeholder ?? "Placeholder";
            this._censoringOverlay.classList.add("placeholder");
            return;
        } else {
            this._censoringOverlay.classList.remove("placeholder");
            this._censoringOverlay.innerText = value
        }

        this._visibleValue = value;
    }

    _placeholder;
    get placeholder() { return this._placeholder; }
    set placeholder(value) {
        this._textInput.placeholder = value;
        this._placeholder = value;
    }

    constructor(parentContainer, inputDetails) {
        this._container = document.createElement("div");
        this._container.classList.add("text-input-container");
        this._parentContainer = parentContainer;
        
        this._textInput = document.createElement("input");
        this._textInput.type = "text";
        this._textInput.classList.add("text-input");
        this._container.appendChild(this._textInput);

        // Todo: Just hide real value and replace with placeholder so it looks better
        if (inputDetails.censorInput) {
            this._revealContentButton = document.createElement("div");
            this._revealContentButton.classList.add("reveal-content-button");

            this._censoringOverlay = document.createElement("div");
            this._censoringOverlay.classList.add("censoring-overlay");
            this._container.appendChild(this._censoringOverlay);

            this.censorInput = inputDetails.censorInput;
            this._revealContentButton.innerHTML = this.censorInput ? ICONS.EYE_OPEN : ICONS.EYE_CLOSED;
            this._revealContentButton.addEventListener("click", () => {
                this.censorInput = !this.censorInput;
                this._revealContentButton.classList.toggle("visible", this.censorInput);
                this._revealContentButton.innerHTML = this.censorInput ? ICONS.EYE_OPEN : ICONS.EYE_CLOSED;
            });
            this._container.appendChild(this._revealContentButton);
        }
        this.placeholder = inputDetails.placeholder;
        if (inputDetails.initialValue) this.value = inputDetails.initialValue;

        // Todo: This will overwrite everything with the censor input if it's enabled
        this._textInput.addEventListener("input", (e) => {
            this.value = e.target.value;
        });
    }

    _scribbleValue(value) {
        const scribbles = "01*#$%&@!><[]{}+=?xX"
        let result = "";
        for (let char of value) {
            const charAsNumber = char.charCodeAt(0) + 3;
            result += scribbles[charAsNumber % scribbles.length];
        }
        return result;
    }

    render() {
        this._parentContainer.appendChild(this._container);
    }
}