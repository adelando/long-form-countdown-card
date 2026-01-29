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
        n_color: '#000000', // Defaulting to a hard hex to test bypass
        l_color: '#000000',
        sep_color: '#000000',
        theme: 'none',
        ...config
      };
    }

    set hass(hass) {
      const stateObj = hass.states[this.config.entity];
      if (!stateObj) return;

      const isFinished = stateObj.attributes.is_finished || false;
      let displayStr = isFinished ? (this.config.finished_text || "Finished") : stateObj.state;

      if (!isFinished) {
        if (this.config.short_form) {
          displayStr = displayStr
            .replace(/\byears?\b/gi, 'y').replace(/\bmonths?\b/gi, 'm')
            .replace(/\bdays?\b/gi, 'd').replace(/\bhours?\b/gi, 'h')
            .replace(/\bminutes?\b/gi, 'min').replace(/\bseconds?\b/gi, 's');
        }
        if (this.config.hide_seconds) {
          displayStr = displayStr.replace(/,?\s*\d+\s*(second[s]?|s)\b/gi, '');
        }
      }

      const formattedDisplay = isFinished ? displayStr : this._colorizeUnits(displayStr);

      if (!this.shadowRoot.innerHTML || this._lastEntity !== this.config.entity) {
        this._fullRender(stateObj, formattedDisplay, isFinished);
      } else {
        const timerEl = this.shadowRoot.querySelector('.timer');
        if (timerEl) timerEl.innerHTML = formattedDisplay;
      }
      this._lastEntity = this.config.entity;
    }

    _colorizeUnits(str) {
      const units = [
        { key: 'y', regex: /years?|y/i }, { key: 'm', regex: /months?|m/i },
        { key: 'd', regex: /days?|d/i }, { key: 'h', regex: /hours?|h/i },
        { key: 'min', regex: /minutes?|min/i }, { key: 's', regex: /seconds?|s/i }
      ];
      
      let output = str;
      units.forEach(u => {
        const regex = new RegExp(`(\\d+)\\s*(${u.regex.source})\\b\\s*([,:]?)`, 'gi');
        output = output.replace(regex, (match, p1, p2, p3) => {
          const numColor = this.config[u.key + '_n_color'] || this.config.n_color;
          const wordColor = this.config[u.key + '_l_color'] || this.config.l_color;
          const sepColor = this.config.sep_color;

          // ULTIMATE BYPASS: Hardcoded color strings in the style attribute
          return `<span style="color: ${numColor} !important; font-weight: 700; margin-right: 4px; display: inline-block;">${p1}</span>` +
                 `<span style="color: ${wordColor} !important; font-weight: 400; display: inline-block;">${p2}</span>` +
                 `<span style="color: ${sepColor} !important; margin-right: 8px; display: inline-block;">${p3 || ''}</span>`;
        });
      });
      return output;
    }

    _fullRender(stateObj, formattedDisplay, isFinished) {
      const icon = this.config.icon || stateObj.attributes.icon || 'mdi:clock-outline';
      
      this.shadowRoot.innerHTML = `
        <style>
          @keyframes blink { 50% { opacity: 0; } }
          ha-card { 
            padding: 16px; 
            background: ${this.config.bg_color || 'var(--ha-card-background)'} !important; 
            border-radius: var(--ha-card-border-radius, 12px);
            /* Resetting all common theme variables to force local control */
            --primary-text-color: initial;
            --secondary-text-color: initial;
            --text-primary-color: initial;
            color: initial !important;
            ${(isFinished && this.config.flash_finished) ? 'animation: blink 1s linear infinite;' : ''}
          }
          .header { display: flex; align-items: center; margin-bottom: 8px; }
          .icon { margin-right: 12px; color: ${this.config.title_color || 'inherit'} !important; --mdc-icon-size: 24px; }
          .name { font-size: 0.9rem; color: ${this.config.title_color || 'inherit'} !important; font-weight: 500; }
          .timer { 
            font-size: ${this.config.font_size}rem; 
            line-height: 1.6; 
            font-weight: 500;
            display: block;
          }
        </style>
        <ha-card ${this.config.theme !== 'none' ? `theme="${this.config.theme}"` : ''}>
          <div class="header">
            <ha-icon class="icon" icon="${icon}"></ha-icon>
            <div class="name">${this.config.name || stateObj.attributes.friendly_name}</div>
          </div>
          <div class="timer">${formattedDisplay}</div>
        </ha-card>
      `;
    }

    static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
    static getStubConfig() { return { type: "custom:long-form-countdown-card", entity: "", font_size: 1.2, theme: "none" }; }
  }

  class LongFormCountdownEditor extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._render();
    }
    set hass(hass) {
      this._hass = hass;
      if (this._form) this._form.hass = hass;
    }

    _render() {
      if (this._rendered) {
        if (this._form) this._form.data = this._config;
        return;
      }
      
      const schema = [
        { name: "entity", selector: { entity: { filter: [{ integration: "long_form_word_countdown" }] } } },
        {
          type: "grid", name: "", schema: [
            { name: "name", label: "Title Override", selector: { text: {} } },
            { name: "icon", selector: { icon: {} } },
          ]
        },
        {
          type: "grid", name: "", schema: [
            { name: "theme", label: "Card Theme", selector: { theme: {} } }, // Adds the theme selector
            { name: "finished_text", label: "Finished Display Text", selector: { text: {} } },
          ]
        },
        {
          type: "grid", name: "", schema: [
            { name: "bg_color", label: "Background Color", selector: { text: {} } },
            { name: "title_color", label: "Title & Icon Color", selector: { text: {} } },
            { name: "font_size", label: "Size (rem)", selector: { number: { min: 0.5, max: 4, step: 0.1, mode: "slider" } } },
          ],
        },
        {
          type: "grid", name: "", schema: [
            { name: "short_form", label: "Short Form", selector: { boolean: {} } },
            { name: "hide_seconds", label: "Hide Seconds", selector: { boolean: {} } },
            { name: "flash_finished", label: "Flash on Done", selector: { boolean: {} } },
          ],
        },
        {
          name: "Global Colors (Bypasses Theme)", type: "expandable", schema: [
            { name: "n_color", label: "Global Numbers", selector: { text: {} } },
            { name: "l_color", label: "Global Words", selector: { text: {} } },
            { name: "sep_color", label: "Global Separators", selector: { text: {} } },
          ]
        },
        {
          name: "Individual Unit Overrides", type: "expandable", schema: [
            { type: "grid", name: "", schema: [
              { name: "y_n_color", label: "Year Num", selector: { text: {} } }, { name: "y_l_color", label: "Year Word", selector: { text: {} } },
              { name: "m_n_color", label: "Month Num", selector: { text: {} } }, { name: "m_l_color", label: "Month Word", selector: { text: {} } },
              { name: "d_n_color", label: "Day Num", selector: { text: {} } }, { name: "d_l_color", label: "Day Word", selector: { text: {} } },
              { name: "h_n_color", label: "Hour Num", selector: { text: {} } }, { name: "h_l_color", label: "Hour Word", selector: { text: {} } },
              { name: "min_n_color", label: "Min Num", selector: { text: {} } }, { name: "min_l_color", label: "Min Word", selector: { text: {} } },
              { name: "s_n_color", label: "Sec Num", selector: { text: {} } }, { name: "s_l_color", label: "Sec Word", selector: { text: {} } },
            ]}
          ]
        }
      ];

      this.innerHTML = `<div></div>`;
      this._form = document.createElement("ha-form");
      this._form.hass = this._hass;
      this._form.data = this._config;
      this._form.schema = schema;
      this._form.computeLabel = (s) => s.label || s.name;

      this._form.addEventListener("value-changed", (ev) => {
        const config = { ...ev.detail.value, type: "custom:long-form-countdown-card" };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });

      this.querySelector("div").appendChild(this._form);
      this._rendered = true;
    }
  }

  customElements.define("long-form-countdown-card", LongFormCountdownCard);
  customElements.define("long-form-countdown-editor", LongFormCountdownEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "long-form-countdown-card",
    name: "Long Form Countdown Card",
    description: "Theme-isolated countdown with hex-override logic.",
    preview: true
  });
})();
