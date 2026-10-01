export class PageLayout {
    _parentContainer;
    set parentContainer(value) { this._parentContainer = value; }

    _container;
    _sidebarContainer;
    _contentContainer;

    _pages = {};

    _sidebarElements = {};
    _containerElements = {};

    _activePage;
    get activePage() {
        return this._activePage;
    }

    set activePage(value) {
        if (this._activePage) {
            this._sidebarElements[this._activePage].classList.remove("active");
            if (this._containerElements[this._activePage].parentNode) {
                this._contentContainer.removeChild(this._containerElements[this._activePage]);
            }
        }

        this._activePage = value;

        if (this._activePage) {
            this._sidebarElements[this._activePage].classList.add("active");
            this._contentContainer.appendChild(this._containerElements[this._activePage]);
        }
    }

    constructor(pages, options) {
        if (!pages) throw new Error("Pages must be set");
        if (!Array.isArray(pages)) throw new Error("Pages must be an array");

        for (let page of pages) {
            this._pages[page.name] = {
                name: page.name,
                title: page.title,
                icon: page.icon,
                components: page.components,
            }
        }

        this._container = document.createElement("div");
        this._container.classList.add("page-layout-container");

        this._sidebarContainer = document.createElement("div");
        this._sidebarContainer.classList.add("page-layout-sidebar");
        this._container.appendChild(this._sidebarContainer);

        this._contentContainer = document.createElement("div");
        this._contentContainer.classList.add("page-layout-content");
        this._container.appendChild(this._contentContainer);

        for (let page of Object.values(this._pages)) {
            const sidebarEntry = document.createElement("div");
            sidebarEntry.classList.add("page-layout-sidebar-element");

            let iconContainer = document.createElement("div");
            iconContainer.classList.add("icon-container");
            iconContainer.innerHTML = page.icon;
            sidebarEntry.appendChild(iconContainer);

            let titleContainer = document.createElement("div");
            titleContainer.classList.add("title-container");
            titleContainer.innerText = page.title;
            sidebarEntry.appendChild(titleContainer);

            sidebarEntry.addEventListener("click", () => this.activePage = page.name);
            this._sidebarElements[page.name] = sidebarEntry;

            const contentElement = document.createElement("div");
            contentElement.classList.add("page-layout-page-content");
            for (let component of page.components) {
                component.parentContainer = contentElement;
                component.render();
            }
            this._containerElements[page.name] = contentElement;
        }

        if (options?.selectedPage) this.activePage = options.selectedPage;
    }

    render() {
        if (!this._parentContainer) throw new Error("Parent container needs to be set before rendering");
        if (!this.activePage) this.activePage = Object.keys(this._pages)[0];

        this._sidebarContainer.innerHTML = "";
        for (let page of Object.values(this._pages)) {
            this._sidebarContainer.appendChild(this._sidebarElements[page.name]);
        }

        this._parentContainer.appendChild(this._container);
    }
}