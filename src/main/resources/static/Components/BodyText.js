export class BodyText {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }

    _container;
    _textElement;

    constructor(parentContainer, details) {
        this._parentContainer = parentContainer;

        this._container = document.createElement("div");
        this._container.classList.add("body-text-container");

        this._textElement = document.createElement("p");
        this._textElement.classList.add("body-text");
        this._textElement.innerText = details.text;
        this._container.appendChild(this._textElement);
    }

    render() {
        if (!this._parentContainer) throw new Error("Parent container needs to be set before rendering");
        this._parentContainer.appendChild(this._container);
    }
}