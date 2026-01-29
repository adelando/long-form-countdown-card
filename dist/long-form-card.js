// --- SCHEMA-BASED EDITOR (STABLE MERGE) ---
class LongFormCountdownEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (this._rendered || !this._hass) return;
    
    const schema = [
      { 
        name: "entity", 
        selector: { 
          entity: { 
            filter: { domain: "sensor", integration: "long_form_word_countdown" } 
          } 
        } 
      },
      { name: "name", label: "Title Override", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
      {
        type: "grid",
        name: "",
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
           { name: "sep_color", label: "Separator Color", selector: { text: {} } },
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
      // CRITICAL: Merge new values with old config to preserve 'type'
      const newConfig = {
        ...this._config,
        ...ev.detail.value
      };
      
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true
      }));
    });

    this.querySelector("div").appendChild(form);
    this._rendered = true;
  }
}
