# Long Form Countdown Card

A highly customizable Home Assistant Lovelace card designed specifically for the **Long Form Word Countdown** integration. This card allows you to display countdowns with granular control over colors, styling, and "finished" states.

> [!IMPORTANT]  
> **Requirement:** This card only works with the [Long Form Word Countdown integration](https://github.com/adelando/long-form-word-countdown). Ensure the integration is installed and configured before using this card.

## Features
- **Nested Configuration:** Clean, organized visual editor.
- **Unit Overrides:** Change the color of specific numbers and labels (Years, Months, Days, etc.).
- **Smart "Finished" States:** Choose between showing elapsed time or custom text.
- **Dynamic Styling:** Optional flashing alerts and scaling headers.
- **Flicker-Free:** Efficient rendering logic that keeps the header static while the timer ticks.

---

## Configuration Reference

The card uses a nested configuration structure to keep the YAML and Visual Editor organized.

### 1. Root Options
| Key | Type | Description |
| :--- | :--- | :--- |
| `type` | `string` | Must be `custom:long-form-countdown-card`. |
| `entity` | `string` | The `sensor` entity from the Long Form integration. |

### 2. Header Settings (`header_settings`)
| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `show_header` | `boolean` | `true` | Toggle the icon and title visibility. |
| `name` | `string` | Entity Name | Override the title text. |
| `icon` | `string` | Entity Icon | Override the MDI icon. |
| `bg_color` | `string` | `var(--ha-card-background)` | Hex color for the card background. |
| `title_color` | `string` | `inherit` | Hex color for the title text. |
| `icon_color` | `string` | `inherit` | Hex color for the icon. |
| `title_size` | `number` | `1` | Scale factor for the header (0.5 to 3.0). |

### 3. Timer Settings (`timer_settings`)
| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `font_size` | `number` | `1.2` | Font size of the timer in `rem`. |
| `short_form` | `boolean` | `false` | Converts "hours" to "h", "minutes" to "min", etc. |
| `hide_seconds`| `boolean` | `false` | Strips seconds from the display. |
| `finished_mode`| `string` | `show_elapsed` | `show_elapsed` (counts up) or `show_text` (static). |
| `finished_text`| `string` | "Finished" | The text to display in `show_text` mode. |
| `flash_finished`| `boolean` | `false` | Makes the timer text pulse when time has elapsed. |

### 4. Global & Unit Colors
- **`global_colors`**: Set `n_color` (numbers), `l_color` (labels/words), and `sep_color` (separators like `:`).
- **`unit_overrides`**: Apply specific colors to units. Use `{unit}_n_color` for numbers and `{unit}_l_color` for words (Units: `y, m, d, h, min, s`).

---

## Example Use Cases

### Example 1: The "Minimalist" (Short form & Elapsed)
This setup uses short unit labels and continues to count up once the date has passed.

```yaml
type: custom:long-form-countdown-card
entity: sensor.lwfc_anniversary_countdown
header_settings:
  show_header: true
  name: Anniversary
  bg_color: "#1a1a1a"
timer_settings:
  short_form: true
  finished_mode: show_elapsed
  flash_finished: false
global_colors:
  n_color: "#ff9800"
  l_color: "#bdbdbd"
