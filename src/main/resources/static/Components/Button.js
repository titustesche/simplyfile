export class Button {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }
    _container;
    _buttonElement;

    _text;
    _onClick;
    set onClick(value) { this._onClick = value; }
    get onClick() { return this._onClick; }

    constructor(parentContainer, inputDetails) {
        this._parentContainer = parentContainer;

        this._container = document.createElement("div");
        this._container.id = inputDetails.identifier;
        for (let name of inputDetails.className?.split(" ") ?? "") this._container.classList.add(name);
        this._container.classList.add("button-container");

        if (inputDetails.icon) {
            const iconContainer = document.createElement("div");
            iconContainer.classList.add("icon-container");
            iconContainer.innerHTML = inputDetails.icon;
            this._container.appendChild(iconContainer);
        }

        this._buttonElement = document.createElement("p");
        this._buttonElement.classList.add("button-text");
        this._buttonElement.innerText = inputDetails.text;

        this._container.appendChild(this._buttonElement);

        this.onClick = inputDetails.onClick;

        this._container.addEventListener("click", (event) => {
            this.onClick(event);
        })
    }

    render() {
        if (!this._parentContainer) throw new Error("Parent container needs to be set before rendering");
        this._parentContainer.appendChild(this._container);
    }
}