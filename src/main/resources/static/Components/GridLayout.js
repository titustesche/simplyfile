export class GridLayout {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }

    _container;

    constructor(parentContainer, details) {
        this._container = document.createElement("div");
        this._container.classList.add("grid-layout-container");
        this._container.style.display = "grid";
        this._container.style.gridTemplateColumns = `repeat(${details.columns}, 1fr)`;
        this._container.style.gridTemplateRows = `repeat(${details.rows}, 1fr)`;

        for (let component of details.components) {
            component.parentContainer = this._container;
            component.render();
        }
    }

    render() {
        if (!this._parentContainer) throw new Error("Parent container needs to be set before rendering");
        this._parentContainer.appendChild(this._container);
    }
}