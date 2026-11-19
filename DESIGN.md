---
name: Blob Sphere
description: A dark, glass-instrument interface that frames one glowing 3D blob and recedes behind it.
colors:
  stage-night: "#0b0b10"
  ink: "#f2f2f7"
  ink-soft: "rgb(255 255 255 / 0.7)"
  glass-fill: "rgb(255 255 255 / 0.06)"
  glass-fill-hover: "rgb(255 255 255 / 0.16)"
  glass-panel: "rgb(14 14 20 / 0.6)"
  glass-panel-deep: "rgb(14 14 20 / 0.78)"
  hairline: "rgb(255 255 255 / 0.2)"
  signal-ice: "#9fd4ff"
  breath-inhale: "#bfe3ff"
  breath-hold: "#ffe3a8"
  breath-exhale: "#c9b8ff"
  signal-live: "#8ff0bf"
  cat-organic: "#ff9bb0"
  cat-mineral: "#9fd0ff"
  cat-light: "#ffd36b"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.6rem, 4vw, 2.4rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 500
    letterSpacing: "0.14em"
  brand:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(0.85rem, 1.6vw, 1.05rem)"
    fontWeight: 500
    letterSpacing: "0.5em"
rounded:
  panel: "12px"
  item: "8px"
  pill: "999px"
  round: "50%"
spacing:
  xs: "0.4rem"
  sm: "0.6rem"
  md: "1rem"
  lg: "1.5rem"
components:
  pill-button:
    backgroundColor: "{colors.glass-panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1rem"
  pill-button-hover:
    backgroundColor: "{colors.glass-fill-hover}"
  arrow-button:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.round}"
    size: "3rem"
  panel:
    backgroundColor: "{colors.glass-panel-deep}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0.9rem"
---

# Design System: Blob Sphere

## Overview

**Creative North Star: "The Glass Instrument Panel"**

The page is a dark stage with one lit subject, the blob. Everything else is instrument glass floating over it: translucent, blurred, hairline-edged controls that you can read through. The stage color is not fixed. Each material sets its own near-black background (`--bg`, default #0b0b10) and the page fades between them over 0.8 s, so the room tints to match the material on show.

The interface is centered and sparse. Brand name on top, a material title and one-line description below the blob, pagination dots at the bottom, small pill controls stacked at top right. Text is off-white (#f2f2f7), never pure white and never on a solid card. The blob always out-ranks the chrome.

Confirmed direction for controls: **tactile and confident** (press feedback, brighter hover borders) and **soft glows** tinted by the active material as the depth language. Both are built: the `--glow` color comes from the material (`accent`, else derived from its background in `src/core/glow.ts`) and crossfades with the stage.

**Key Characteristics:**
- Dark, per-material tinted stage; the canvas is transparent and the page color shows through.
- Translucent glass surfaces with backdrop blur and a 1px white hairline.
- One cool accent (ice blue #9fd4ff) for active and selected states; breathing phases and category dots carry the only other hues.
- System sans only; hierarchy comes from size, weight and wide letter-spacing, not from font choice.
- Chill mode removes everything except the blob and the breathing guide.

## Colors

A near-black stage, off-white ink, translucent white glass, and one ice-blue signal. Everything colorful is the blob, not the UI.

### Primary
- **Ice Signal** (#9fd4ff): Active and selected states: the Mix slider accent, the selected material in the Mix list, the "mixing" dot, number values in the settings panel. The only accent used for interaction.

### Secondary
- **Breath Inhale / Hold / Exhale** (#bfe3ff / #ffe3a8 / #c9b8ff): The progress arc of the Chill guide, changing per 4-7-8 phase. Used nowhere else.
- **Live Green** (#8ff0bf): Camera/hand tracking is active and a hand is seen.

### Tertiary
- **Category dots** (organic #ff9bb0, mineral #9fd0ff, light #ffd36b): The small dot inside the material category chip. Never used for text or fills.

### Neutral
- **Stage Night** (#0b0b10): Default page background; overridden per material by `--bg` (for example #040712 aurora, #110605 lava, #16110a gold).
- **Ink** (#f2f2f7): All text and icons. Secondary text is the same ink at 0.55 to 0.7 opacity.
- **Glass Fill** (white at 0.06 to 0.16): Resting and hover fills for arrows and the camera pill.
- **Glass Panel** (rgb 14 14 20 at 0.6 to 0.78): Pill buttons and popovers, always with backdrop blur.
- **Hairline** (white at 0.1 to 0.2): The 1px border of every glass surface.

### Named Rules
**The Stage Follows The Material Rule.** The page background is always the current material's `background`, never a fixed UI color. UI surfaces are translucent so they inherit it.
**The One Signal Rule.** Ice blue is the only interactive accent. Do not introduce a second one; the other hues belong to the breathing guide and category dots.

## Typography

**Display Font:** system UI sans (`ui-sans-serif, system-ui, -apple-system, sans-serif`)
**Body Font:** the same stack
**Label Font:** the same stack

**Character:** Neutral and native, so it disappears next to the shaders. Personality comes from tracking: tiny uppercase labels and the brand name are widely spaced, the material title is tight.

### Hierarchy
- **Brand** (500, clamp(0.85rem to 1.05rem), 0.5em tracking, uppercase): "Morph" (the on-screen brand name) at top center, 85% white, centered optically with matching left padding.
- **Display** (600, clamp(1.6rem to 2.4rem), -0.01em): The material name under the blob.
- **Body** (400, 0.95rem, 1.5 line height, 70% opacity): The one-line material description.
- **Label** (500, 0.7rem, 0.14em, uppercase): Category chip, Mix panel title.
- **Control** (500, 0.8rem, 0.04em): Text on pill buttons (Mix, Chill, camera).
- **Chill phase** (500, 1.5rem, 0.32em, uppercase) and **count** (300, 1.9rem, tabular numbers): The breathing guide.

### Named Rules
**The Tracking Is The Voice Rule.** Wide letter-spacing on small caps labels and the brand; tight spacing on the large title. Do not add a display typeface.

## Layout

A fixed full-viewport stack over the canvas, respecting safe-area insets. Vertical rhythm is set in viewport units: brand at 4vh from the top, description block 12vh from the bottom, dots 5vh from the bottom. Prev/next arrows sit at mid-height on the left and right edges (1.5rem inset). Pill controls stack top-right: camera, then Mix, then Chill, each about 2.9rem apart. The settings panel (lil-gui, 260px wide) is the only dense surface.

Mobile (max-width 640px): brand moves to top left, arrows drop to the bottom corners beside the dots, the info block widens to nearly full width, and the title becomes 1.7rem. Short landscape screens shrink the info block and the Chill ring. All motion respects `prefers-reduced-motion`.

## Elevation & Depth

Depth is conveyed by transparency and blur, not by shadows. Controls are frosted glass (`backdrop-filter: blur(8px to 14px)`) with a 1px hairline; the popover panel is darker (0.78 alpha) to sit above the pills. The structural depth cue is a soft, offset glow tinted by the active material: `--glow-soft` at rest on pills and arrows, `--glow-strong` on hover, the open Mix panel and the active dot. The glow is opt-in for performance (`data-glow` on `<html>`, "UI glow" in Effects settings, off by default on weak, touch or reduced-motion devices) and stays static: no animated custom property and no box-shadow transitions. There are no black drop shadows on the main UI.

### Named Rules
**The Glass, Not Card Rule.** Surfaces are translucent with blur and a hairline. Never opaque cards, never hard drop shadows.
**The Glow Is Tinted Rule.** Any glow takes its hue from the current material, never a fixed brand color.

## Shapes

Round and capsule. Buttons and chips are full pills (999px); arrows are perfect circles (3rem); popover panels use 12px corners and their list items 8px. Pagination dots are 0.55rem circles; the active dot stretches to a 1.6rem capsule. The Chill guide is a thin ring (2.4px stroke, round caps). Every border is 1px at low-alpha white.

## Components

### Pill buttons (camera, Mix, Chill)
- **Shape:** full pill (999px), padding 0.55rem 1rem.
- **Default:** glass panel fill (rgb 14 14 20 / 0.6), blur 14px, 1px hairline (white 0.18), ink text, 0.8rem weight 500.
- **Hover / pressed:** fill rises to white 0.16. Pressed Chill and the open Mix show the raised fill; pressed Chill also tints its border ice blue.
- **Focus:** 2px white outline, 3px offset.

### Arrows (prev/next)
- **Shape:** 3rem circle, hairline border, white 0.06 fill, blur 8px.
- **Hover:** fill to 0.16. On mobile they dock to the bottom corners.

### Pagination dots
- 0.55rem circles at white 0.3; the active dot is a 1.6rem white capsule. Each has an invisible enlarged hit area for touch.

### Category chip
- Pill with hairline border, white 0.06 fill, 0.7rem uppercase label and a 0.4rem colored dot (organic, mineral, or light).

### Mix panel (popover)
- 15rem wide, 12px corners, deep glass (0.78 alpha), 0.9rem padding. A list of materials (selected = ice border and ice 0.14 fill, disabled = 0.3 opacity) and an ice-blue range slider with a tabular readout.

### Settings panel (lil-gui)
- Themed with the same glass: 0.72 alpha fill, ice-blue numbers, 11px type, 260px wide (220px on small screens).

### Chill guide (signature)
- A 5.2rem ring with a progress arc that changes color per breathing phase (inhale, hold, exhale), a large tabular countdown in the center, the phase word in wide-tracked caps beneath it, and a muted hint line. In Chill mode all other UI fades to 0 opacity over 0.9 s.

## Do's and Don'ts

### Do:
- **Do** let the page background follow the active material's `background`, and keep UI surfaces translucent so they inherit it.
- **Do** use ice blue (#9fd4ff) as the single interaction accent.
- **Do** build glass surfaces with blur (8 to 14px), a 1px white hairline at 0.1 to 0.2 alpha, and ink (#f2f2f7) text.
- **Do** keep full pills for buttons and 12px for panels; give every control a 2px white focus-visible outline.
- **Do** keep the UI quiet enough that the blob stays the brightest thing on screen, and fade everything in Chill mode.
- **Do** respect `prefers-reduced-motion` and safe-area insets on every new element.

### Don't:
- **Don't** put a solid opaque card or a hard drop shadow behind controls.
- **Don't** add a second accent color or a decorative typeface.
- **Don't** use pure white text on large areas; keep ink at #f2f2f7 with opacity for secondary text.
- **Don't** hard-code a page background; it comes from the material.
- **Don't** let any control grow large enough to compete with the blob.
