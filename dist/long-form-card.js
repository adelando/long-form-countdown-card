class LongFormCountdownCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity");
    this.config = {
      title_color: 'var(--secondary-text-color)',
      num_color: 'var(--primary-color)',
      bg_color: 'var(--ha-card-background, var(--card-background-color, white))',
      year_color: '', 
      month_color: '',
      day_color: '',
      font_size: '1.2',
      flash_zero: false,
      ...config
    };
  }

  set hass(hass) {
    const stateObj = hass.states[this.config.entity];
    if (!stateObj) return;

    const isFinished = stateObj.attributes.total_seconds_left <= 0;
    let displayStr = stateObj.state;

    // Logic to wrap time units in spans for custom coloring
    const formattedDisplay = this._colorizeUnits(displayStr);

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
          background: ${this.config.bg_color};
          border-radius: var(--ha-card-border-radius, 12px);
          border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, #e0e0e0));
        }
        .name {
          font-size: 0.9rem;
          color: ${this.config.title_color};
          margin-bottom: 8px;
        }
        .timer {
          font-size: ${this.config.font_size}rem;
          color: ${this.config.num_color};
          font-weight: 500;
          line-height: 1.4;
        }
        .y { color: ${this.config.year_color || this.config.num_color}; }
        .m { color: ${this.config.month_color || this.config.num_color}; }
        .d { color: ${this.config.day_color || this.config.num_color}; }
        @keyframes blink { 50% { opacity: 0.3; } }
        .flashing { animation: blink 1s linear infinite; color: var(--error-color) !important; }
      </style>
      <ha-card>
        <div class="name">${this.config.name || stateObj.attributes.friendly_name}</div>
        <div class="timer ${(this.config.flash_zero && isFinished) ? 'flashing' : ''}">
          ${formattedDisplay}
        </div>
      </ha-card>
    `;
  }

  _colorizeUnits(str) {
    // Regular expression to wrap specific units in colored classes
    return str
      .replace(/(\d+\s*year[s]?)/gi, '<span class="y">$1</span>')
      .replace(/(\d+\s*month[s]?)/gi, '<span class="m">$1</span>')
      .replace(/(\d+\s*day[s]?)/gi, '<span class="d">$1</span>');
  }

  static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
  static getStubConfig() { return { entity: "", title_color: "grey", num_color: "blue" }; }
}

// --- VISUAL EDITOR ---
class LongFormCountdownEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (this._rendered) return;
    this.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <ha-entity-picker .hass=${this._hass} .value=${this._config.entity} .includeDomains=${['sensor']} @value-changed=${(ev) => this._changed(ev, 'entity')}></ha-entity-picker>
        
        <p><strong>Colors (Hex or CSS Name)</strong></p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
           <ha-textfield label="Background" .value=${this._config.bg_color} @input=${(ev) => this._changed(ev, 'bg_color')}></ha-textfield>
           <ha-textfield label="Title Color" .value=${this._config.title_color} @input=${(ev) => this._changed(ev, 'title_color')}></ha-textfield>
           <ha-textfield label="Number Color" .value=${this._config.num_color} @input=${(ev) => this._changed(ev, 'num_color')}></ha-textfield>
           <ha-textfield label="Year Color" .value=${this._config.year_color} @input=${(ev) => this._changed(ev, 'year_color')}></ha-textfield>
           <ha-textfield label="Month Color" .value=${this._config.month_color} @input=${(ev) => this._changed(ev, 'month_color')}></ha-textfield>
           <ha-textfield label="Day Color" .value=${this._config.day_color} @input=${(ev) => this._changed(ev, 'day_color')}></ha-textfield>
        </div>
        
        <ha-formfield label="Flash on Finish">
          <ha-switch .checked=${this._config.flash_zero} @change=${(ev) => this._changed(ev, 'flash_zero', true)}></ha-switch>
        </ha-formfield>
      </div>
    `;
    this._rendered = true;
  }

  _changed(ev, field, isBool = false) {
    const val = isBool ? ev.target.checked : (ev.detail?.value || ev.target.value);
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._config, [field]: val } },
      bubbles: true, composed: true
    }));
  }
}

customElements.define("long-form-countdown-card", LongFormCountdownCard);
customElements.define("long-form-countdown-editor", LongFormCountdownEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "long-form-countdown-card",
  name: "Long Form Countdown Card",
  preview: true
});
