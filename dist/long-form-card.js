(function() {
  // 1. Register for UI Selector immediately
  window.customCards = window.customCards || [];
  if (!window.customCards.find(c => c.type === 'long-form-countdown-card')) {
    window.customCards.push({
      type: "long-form-countdown-card",
      name: "Long Form Countdown Card",
      description: "Customizable countdown with deep theme override support.",
      preview: true
    });
  }

  class LongFormCountdownCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    setConfig(config) {
      if (!config.entity) throw new Error("Please define an entity");
      this.config = {
        font_size: 1.2,
        title_size: 1,
        show_header: true,
        n_color: 'var(--primary-text-color)',
        l_color: 'var(--secondary-text-color)',
        sep_color: 'var(--primary-text-color)',
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

      this.shadowRoot.innerHTML = `
        <style>
          @keyframes blink { 50% { opacity: 0; } }
          :host {
            --n-clr: ${this.config.n_color || 'inherit'};
            --l-clr: ${this.config.l_color || 'inherit'};
            --s-clr: ${this.config.sep_color || 'inherit'};
            
            /* Individual Overrides */
            --y-n: ${this.config.y_n_color || 'var(--n-clr)'}; --y-l: ${this.config.y_l_color || 'var(--l-clr)'};
            --m-n: ${this.config.m_n_color || 'var(--n-clr)'}; --m-l: ${this.config.m_l_color || 'var(--l-clr)'};
            --d-n: ${this.config.d_n_color || 'var(--n-clr)'}; --d-l: ${this.config.d_l_color || 'var(--l-clr)'};
            --h-n: ${this.config.h_n_color || 'var(--n-clr)'}; --h-l: ${this.config.h_l_color || 'var(--l-clr)'};
            --min-n: ${this.config.min_n_color || 'var(--n-clr)'}; --min-l: ${this.config.min_l_color || 'var(--l-clr)'};
            --s-n: ${this.config.s_n_color || 'var(--n-clr)'}; --s-l: ${this.config.s_l_color || 'var(--l-clr)'};
          }
          ha-card { 
            padding: 16px; 
            background: ${this.config.bg_color || 'var(--ha-card-background)'} !important; 
            border-radius: var(--ha-card-border-radius, 12px);
            ${(isFinished && this.config.flash_finished) ? 'animation: blink 1s linear infinite;' : ''}
          }
          .header { 
            display: ${this.config.show_header !== false ? 'flex' : 'none'}; 
            align-items: center; 
            margin-bottom: 8px; 
          }
          .icon { 
            margin-right: 12px; 
            color: ${this.config.title_color || 'inherit'} !important; 
            --mdc-icon-size: ${24 * (this.config.title_size || 1)}px; 
          }
          .name { 
            font-size: ${0.9 * (this.config.title_size || 1)}rem; 
            color: ${this.config.title_color || 'inherit'} !important; 
            font-weight: 500; 
          }
          .timer { font-size: ${this.config.font_size}rem; line-height: 1.6; font-weight: 500; }

          .val { font-weight: 700; margin-right: 4px; }
          .lbl { font-weight: 400; }
          .sep { margin-right: 8px; color: var(--s-clr) !important; }

          .y-v { color: var(--y-n) !important; } .y-l { color: var(--y-l) !important; }
          .m-v { color: var(--m-n) !important; } .m-l { color: var(--m-l) !important; }
          .d-v { color: var(--d-n) !important; } .d-l { color: var(--d-l) !important; }
          .h-v { color: var(--h-n) !important; } .h-l { color: var(--h-l) !important; }
          .min-v { color: var(--min-n) !important; } .min-l { color: var(--min-l) !important; }
          .s-v { color: var(--s-n) !important; } .s-l { color: var(--s-l) !important; }
        </style>
        <ha-card theme="${this.config.theme || ''}">
          <div class="header">
            <ha-icon class="icon" icon="${this.config.icon || stateObj.attributes.icon || 'mdi:clock-outline'}"></ha-icon>
            <div class="name">${this.config.name || stateObj.attributes.friendly_name}</div>
          </div>
          <div class="timer">${formattedDisplay}</div>
        </ha-card>
      `;
    }

    _colorizeUnits(str) {
      const units = [{k:'y',r:/years?|y/i},{k:'m',r:/months?|m/i},{k:'d',r:/days?|d/i},{k:'h',r:/hours?|h/i},{k:'min',r:/minutes?|min/i},{k:'s',r:/seconds?|s/i}];
      let output = str;
      units.forEach(u => {
        const regex = new RegExp(`(\\d+)\\s*(${u.r.source})\\b\\s*([,:]?)`, 'gi');
        output = output.replace(regex, `<span class="${u.k}-v val">$1</span><span class="${u.k}-l lbl">$2</span><span class="sep">$3</span>`);
      });
      return output;
    }

    static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
  }

  class LongFormCountdownEditor extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._render();
    }
    set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }

    _render() {
      if (this._rendered) { if (this._form) this._form.data = this._config; return; }
      const schema = [
        { name: "entity", selector: { entity: { filter: [{ integration: "long_form_word_countdown" }] } } },
        { type: "grid", name: "", schema: [
          { name: "theme", label: "Dashboard Theme", selector: { theme: {} } },
          { name: "show_header", label: "Show Title/Icon", selector: { boolean: {} } },
        ]},
        { name: "name", label: "Title Override", selector: { text: {} } },
        { type: "grid", name: "", schema: [
          { name: "icon", selector: { icon: {} } },
          { name: "title_size", label: "Title Scale", selector: { number: { min: 0.5, max: 3, step: 0.1, mode: "slider" } } },
        ]},
        { type: "grid", name: "", schema: [
          { name: "bg_color", label: "Background Hex", selector: { text: {} } },
          { name: "title_color", label: "Title/Icon Hex", selector: { text: {} } },
          { name: "font_size", label: "Timer Font Size", selector: { number: { min: 0.5, max: 4, step: 0.1, mode: "slider" } } },
        ]},
        { type: "grid", name: "", schema: [
          { name: "short_form", label: "Short Form", selector: { boolean: {} } },
          { name: "hide_seconds", label: "Hide Seconds", selector: { boolean: {} } },
          { name: "flash_finished", label: "Flash on Done", selector: { boolean: {} } },
        ]},
        { name: "finished_text", label: "Finished Display Text", selector: { text: {} } },
        { name: "n_color", label: "Global Number Color", selector: { text: {} } },
        { name: "l_color", label: "Global Word Color", selector: { text: {} } },
        { name: "sep_color", label: "Separator Color", selector: { text: {} } },
        { name: "Individual Overrides", type: "expandable", schema: [
          { type: "grid", name: "", schema: [
            { name: "y_n_color", label: "Year Num", selector: { text: {} } }, { name: "y_l_color", label: "Year Word", selector: { text: {} } },
            { name: "m_n_color", label: "Month Num", selector: { text: {} } }, { name: "m_l_color", label: "Month Word", selector: { text: {} } },
            { name: "d_n_color", label: "Day Num", selector: { text: {} } }, { name: "d_l_color", label: "Day Word", selector: { text: {} } },
            { name: "h_n_color", label: "Hour Num", selector: { text: {} } }, { name: "h_l_color", label: "Hour Word", selector: { text: {} } },
            { name: "min_n_color", label: "Min Num", selector: { text: {} } }, { name: "min_l_color", label: "Min Word", selector: { text: {} } },
            { name: "s_n_color", label: "Sec Num", selector: { text: {} } }, { name: "s_l_color", label: "Sec Word", selector: { text: {} } },
          ]}
        ]}
      ];

      this.innerHTML = `<div></div>`;
      this._form = document.createElement("ha-form");
      this._form.hass = this._hass;
      this._form.data = this._config;
      this._form.schema = schema;
      this._form.computeLabel = (s) => s.label || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        const config = { ...this._config, ...ev.detail.value, type: "custom:long-form-countdown-card" };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.querySelector("div").appendChild(this._form);
      this._rendered = true;
    }
  }

  customElements.define("long-form-countdown-card", LongFormCountdownCard);
  customElements.define("long-form-countdown-editor", LongFormCountdownEditor);
})();
