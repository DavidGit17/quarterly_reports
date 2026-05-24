---
name: Systematic Integrity
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#424845'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#727974'
  outline-variant: '#c2c8c3'
  surface-tint: '#4c6459'
  primary: '#344b41'
  on-primary: '#ffffff'
  primary-container: '#4b6358'
  on-primary-container: '#c3ded0'
  inverse-primary: '#b2cdbf'
  secondary: '#555f6d'
  on-secondary: '#ffffff'
  secondary-container: '#d9e3f4'
  on-secondary-container: '#5b6573'
  tertiary: '#514436'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a5b4d'
  on-tertiary-container: '#e8d4c2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee9db'
  primary-fixed-dim: '#b2cdbf'
  on-primary-fixed: '#082017'
  on-primary-fixed-variant: '#344c41'
  secondary-fixed: '#d9e3f4'
  secondary-fixed-dim: '#bdc7d7'
  on-secondary-fixed: '#121c28'
  on-secondary-fixed-variant: '#3e4855'
  tertiary-fixed: '#f3dfcc'
  tertiary-fixed-dim: '#d6c3b1'
  on-tertiary-fixed: '#241a0e'
  on-tertiary-fixed-variant: '#524437'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  max-width: 1440px
---

## Brand & Style
The design system is engineered for high-stakes enterprise environments where data clarity and institutional trust are paramount. The aesthetic follows a **Corporate / Modern** approach with a focus on systematic integrity and silent authority. It avoids visual noise, favoring a muted, sophisticated palette that emphasizes information hierarchy over decorative flourishes.

The interface should feel architectural and grounded. It leverages heavy whitespace, precise alignment, and a "utility-first" density that allows expert users to navigate complex reporting structures without cognitive fatigue. The emotional response is one of calm reliability and professional precision.

## Colors
The palette is intentionally restrained to maintain an institutional character. 
- **Sage (#4b6358)** serves as the primary action color, used for primary buttons, active states, and key data highlights. It communicates growth within a controlled, professional framework.
- **Graphite Slate (#5a6472)** handles secondary navigation, iconography, and structural elements, providing a cool, stable foundation.
- **Warm Neutral (#766758)** is reserved for tertiary accents, such as metadata, grouping headers, or subtle callouts, adding a touch of approachability to the technical environment.
- **Neutral Backgrounds** utilize a range of cool grays (Slate-tinted) to differentiate surface levels without using harsh lines.

## Typography
The typography system reflects a balance between corporate structure and technical utility. 
- **IBM Plex Sans** is used for headings to provide a distinct, engineered feel that communicates "enterprise."
- **Inter** is the workhorse for body copy and UI controls, chosen for its exceptional legibility at small sizes.
- **JetBrains Mono** is utilized for labels, metadata, and tabular data. This monospaced inclusion ensures that numerical values in reports align perfectly, facilitating easy scanning of financial and performance metrics.

## Layout & Spacing
The layout follows a **Fixed Grid** model on desktop to ensure data visualizations remain consistent across professional monitors.
- **Grid:** A 12-column grid with a 24px gutter.
- **Rhythm:** A 4px baseline grid governs all vertical spacing.
- **Density:** Information density is "Comfortable" for dashboards but "Compact" for data tables. 
- **Breakpoints:**
  - Desktop: 1200px+ (Full 12 columns)
  - Tablet: 768px - 1199px (8 columns, margins reduce to 24px)
  - Mobile: <767px (4 columns, margins reduce to 16px, stacked cards)

## Elevation & Depth
In this design system, depth is communicated through **Tonal Layers** and **Low-contrast outlines** rather than aggressive shadows.
- **Level 0 (Background):** The base canvas in a very light gray (#f8f9fa).
- **Level 1 (Cards/Containers):** Pure white surfaces with a 1px border in a muted slate (#e2e8f0).
- **Level 2 (Dropdowns/Modals):** Subtle ambient shadows (0px 4px 12px rgba(90, 100, 114, 0.08)) to indicate temporary interaction layers.
- **Interactive States:** Hovering over a list item or card should subtly shift the background color to a faint Sage tint rather than lifting the element.

## Shapes
The shape language is "Soft" (0.25rem/4px radius) to maintain a serious, institutional tone while avoiding the harshness of sharp corners.
- **Buttons & Inputs:** 4px border radius.
- **Data Containers:** 8px border radius for large dashboard widgets.
- **Selection Indicators:** Vertical bars (4px wide) on the left side of active list items use the Sage accent color.

## Components
- **Buttons:** Primary buttons use a solid Sage (#4b6358) background with white text. Secondary buttons use a Slate (#5a6472) outline.
- **Data Tables:** High-density rows with 1px horizontal dividers. Header cells use a subtle gray background and JetBrains Mono labels.
- **Inputs:** Understated borders. Focus state is a 2px Sage glow. Labels are always positioned above the input in Inter Medium.
- **Chips/Status Tags:** Use "Quiet" backgrounds (10% opacity of the status color) with high-contrast text for status indicators (e.g., "Pending" in Warm Neutral, "Approved" in Sage).
- **Navigation:** Vertical left-hand navigation using Graphite Slate for icons and text. Active states are indicated by a Sage-colored vertical strip and a subtle background shift.
- **KPI Cards:** Feature a large IBM Plex Sans value with a JetBrains Mono label above it, clearly separated by whitespace.