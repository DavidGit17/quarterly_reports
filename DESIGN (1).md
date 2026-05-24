---
name: Systematic Integrity
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#44474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#515f74'
  primary: '#1d2b3e'
  on-primary: '#ffffff'
  primary-container: '#334155'
  on-primary-container: '#9eadc5'
  inverse-primary: '#b9c7e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#38270a'
  on-tertiary: '#ffffff'
  tertiary-container: '#503d1e'
  on-tertiary-container: '#c3a881'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3fd'
  primary-fixed-dim: '#b9c7e0'
  on-primary-fixed: '#0d1c2f'
  on-primary-fixed-variant: '#3a485c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb3'
  tertiary-fixed-dim: '#dfc299'
  on-tertiary-fixed: '#281901'
  on-tertiary-fixed-variant: '#574424'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
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
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  2xl: 3rem
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
---

## Brand & Style

This design system is engineered for high-density information environments where clarity and utility are paramount. The aesthetic is rooted in **Modern Minimalism** with a focus on institutional reliability. It prioritizes content over container, stripping away non-functional ornamentation to reduce cognitive load for power users managing complex reports.

The target audience consists of data analysts and administrative directors who require a tool that feels predictable, precise, and professional. The emotional response is one of calm control and efficiency. The interface utilizes a "flat-plus" approach: predominantly 2D surfaces with depth indicated through subtle tonal shifts rather than shadows.

## Colors

The palette is strictly monochromatic to ensure that data visualizations and status indicators remain the focal point. 

- **Primary (#334155):** Used for primary actions, active navigation states, and key headers. This "Slate-700" provides a high-contrast, authoritative anchor.
- **Secondary (#64748b):** Used for supporting text, icons, and secondary metadata.
- **Neutral/Background (#f8fafc):** A cool, crisp gray used for application backgrounds to provide a soft contrast against white workspace cards.
- **Surface (#ffffff):** Reserved for the "work area"—cards, input fields, and modals.
- **Border (#e2e8f0):** The primary tool for structural definition. All containers use this subtle slate-200 border to maintain organized segments without visual clutter.

## Typography

The design system utilizes **Inter** exclusively for its exceptional legibility in data-heavy interfaces. The typographic scale is built on a modular 4px baseline.

- **Headlines:** Use Semi-Bold (600) weights with slightly tightened letter-spacing to create a strong visual anchor for page titles.
- **Body Text:** Standardized at 14px for maximum information density while maintaining readability.
- **Labels:** Uppercase styles are reserved for small labels and table headers to provide a distinct stylistic shift from data entries.
- **Numbers:** Ensure `font-variant-numeric: tabular-nums` is applied to all report tables and data points to ensure vertical alignment of digits.

## Layout & Spacing

The design system employs a **Fixed-Fluid Hybrid** grid. The side navigation is fixed at 260px, while the main content area spans the remaining width with a maximum container cap of 1440px to prevent excessive line lengths in reports.

- **The 8px Rule:** All spacing between elements must be a multiple of 8px (or 4px for tight components like labels/inputs).
- **Margins:** 40px (2.5rem) horizontal padding for desktop screens provides a spacious, high-end feel. 16px (1rem) for mobile.
- **Grid:** A 12-column grid is used for dashboard layouts, typically organized into spans of 3, 4, 6, or 12.
- **Density:** Provide a "Compact" mode for data-heavy tables where vertical padding is reduced from 12px to 8px.

## Elevation & Depth

In alignment with the minimalist narrative, this system avoids traditional drop shadows. Depth is communicated through **Tonal Layering** and **Subtle Outlines**.

- **Level 0 (Background):** Slate-50 (#f8fafc). The foundation of the app.
- **Level 1 (Surface):** White (#ffffff). Used for cards, tables, and sidebars. Each surface is defined by a 1px solid border in Slate-200.
- **Level 2 (Interaction):** When an item is hovered (like a list row), the background shifts to Slate-100. No shadow is added.
- **Modals/Popovers:** These use a very soft, diffused shadow (0px 10px 15px -3px rgba(0, 0, 0, 0.05)) to distinguish them from the base plane, ensuring they appear "lifted" but not "floating."

## Shapes

The shape language is **Soft and Structural**. 

- **Corners:** A standard 4px (0.25rem) radius is applied to buttons, input fields, and cards. This provides a modern touch without appearing overly casual or "bubbly."
- **Internal Elements:** Checkboxes and radio buttons follow the same 4px or circular logic respectively. 
- **Icons:** Use a 2px stroke weight with slightly rounded caps to match the typography.

## Components

- **Buttons:**
  - *Primary:* Solid Slate-700 fill with White text. No gradients.
  - *Secondary:* White fill with Slate-200 border and Slate-700 text.
  - *States:* Hover state for Primary is a slightly darker Slate-800.
- **Cards:** White background, 1px Slate-200 border, 4px corner radius. No shadow. Card headers should have a 1px bottom border to separate titles from content.
- **Input Fields:** 1px Slate-200 border, 8px vertical padding. Focus state: 1px Slate-700 border with a 2px Slate-100 outer glow (not a shadow).
- **Data Tables:**
  - Header: Slate-50 background, 12px padding, uppercase 11px Semi-Bold text.
  - Rows: 1px bottom border (Slate-100). Hover state: Slate-50.
- **Chips/Status Tags:** Subtle, low-saturation backgrounds (e.g., light green for 'Complete', light amber for 'Pending') with dark text of the same hue.
- **Navigation:** Vertical sidebar with icons on the left. Active state indicated by a 2px solid Slate-700 vertical bar on the left edge of the menu item and a Slate-50 background.