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
        n_color: 'var(--primary-text-color)',
        l_color: 'var(--secondary-text-color)',
        sep_color: 'var(--primary-text-color)',
        finished_text: 'Finished',
        ...config
      };
    }

    set hass(hass) {
      const stateObj = hass.states[this.config.entity];
      if (!stateObj) return;

      const isFinished = stateObj.attributes.is_finished || false;
      let displayStr = isFinished ? this.config.finished_text : stateObj.state;

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

      // Only update the inner timer content to prevent Icon flickering
      if (!this.shadowRoot.innerHTML || this._needsFullRender(stateObj)) {
        this._fullRender(stateObj, formattedDisplay, isFinished);
      } else {
        const timerEl = this.shadowRoot.querySelector('.timer');
        if (timerEl) timerEl.innerHTML = formattedDisplay;
        
        // Update flashing state without re-rendering everything
        const card = this.shadowRoot.querySelector('ha-card');
        if (isFinished && this.config.flash_finished) {
           card.style.animation = 'blink 1s linear infinite';
        } else {
           card.style.animation = 'none';
        }
      }
      this._lastState = stateObj.state;
    }

    _needsFullRender(stateObj) {
      return this._lastEntity !== this.config.entity || this._lastIcon !== (this.config.icon || stateObj.attributes.icon);
    }

    _fullRender(stateObj, formattedDisplay, isFinished) {
      this._lastEntity = this.config.entity;
      this._lastIcon = this.config.icon || stateObj.attributes.icon;

      this.shadowRoot.innerHTML = `
        <style>
          @keyframes blink { 50% { opacity: 0; } }
          ha-card { 
            padding: 16px; 
            background: ${this.config.bg_color || 'var(--ha-card-background)'} !important; 
            border-radius: var(--ha-card-border-radius, 12px);
          }
          .header { display: flex; align-items: center; margin-bottom: 8px; }
          .icon { margin-right: 12px; color: ${this.config.title_color || 'inherit'} !important; --mdc-icon-size: 24px; }
          .name { font-size: 0.9rem; color: ${this.config.title_color || 'inherit'} !important; font-weight: 500; }
          .timer { 
            font-size: ${this.config.font_size}rem; 
            line-height: 1.6; 
            font-weight: 500;
            color: ${this.config.n_color} !important; 
          }
          
          /* Target spans explicitly to force Hex Colors */
          .timer span { display: inline-block; }
          .val { font-weight: 700; margin-right: 2px; }
          .lbl { font-weight: 400; margin-right: 4px; }
          .sep { color: ${this.config.sep_color} !important; margin-right: 6px; }
          
          /* Per-unit Overrides */
          .y-v { color: ${this.config.y_n_color || this.config.n_color} !important; } .y-l { color: ${this.config.y_l_color || this.config.l_color} !important; }
          .m-v { color: ${this.config.m_n_color || this.config.n_color} !important; } .m-l { color: ${this.config.m_l_color || this.config.l_color} !important; }
          .d-v { color: ${this.config.d_n_color || this.config.n_color} !important; } .d-l { color: ${this.config.d_l_color || this.config.l_color} !important; }
          .h-v { color: ${this.config.h_n_color || this.config.n_color} !important; } .h-l { color: ${this.config.h_l_color || this.config.l_color} !important; }
          .min-v { color: ${this.config.min_n_color || this.config.n_color} !important; } .min-l { color: ${this.config.min_l_color || this.config.l_color} !important; }
          .s-v { color: ${this.config.s_n_color || this.config.n_color} !important; } .s-l { color: ${this.config.s_l_color || this.config.l_color} !important; }
        </style>
        <ha-card>
          <div class="header">
            <ha-icon class="icon" icon="${this._lastIcon || 'mdi:clock-outline'}"></ha-icon>
            <div class="name">${this.config.name || stateObj.attributes.friendly_name}</div>
          </div>
          <div class="timer">${formattedDisplay}</div>
        </ha-card>
      `;
    }

    _colorizeUnits(str) {
      const units = [
        { key: 'y', regex: /years?|y/i }, { key: 'm', regex: /months?|m/i },
        { key: 'd', regex: /days?|d/i }, { key: 'h', regex: /hours?|h/i },
        { key: 'min', regex: /minutes?|min/i }, { key: 's', regex: /seconds?|s/i }
      ];
      let output = str;
      units.forEach(u => {
        const regex = new RegExp(`(\\d+)\\s*(${u.regex.source})\\b(\\s*[:]?\\s*)`, 'gi');
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
        { name: "finished_text", label: "Finished Display Text", selector: { text: {} } },
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
          name: "Global Colors", type: "expandable", schema: [
            { name: "n_color", label: "Global Numbers", selector: { text: {} } },
            { name: "l_color", label: "Global Words", selector: { text: {} } },
            { name: "sep_color", label: "Global Separators", selector: { text: {} } },
          ]
        },
        {
          name: "Individual Unit Overrides", type: "expandable", schema: [
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
})();
