# Long Form Countdown Card
An ultra-customizable Home Assistant dashboard card designed specifically for the **Long Form Word Countdown** integration.

## Features
- 🎨 **Granular Color Control**: Set independent colors for Years, Months, and Days.
- 🌈 **Full Styling**: Customize background, title, and primary countdown colors.
- ⚡ **Visual Editor**: Full support for the Home Assistant dashboard editor—no YAML required.
- 🚨 **Flash on Zero**: Optional animation when the countdown reaches zero.

## Installation
### via HACS (Recommended)
1. Go to **HACS** > **Frontend**.
2. Click the three dots in the top right and select **Custom repositories**.
3. Paste the URL of this repository and select **Plugin** as the category.
4. Click **Install**.

## Configuration
The card can be configured entirely through the UI. 

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `entity` | string | **Required** | The `sensor.lfwc_` entity. |
| `bg_color` | string | `var(--ha-card-background)` | Hex or CSS variable for the card background. |
| `num_color` | string | `var(--primary-color)` | The color of the numbers/time units. |
| `year_color` | string | `num_color` | Specific color for the 'Year' text. |
| `month_color` | string | `num_color` | Specific color for the 'Month' text. |
| `day_color` | string | `num_color` | Specific color for the 'Day' text. |
| `flash_zero` | boolean | `false` | Flashes the card red when finished. |

## Example YAML
```yaml
type: custom:long-form-countdown-card
entity: sensor.lfwc_avengers_doomsday
title_color: "#aaaaaa"
num_color: "#3498db"
year_color: "#e74c3c"
month_color: "#f1c40f"
day_color: "#2ecc71"
bg_color: "#1a1a1a"

