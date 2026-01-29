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
        .lbl { font-weight: 400; margin-right: 6px; margin-left: 2px; }
        /* Unit Overrides */
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
      // The $1 $2 ensures a space is maintained between number and word
      output = output.replace(new RegExp(`(\\d+)\\s*(${u.regex.source})`, 'gi'), 
        `<span class="${u.key}-v val">$1</span> <span class="${u.key}-l lbl">$2</span>`);
    });
    return output;
  }

  static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
}

// --- VISUAL EDITOR ---
class LongFormCountdownEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (this._rendered) return;
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
          .entityFilter=${(stateObj) => stateObj.entity_id.startsWith('sensor.lfwc_')}
          allow-custom-entity
          @value-changed=${(ev) => this._changed(ev, 'entity')}>
        </ha-entity-picker>

        <div class="grid">
          <ha-icon-picker .hass=${this._hass} .value=${this._config.icon} @value-changed=${(ev) => this._changed(ev, 'icon')}></ha-icon-picker>
          <ha-textfield label="Title Override" .value=${this._config.name || ''} @input=${(ev) => this._changed(ev, 'name')}></ha-textfield>
        </div>

        <div class="grid">
          <ha-textfield label="Card BG" .value=${this._config.bg_color} @input=${(ev) => this._changed(ev, 'bg_color')}></ha-textfield>
          <ha-textfield label="Title Color" .value=${this._config.title_color} @input=${(ev) => this._changed(ev, 'title_color')}></ha-textfield>
        </div>

        <ha-formfield label="Hide Seconds">
          <ha-switch .checked=${this._config.hide_seconds} @change=${(ev) => this._changed(ev, 'hide_seconds', true)}></ha-switch>
        </ha-formfield>

        <details>
          <summary>Global Colors</summary>
          <div class="grid">
            <ha-textfield label="Global Number Color" .value=${this._config.n_color} @input=${(ev) => this._changed(ev, 'n_color')}></ha-textfield>
            <ha-textfield label="Global Word Color" .value=${this._config.l_color} @input=${(ev) => this._changed(ev, 'l_color')}></ha-textfield>
          </div>
        </details>

        <details>
          <summary>Specific Overrides (Y, M, D, H, M, S)</summary>
          <div class="grid">
            <ha-textfield label="Year Num" .value=${this._config.y_n_color || ''} @input=${(ev) => this._changed(ev, 'y_n_color')}></ha-textfield>
            <ha-textfield label="Year Word" .value=${this._config.y_l_color || ''} @input=${(ev) => this._changed(ev, 'y_l_color')}></ha-textfield>
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
  description: "A highly customizable card for displaying long-form countdown sensors (lfwc_).",
  preview: true
});
