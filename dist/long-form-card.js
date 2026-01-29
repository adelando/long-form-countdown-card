class LongFormCountdownCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity");
    this.config = {
      n_color: 'var(--primary-color)',
      l_color: 'var(--primary-color)',
      sep_color: 'var(--primary-text-color)',
      ...config
    };
  }

  set hass(hass) {
    const stateObj = hass.states[this.config.entity];
    if (!stateObj) return;

    let displayStr = stateObj.state;
    if (this.config.hide_seconds) {
      displayStr = displayStr.replace(/,?\s*\d+\s*second[s]?/gi, '');
    }

    const formattedDisplay = this._colorizeUnits(displayStr);

    this.shadowRoot.innerHTML = `
      <style>
        ha-card { padding: 16px; background: ${this.config.bg_color || 'var(--ha-card-background)'}; border-radius: var(--ha-card-border-radius, 12px); }
        .header { display: flex; align-items: center; margin-bottom: 8px; }
        .icon { margin-right: 12px; color: ${this.config.title_color || 'inherit'}; --mdc-icon-size: 24px; }
        .name { font-size: 0.9rem; color: ${this.config.title_color || 'inherit'}; font-weight: 500; }
        .timer { font-size: ${this.config.font_size || '1.2'}rem; line-height: 1.6; font-weight: 500; }
        .val { font-weight: 700; }
        .lbl { font-weight: 400; margin-left: 2px; }
        .sep { color: ${this.config.sep_color}; margin-right: 6px; }
        /* Individual Overrides */
        .y-v { color: ${this.config.y_n_color || this.config.n_color}; } .y-l { color: ${this.config.y_l_color || this.config.l_color}; }
        .m-v { color: ${this.config.m_n_color || this.config.n_color}; } .m-l { color: ${this.config.m_l_color || this.config.l_color}; }
        .d-v { color: ${this.config.d_n_color || this.config.n_color}; } .d-l { color: ${this.config.d_l_color || this.config.l_color}; }
        .h-v { color: ${this.config.h_n_color || this.config.n_color}; } .h-l { color: ${this.config.h_l_color || this.config.l_color}; }
        .min-v { color: ${this.config.min_n_color || this.config.n_color}; } .min-l { color: ${this.config.min_l_color || this.config.l_color}; }
        .s-v { color: ${this.config.s_n_color || this.config.n_color}; } .s-l { color: ${this.config.s_l_color || this.config.l_color}; }
      </style>
      <ha-card>
        <div class="header">
          <ha-icon class="icon" icon="${this.config.icon || stateObj.attributes.icon || 'mdi:clock-outline'}"></ha-icon>
          <div class="name">${this.config.name || stateObj.attributes.friendly_name}</div>
        </div>
        <div class="timer">${formattedDisplay}</div>
      </ha-card>
    `;
  }

  _colorizeUnits(str) {
    const units = [
      { key: 'y', regex: /year[s]?/gi }, { key: 'm', regex: /month[s]?/gi },
      { key: 'd', regex: /day[s]?/gi }, { key: 'h', regex: /hour[s]?/gi },
      { key: 'min', regex: /minute[s]?/gi }, { key: 's', regex: /second[s]?/gi }
    ];
    let output = str;
    units.forEach(u => {
      output = output.replace(new RegExp(`(\\d+)\\s*(${u.regex.source})([,:]?)`, 'gi'), 
        `<span class="${u.key}-v val">$1</span><span class="${u.key}-l lbl">$2</span><span class="sep">$3</span>`);
    });
    return output;
  }

  static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
}

// --- NEW SCHEMA-BASED EDITOR ---
class LongFormCountdownEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (this._rendered) return;
    
    // Define the schema for the UI
    const schema = [
      { name: "entity", selector: { entity: { filter: { domain: "sensor", integration: "long_form_word_countdown" } } } },
      { name: "name", label: "Title Override", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        type: "grid",
        name: "",
        column_min_width: "100px",
        schema: [
          { name: "bg_color", label: "Background", selector: { text: {} } },
          { name: "title_color", label: "Title Color", selector: { text: {} } },
          { name: "font_size", label: "Size (rem)", selector: { number: { min: 0.5, max: 5, step: 0.1, mode: "slider" } } },
          { name: "hide_seconds", label: "Hide Seconds", selector: { boolean: {} } },
        ],
      },
      {
        name: "Global Styling",
        type: "expandable",
        schema: [
           { name: "n_color", label: "Global Number Color", selector: { text: {} } },
           { name: "l_color", label: "Global Word Color", selector: { text: {} } },
           { name: "sep_color", label: "Separator (:,) Color", selector: { text: {} } },
        ]
      }
    ];

    this.innerHTML = `<div></div>`;
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.data = this._config;
    form.schema = schema;
    form.computeLabel = (s) => s.label || s.name;

    form.addEventListener("value-changed", (ev) => {
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: ev.detail.value },
        bubbles: true,
        composed: true
      }));
    });

    this.querySelector("div").appendChild(form);
    this._rendered = true;
  }
}

customElements.define("long-form-countdown-card", LongFormCountdownCard);
customElements.define("long-form-countdown-editor", LongFormCountdownEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "long-form-countdown-card",
  name: "Long Form Countdown Card",
  description: "Display lfwc sensors with per-unit color control.",
  preview: true
});
