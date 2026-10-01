export class ContextMenu {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }

    _container;
    _position = {x: 0, y: 0};
    set position(value) { this._position = value; }

    _sections = {};

    constructor(parentContainer, details) {
        if (!details.hasOwnProperty("sections")) throw new Error("ContextMenu needs to have sections");
        if (!Array.isArray(details.sections)) throw new Error("ContextMenu sections must be an array");

        if (parentContainer) this.parentContainer = parentContainer;

        this._container = document.createElement("div");
        this._container.classList.add("context-menu-container");

        for (let section of details.sections) {
            if (!section.hasOwnProperty("items")) continue;
            if (!Array.isArray(section.items)) continue;

            this._sections[section.name] = {
                name: section.name,
                items: section.items,
            }

            const sectionContainer = document.createElement("div");
            sectionContainer.id = "ctx-menu-section-" + section.name;
            sectionContainer.classList.add("ctx-menu-section");
            this._container.appendChild(sectionContainer);
            for (let item of this._sections[section.name].items) {
                if (!item.hasOwnProperty("text")) continue;

                const itemContainer = document.createElement("div");
                itemContainer.classList.add("ctx-menu-item");
                itemContainer.addEventListener("click", (e) => {
                    e.stopPropagation();
                    item.onClick(e)
                        .then(() => this.destroy())
                        .catch(e => {
                            throw new Error("ContextMenu item onClick failed: " + e)
                        });
                    this.destroy();
                });
                sectionContainer.appendChild(itemContainer);

                if (item.hasOwnProperty("icon")) {
                    const itemIcon = document.createElement("div");
                    itemIcon.classList.add("icon-container");
                    itemIcon.innerHTML = item.icon;
                    itemContainer.appendChild(itemIcon);
                }

                const itemText = document.createElement("p");
                itemText.innerText = item.text;
                itemContainer.appendChild(itemText);

                if (item.hasOwnProperty("shortcut")) {
                    const itemShortcut = document.createElement("p");
                    itemShortcut.classList.add("shortcut");
                    itemShortcut.innerText = item.shortcut;
                    itemContainer.appendChild(itemShortcut);
                }
            }
        }
    }

    render() {
        if (!this._parentContainer) throw new Error("Parent container needs to be set before rendering");
        this._container.style.left = `${this._position.x}px`;
        this._container.style.top = `${this._position.y}px`;
        this._parentContainer.appendChild(this._container);
    }

    destroy() {
        this._container.remove();
    }
}