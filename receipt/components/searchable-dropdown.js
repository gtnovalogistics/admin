class SearchableDropdown extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._options = [];
    this._isOpen = false;

    // Component structural template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
          max-width: 300px;
          position: relative;
        }
        .dropdown-container {
          position: relative;
          width: 100%;
        }
        input {
          width: 100%;
          padding: 10px;
          box-sizing: border-box;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        input:focus {
          outline: none;
          border-color: #007bff;
        }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
          display: none;
          max-height: 200px;
          overflow-y: auto;
          margin: 4px 0 0;
          padding: 0;
          list-style: none;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .dropdown-menu.show {
          display: block;
        }
        li {
          padding: 10px;
          cursor: pointer;
          font-size: 14px;
        }
        li:hover {
          background-color: #f8f9fa;
        }
        li.no-results {
          color: #888;
          cursor: default;
        }
        li.no-results:hover {
          background-color: transparent;
        }
      </style>
      <div class="dropdown-container">
        <input type="text" placeholder="Select or search..." autocomplete="off" />
        <ul class="dropdown-menu"></ul>
      </div>
    `;

    // Bind DOM elements
    this.container = this.shadowRoot.querySelector('.dropdown-container');
    this.input = this.shadowRoot.querySelector('input');
    this.menu = this.shadowRoot.querySelector('.dropdown-menu');
  }

  static get observedAttributes() {
    return ['placeholder'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'placeholder' && this.input) {
      this.input.placeholder = newValue;
    }
  }

  connectedCallback() {
    this.input.addEventListener('focus', () => this.openMenu());
    this.input.addEventListener('input', (e) => this.filterOptions(e.target.value));

    // Save the exact bound reference so it can be cleanly removed
    this._boundOutsideClick = this._onOutsideClick.bind(this);
    document.addEventListener('click', this._boundOutsideClick);
  }

  disconnectedCallback() {
    // This now successfully removes the global reference!
    document.removeEventListener('click', this._boundOutsideClick);
  }


  // Properties API for setting options programmatically
  set options(value) {
    this._options = Array.isArray(value) ? value : [];
    this.renderOptions(this._options);
  }

  get options() {
    return this._options;
  }

  // Open the dropdown menu
  openMenu() {
    this._isOpen = true;
    this.menu.classList.add('show');
    if (!this.input.value) {
      this.renderOptions(this._options);
    }
  }

  // Close the dropdown menu
  closeMenu() {
    this._isOpen = false;
    this.menu.classList.remove('show');
  }

  _onOutsideClick(e) {
    if (!e.composedPath().includes(this)) {
      this.closeMenu();
      // Reset input value to match current selection if user leaves it incomplete
      const match = this._options.find(opt => opt.label === this.input.value);
      if (!match) {
        this.input.value = this.getAttribute('value') || '';
      }
    }
  }

  // Filter options based on input text
  filterOptions(query) {
    if (!this._isOpen) this.openMenu();

    const filtered = this._options.filter(option =>
      option.label.toLowerCase().includes(query.toLowerCase())
    );
    this.renderOptions(filtered);
  }

  // Render option elements dynamically
  renderOptions(optionsToRender) {
    this.menu.innerHTML = '';

    if (optionsToRender.length === 0) {
      const li = document.createElement('li');
      li.classList.add('no-results');
      li.textContent = 'No results found';
      this.menu.appendChild(li);
      return;
    }

    optionsToRender.forEach(option => {
      const li = document.createElement('li');
      li.textContent = option.label;
      li.dataset.value = option.value;

      li.addEventListener('click', () => {
        this.selectOption(option);
      });

      this.menu.appendChild(li);
    });
  }

  // Handle option selection
  selectOption(option) {
    this.input.value = option.label;
    this.setAttribute('value', option.label);
    this.closeMenu();

    // Dispatch custom event to notify parent forms or frameworks
    this.dispatchEvent(new CustomEvent('change', {
      detail: { label: option.label, value: option.value },
      bubbles: true,
      composed: true
    }));
  }
}

// Define the custom web component element
customElements.define('searchable-dropdown', SearchableDropdown);
