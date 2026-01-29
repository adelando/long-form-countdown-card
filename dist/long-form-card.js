(function() {
  class LongFormCountdownCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
      if (!config.entity) throw new Error("Please define an entity");
      this.config = {
        font_size: 1.2,
        n_color: 'var(--primary-color)',
        l_color: 'var(--primary-color)',
        sep_color: 'var(--primary-text-color)',
        ...config
      };
    }

    set hass(hass) {
      const stateObj = hass.states[this.config.entity];
      if (!stateObj) return;

      const isFinished = stateObj.attributes.is_finished || false;
      let displayStr = stateObj.state;

      // 1. Handle Short Form conversion BEFORE colorizing
      if (this.config.short_form) {
        displayStr = displayStr
          .replace(/\bmonths?\b/gi, 'm')
          .replace(/\byears?\b/gi, 'y')
          .replace(/\bdays?\b/gi, 'd')
          .replace(/\bhours?\b/gi, 'h')
          .replace(/\bminutes?\b/gi, 'min')
          .replace(/\bseconds?\b/gi, 's');
      }

      // 2. Handle Hide Seconds
      if (this.config.hide_seconds) {
        displayStr = displayStr.replace(/,?\s*\d+\s*(second[s]?|s)\b/gi, '');
      }

      const formattedDisplay = this._colorizeUnits(displayStr);

      this.shadowRoot.innerHTML = `
        <style>
          @keyframes blink { 50% { opacity: 0; } }
          ha-card { 
            padding: 16px; 
            background: ${this.config.bg_color || 'var(--ha-card-background)'}; 
            border-radius: var(--ha-card-border-radius, 12px);
            ${isFinished && this.config.flash_finished ? 'animation: blink 1s linear infinite;' : ''}
          }
          .header { display: flex; align-items: center; margin-bottom: 8px; }
          .icon { margin-right: 12px; color: ${this.config.title_color || 'inherit'}; --mdc-icon-size: 24px; }
          .name { font-size: 0.9rem; color: ${this.config.title_color || 'inherit'}; font-weight: 500; }
          .timer { font-size: ${this.config.font_size}rem; line-height: 1.6; font-weight: 500; }
          
          /* Typography Spacing */
          .val { font-weight: 700; margin-right: 4px; }
          .lbl { font-weight: 400; margin-right: 4px; }
          .sep { color: ${this.config.sep_color}; margin-right: 8px; }
          
          /* Color Logic */
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
      // Define units in descending order of length to prevent partial matches
      const units = [
        { key: 'y', regex: /years?|y/i },
        { key: 'm', regex: /months?|m/i },
        { key: 'd', regex: /days?|d/i },
        { key: 'h', regex: /hours?|h/i },
        { key: 'min', regex: /minutes?|min/i },
        { key: 's', regex: /seconds?|s/i }
      ];

      let output = str;
      // We process numbers and words together to ensure they are paired correctly
      units.forEach(u => {
        const regex = new RegExp(`(\\d+)\\s*(${u.regex.source})\\b\\s*([,:]?)`, 'gi');
        output = output.replace(regex, (match, p1, p2, p3) => {
          return `<span class="${u.key}-v val">${p1}</span><span class="${u.key}-l lbl">${p2}</span><span class="sep">${p3}</span>`;
        });
      });
      return output;
    }

    static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
    static getStubConfig() { return { type: "custom:long-form-countdown-card", entity: "", font_size: 1.2 }; }
  }

  class LongFormCountdownEditor extends HTMLElement {
    setConfig(config) { this._config = config; }
    set hass(hass) { this._hass = hass; this._render(); }

    _render() {
      if (this._rendered || !this._hass) return;
      const schema = [
        { name: "entity", selector: { entity: { filter: [{ integration: "long_form_word_countdown" }] } } },
        { name: "name", label: "Title Override", selector: { text: {} } },
        { name: "icon", selector: { icon: {} } },
        {
          type: "grid", name: "", schema: [
            { name: "bg_color", label: "Background (Hex or Var)", selector: { text: {} } },
            { name: "title_color", label: "Title Color", selector: { text: {} } },
            { name: "font_size", label: "Size (rem)", selector: { number: { min: 0.5, max: 4, step: 0.1, mode: "slider" } } },
          ],
        },
        {
          type: "grid", name: "", schema: [
            { name: "short_form", label: "Use y, m, d, h", selector: { boolean: {} } },
            { name: "hide_seconds", label: "Hide Seconds", selector: { boolean: {} } },
            { name: "flash_finished", label: "Flash on Done", selector: { boolean: {} } },
          ],
        },
        {
          name: "Global Colors", type: "expandable", schema: [
            { name: "n_color", label: "All Numbers", selector: { text: {} } },
            { name: "l_color", label: "All Words", selector: { text: {} } },
            { name: "sep_color", label: "All Separators (:,)", selector: { text: {} } },
          ]
        },
        {
          name: "Individual Unit Colors", type: "expandable", schema: [
            {
              type: "grid", name: "", schema: [
                { name: "y_n_color", label: "Year Num", selector: { text: {} } }, { name: "y_l_color", label: "Year Word", selector: { text: {} } },
                { name: "m_n_color", label: "Month Num", selector: { text: {} } }, { name: "m_l_color", label: "Month Word", selector: { text: {} } },
                { name: "d_n_color", label: "Day Num", selector: { text: {} } }, { name: "d_l_color", label: "Day Word", selector: { text: {} } },
                { name: "h_n_color", label: "Hour Num", selector: { text: {} } }, { name: "h_l_color", label: "Hour Word", selector: { text: {} } },
                { name: "min_n_color", label: "Min Num", selector: { text: {} } }, { name: "min_l_color", label: "Min Word", selector: { text: {} } },
                { name: "s_n_color", label: "Sec Num", selector: { text: {} } }, { name: "s_l_color", label: "Sec Word", selector: { text: {} } },
              ]
            }
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
        const config = { ...this._config, ...ev.detail.value, type: "custom:long-form-countdown-card" };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
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
    description: "Multi-color, short-form, and flash-capable countdown.",
    preview: true
  });
})();
