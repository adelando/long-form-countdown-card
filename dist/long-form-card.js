(function() {
  window.customCards = window.customCards || [];
  if (!window.customCards.find(c => c.type === 'long-form-countdown-card')) {
    window.customCards.push({
      type: "long-form-countdown-card",
      name: "Long Form Countdown Card",
      description: "Isolated timer flashing with capitalized elapsed state.",
      preview: true
    });
  }

  class LongFormCountdownCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._initialized = false;
    }

    setConfig(config) {
      if (!config.entity) throw new Error("Please define an entity");
      this.config = config;
    }

    _getConf(key, section = null) {
      if (section && this.config[section] && this.config[section][key] !== undefined) {
        return this.config[section][key];
      }
      return this.config[key];
    }

    set hass(hass) {
      const stateObj = hass.states[this.config.entity];
      if (!stateObj || !hass) return;

      if (!this._initialized) {
        this._firstRender(stateObj);
        this._initialized = true;
      }
      this._updateTimer(stateObj);
    }

    _firstRender(stateObj) {
      const showHeader = this._getConf('show_header', 'header_settings') !== false;
      const titleSize = this._getConf('title_size', 'header_settings') || 1;
      const icon = this._getConf('icon', 'header_settings') || stateObj.attributes.icon || 'mdi:clock-outline';
      const bgColor = this._getConf('bg_color', 'timer_settings') || 'var(--ha-card-background)';

      this.shadowRoot.innerHTML = `
        <style>
          @keyframes blink { 50% { opacity: 0.3; } }
          ha-card { 
            padding: 16px; 
            background: ${bgColor} !important; 
            border-radius: var(--ha-card-border-radius, 12px);
          }
          .header { display: ${showHeader ? 'flex' : 'none'}; align-items: center; margin-bottom: 8px; }
          .icon { margin-right: 12px; color: ${this._getConf('icon_color', 'header_settings') || 'inherit'} !important; --mdc-icon-size: ${24 * titleSize}px; }
          .name { font-size: ${0.9 * titleSize}rem; color: ${this._getConf('title_color', 'header_settings') || 'inherit'} !important; font-weight: 500; }
          .timer { font-size: ${this._getConf('font_size', 'timer_settings') || 1.2}rem; line-height: 1.6; font-weight: 500; }
          .sep { margin-right: 4px; color: ${this._getConf('sep_color', 'global_colors') || 'inherit'} !important; }
          .timer-flash { animation: blink 1s linear infinite !important; }
          .elapsed-text { text-transform: capitalize; }
        </style>
        <ha-card>
          <div class="header">
            <ha-icon class="icon" icon="${icon}"></ha-icon>
            <div class="name">${this._getConf('name', 'header_settings') || stateObj.attributes.friendly_name}</div>
          </div>
          <div class="timer" id="timer-display"></div>
        </ha-card>
      `;
    }

    _updateTimer(stateObj) {
      const timerEl = this.shadowRoot.getElementById('timer-display');
      if (!timerEl) return;

      const isFinished = stateObj.attributes.is_finished || stateObj.state.toLowerCase().includes('elapsed');
      const mode = this._getConf('finished_mode', 'timer_settings') || 'show_elapsed';
      const lGlob = this._getConf('l_color', 'global_colors') || 'var(--secondary-text-color)';
      
      let displayStr = stateObj.state;

      if (isFinished) {
        if (mode === 'show_text') {
          displayStr = this._getConf('finished_text', 'timer_settings') || "Finished";
          timerEl.innerHTML = `<span style="color: ${lGlob} !important;">${displayStr}</span>`;
        } else {
            // mode is show_elapsed
            timerEl.innerHTML = this._colorizeUnits(displayStr);
        }
        
        if (this._getConf('flash_finished', 'timer_settings')) {
          timerEl.classList.add('timer-flash');
        } else {
          timerEl.classList.remove('timer-flash');
        }
      } else {
        timerEl.classList.remove('timer-flash');
        timerEl.innerHTML = this._colorizeUnits(displayStr);
      }
    }

    _colorizeUnits(str) {
      const lGlob = this._getConf('l_color', 'global_colors') || 'var(--secondary-text-color)';
      const nGlob = this._getConf('n_color', 'global_colors') || 'var(--primary-text-color)';
      const sepClr = this._getConf('sep_color', 'global_colors') || nGlob;

      // Handle "Elapsed" with capitalization and global word color
      let processed = str.replace(/\belapsed\b/gi, `<span class="elapsed-text" style="color: ${lGlob} !important; font-weight: 400; margin-right: 8px;">Elapsed</span>`);

      // Logic for formatting
      if (this._getConf('short_form', 'timer_settings')) {
          processed = processed
            .replace(/\byears?\b/gi, 'y').replace(/\bmonths?\b/gi, 'm')
            .replace(/\bdays?\b/gi, 'd').replace(/\bhours?\b/gi, 'h')
            .replace(/\bminutes?\b/gi, 'min').replace(/\bseconds?\b/gi, 's');
      }
      if (this._getConf('hide_seconds', 'timer_settings')) {
          processed = processed.replace(/,?\s*\d+\s*(second[s]?|s)\b/gi, '');
      }

      const units = [{k:'y',r:/years?|y/i},{k:'m',r:/months?|m/i},{k:'d',r:/days?|d/i},{k:'h',r:/hours?|h/i},{k:'min',r:/minutes?|min/i},{k:'s',r:/seconds?|s/i}];
      units.forEach(u => {
        const regex = new RegExp(`(\\d+)\\s*(${u.r.source})\\b\\s*([,:]?)`, 'gi');
        processed = processed.replace(regex, (match, p1, p2, p3) => {
          const nColor = this._getConf(`${u.k}_n_color`, 'unit_overrides') || nGlob;
          const lColor = this._getConf(`${u.k}_l_color`, 'unit_overrides') || lGlob;
          return `<span style="color: ${nColor} !important; font-weight: 700; margin-right: 4px;">${p1}</span>` +
                 `<span style="color: ${lColor} !important; font-weight: 400;">${p2}</span>` +
                 `<span class="sep" style="color: ${sepClr}">${p3 || ''}</span>`;
        });
      });
      return processed;
    }

    static getConfigElement() { return document.createElement("long-form-countdown-editor"); }
    static getStubConfig() { 
      return { 
        entity: "", 
        header_settings: { show_header: true, title_size: 1 },
        timer_settings: { font_size: 1.2, finished_mode: "show_elapsed" }
      }; 
    }
  }

  // (LongFormCountdownEditor class remains identical to previous working version)
  class LongFormCountdownEditor extends HTMLElement {
    setConfig(config) {
      this._config = config;
      if (this._form && !this._isTyping) {
        this._form.data = this._config;
      } else if (!this._form) {
        this._render();
      }
    }
    
    set hass(hass) { this._hass = hass; if (this._form) this._form.hass = hass; }

    _render() {
      const schema = [
        { name: "entity", selector: { entity: { filter: [{ integration: "long_form_word_countdown" }] } } },
        {
          name: "header_settings", label: "Header Settings", type: "expandable", schema: [
            { name: "show_header", label: "Show Header", selector: { boolean: {} } },
            { name: "name", label: "Title Override", selector: { text: {} } },
            { name: "icon", selector: { icon: {} } },
            { type: "grid", name: "", schema: [
              { name: "title_color", label: "Title Color", selector: { text: {} } },
              { name: "icon_color", label: "Icon Color", selector: { text: {} } },
              { name: "title_size", label: "Header Scale", selector: { number: { min: 0.5, max: 3, step: 0.1, mode: "slider" } } },
            ]},
          ]
        },
        {
          name: "timer_settings", label: "Timer Settings", type: "expandable", schema: [
            { name: "finished_mode", label: "When Finished Show...", selector: { select: { options: [
              { value: "show_elapsed", label: "Elapsed Time" },
              { value: "show_text", label: "Finished Text Only" }
            ] } } },
            { type: "grid", name: "", schema: [
              { name: "bg_color", label: "Background Hex", selector: { text: {} } },
              { name: "font_size", label: "Timer Font Size", selector: { number: { min: 0.5, max: 4, step: 0.1, mode: "slider" } } },
            ]},
            { type: "grid", name: "", schema: [
              { name: "short_form", label: "Short Form", selector: { boolean: {} } },
              { name: "hide_seconds", label: "Hide Seconds", selector: { boolean: {} } },
              { name: "flash_finished", label: "Flash on Done", selector: { boolean: {} } },
            ]},
            { name: "finished_text", label: "Finished Text", selector: { text: {} } },
          ]
        },
        {
          name: "global_colors", label: "Global Colors", type: "expandable", schema: [
            { name: "n_color", label: "Global Number Color", selector: { text: {} } },
            { name: "l_color", label: "Global Word Color", selector: { text: {} } },
            { name: "sep_color", label: "Separator Color", selector: { text: {} } },
          ]
        },
        {
          name: "unit_overrides", label: "Individual Unit Overrides", type: "expandable", schema: [
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
      
      this._form.addEventListener("focusin", () => { this._isTyping = true; });
      this._form.addEventListener("focusout", () => { this._isTyping = false; });

      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this.dispatchEvent(new CustomEvent("config-changed", { 
          detail: { config: ev.detail.value }, 
          bubbles: true, 
          composed: true 
        }));
      });
      this.querySelector("div").appendChild(this._form);
    }
  }

  customElements.define("long-form-countdown-card", LongFormCountdownCard);
  customElements.define("long-form-countdown-editor", LongFormCountdownEditor);
})();
