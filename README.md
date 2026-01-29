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
```

### Example 2: The "Rainbow Overrides"
Perfect for high-visibility cards where you want different colors for different time units.

```yaml
type: custom:long-form-countdown-card
entity: sensor.vacation_countdown
header_settings:
  title_color: "#00bcd4"
  icon_color: "#00bcd4"
unit_overrides:
  d_n_color: "#4caf50" # Green Days
  d_l_color: "#81c784"
  h_n_color: "#2196f3" # Blue Hours
  h_l_color: "#64b5f6"
  min_n_color: "#ffeb3b" # Yellow Minutes
  min_l_color: "#fff176"
```

### Example 3: The "Deadline Alert"
Shows a custom message and flashes once the timer hits zero.

```yaml
type: custom:long-form-countdown-card
entity: sensor.project_deadline
header_settings:
  name: PROJECT DUE
  bg_color: "#421212"
timer_settings:
  finished_mode: show_text
  finished_text: "TIME EXPIRED"
  flash_finished: true
global_colors:
  n_color: "#ff5252"
  l_color: "#ffffff"
```

### Example 4: The "Full Spectrum" Gradient
Demonstrates granular control by stepping through the color wheel for every time unit, from years to seconds.

```yaml
type: custom:long-form-countdown-card
entity: sensor.long_term_goal
header_settings:
  show_header: true
  name: "The Grand Spectrum"
  bg_color: "#111111"
  title_color: "#ffffff"
  icon: "mdi:palette"
  icon_color: "#ffffff"
timer_settings:
  font_size: 1.5
  short_form: false
global_colors:
  sep_color: "#444444"
unit_overrides:
  # Years: Warm Red/Orange
  y_n_color: "#FF4E50"
  y_l_color: "#FC913A"
  # Months: Gold/Yellow
  m_n_color: "#F9D423"
  m_l_color: "#EDE574"
  # Days: Green
  d_n_color: "#45B649"
  d_l_color: "#DCE35B"
  # Hours: Cyan/Teal
  h_n_color: "#0083B0"
  h_l_color: "#00B4DB"
  # Minutes: Deep Blue
  min_n_color: "#4A00E0"
  min_l_color: "#8E2DE2"
  # Seconds: Purple/Pink
  s_n_color: "#D63384"
  s_l_color: "#E83E8C"
```
