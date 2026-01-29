class LongFormCountdownCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity");
    this.config = {
      name: '',
      title_color: 'var(--secondary-text-color)',
      bg_color: 'var(--ha-card-background, var(--card-background-color, white))',
      font_size: '1.2',
      hide_seconds: false,
      icon: '',
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
        ha-card { padding: 16px; background: ${this.config.bg_color}; border-radius: var(--ha-card-border-radius, 12px); }
        .header { display: flex; align-items: center; margin-bottom: 8px; }
        .icon { margin-right: 12px; color: ${this.config.title_color}; --mdc-icon-size: 24px; }
        .name { font-size: 0.9rem; color: ${this.config.title_color}; font-weight: 500; }
        .timer { font-size: ${this.config.font_size}rem; line-height: 1.6; font-weight: 500; }
        .val { font-weight: 700; }
        .lbl { font-weight: 400; margin-left: 2px; }
        .sep { color: ${this.config.sep_color}; margin-right: 6px; }
        /* Overrides */
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
      { key: 'y', regex: /year[s]?/gi },
      { key: 'm', regex: /month[s]?/gi },
      { key: 'd', regex: /day[s]?/gi },
      { key: 'h', regex: /hour[s]?/gi },
      { key: 'min', regex: /minute[s]?/gi },
      { key: 's', regex: /second[s]?/gi }
    ];

    let output = str;
    units.forEach(u => {
      // Wraps Number and Unit, preserves the following character (like : or ,)
      output = output.replace(new RegExp(`(\\d+)\\s*(${u.regex.source})([,:]?)`, 'gi'), 
        `<span class="${u.key}-v val">$1</span><span class="${u.key}-l lbl">$2</span><span class="sep">$3</span>`);
    });
    return output;
  }

  static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
}

// --- VISUAL EDITOR ---
class LongFormCountdownEditor extends HTMLElement {
  setConfig(config) {
    // Force a default object structure to prevent "undefined" errors
    this._config = {
        entity: '',
        icon: '',
        name: '',
        bg_color: '',
        title_color: '',
        n_color: '',
        l_color: '',
        sep_color: '',
        ...config
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (this._rendered || !this._hass) return;

    this.innerHTML = `
      <style>
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px 0; }
        details { border: 1px solid var(--divider-color); margin-top: 10px; border-radius: 4px; }
        summary { cursor: pointer; padding: 10px; background: var(--secondary-background-color); font-weight: bold; }
      </style>
      <div>
        <ha-entity-picker 
          .hass=${this._hass} 
          .value=${this._config.entity} 
          .includeDomains=${['sensor']}
          .entityFilter=${(state) => state.entity_id.startsWith('sensor.lfwc_')}
          label="Entity (sensor.lfwc_...)"
          @value-changed=${(ev) => this._changed(ev, 'entity')}>
        </ha-entity-picker>

        <div class="grid">
          <ha-icon-picker .hass=${this._hass} .value=${this._config.icon} label="Icon" @value-changed=${(ev) => this._changed(ev, 'icon')}></ha-icon-picker>
          <ha-textfield label="Title Override" .value=${this._config.name} @input=${(ev) => this._changed(ev, 'name')}></ha-textfield>
        </div>

        <div class="grid">
          <ha-textfield label="Card Background" .value=${this._config.bg_color} @input=${(ev) => this._changed(ev, 'bg_color')}></ha-textfield>
          <ha-textfield label="Title Color" .value=${this._config.title_color} @input=${(ev) => this._changed(ev, 'title_color')}></ha-textfield>
        </div>

        <ha-formfield label="Hide Seconds">
          <ha-switch .checked=${this._config.hide_seconds} @change=${(ev) => this._changed(ev, 'hide_seconds', true)}></ha-switch>
        </ha-formfield>

        <details>
          <summary>Global Colors</summary>
          <div class="grid">
            <ha-textfield label="Numbers" .value=${this._config.n_color} @input=${(ev) => this._changed(ev, 'n_color')}></ha-textfield>
            <ha-textfield label="Words" .value=${this._config.l_color} @input=${(ev) => this._changed(ev, 'l_color')}></ha-textfield>
            <ha-textfield label="Separators (:,)" .value=${this._config.sep_color} @input=${(ev) => this._changed(ev, 'sep_color')}></ha-textfield>
          </div>
        </details>

        <details>
          <summary>Specific Unit Overrides</summary>
          <div class="grid">
            <ha-textfield label="Year Num" .value=${this._config.y_n_color || ''} @input=${(ev) => this._changed(ev, 'y_n_color')}></ha-textfield>
            <ha-textfield label="Year Word" .value=${this._config.y_l_color || ''} @input=${(ev) => this._changed(ev, 'y_l_color')}></ha-textfield>
            <ha-textfield label="Month Num" .value=${this._config.m_n_color || ''} @input=${(ev) => this._changed(ev, 'm_n_color')}></ha-textfield>
            <ha-textfield label="Month Word" .value=${this._config.m_l_color || ''} @input=${(ev) => this._changed(ev, 'm_l_color')}></ha-textfield>
            <ha-textfield label="Day Num" .value=${this._config.d_n_color || ''} @input=${(ev) => this._changed(ev, 'd_n_color')}></ha-textfield>
            <ha-textfield label="Day Word" .value=${this._config.d_l_color || ''} @input=${(ev) => this._changed(ev, 'd_l_color')}></ha-textfield>
          </div>
        </details>
      </div>
    `;
    this._rendered = true;
  }

  _changed(ev, field, isBool = false) {
    const val = isBool ? ev.target.checked : (ev.detail?.value || ev.target.value);
    const newConfig = { ...this._config, [field]: val };
    
    // Fire event to update the card preview and the dashboard
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define("long-form-countdown-card", LongFormCountdownCard);
customElements.define("long-form-countdown-editor", LongFormCountdownEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "long-form-countdown-card",
  name: "Long Form Countdown Card",
  description: "A highly customizable card for lfwc_ sensors.",
  preview: true
});
