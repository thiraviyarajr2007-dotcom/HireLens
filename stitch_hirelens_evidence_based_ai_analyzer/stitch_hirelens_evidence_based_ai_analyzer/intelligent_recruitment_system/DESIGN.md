---
name: Intelligent Recruitment System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#00687a'
  on-secondary: '#ffffff'
  secondary-container: '#57dffe'
  on-secondary-container: '#006172'
  tertiary: '#0051b1'
  on-tertiary: '#ffffff'
  tertiary-container: '#0f69dc'
  on-tertiary-container: '#edf0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container-max: 1440px
  sidebar-width: 280px
---

## Brand & Style
The design system is anchored in a **Corporate / Modern** aesthetic, specifically tailored for high-stakes recruitment and AI-driven intelligence. The personality is authoritative yet approachable, emphasizing "Intelligence through Clarity." 

The visual narrative uses a "Deep Intelligence" motif—utilizing high-contrast transitions between a deep navy navigation environment and a bright, hyper-clean workspace. This contrast creates a mental shift between "The System" (Nav) and "The Analysis" (Content). The style avoids unnecessary decoration, relying on precision, generous whitespace, and purposeful accents of electric blue and cyan to highlight AI-driven insights.

## Colors
The palette is designed for a multi-layered dashboard experience. 

- **Primary Interface:** The main application background uses a very light slate (`#F8FAFC`) to minimize eye strain while maintaining a "fresh" feel. Main content containers are pure white.
- **The Intelligence Core:** The sidebar and global navigation use a Deep Navy (`#0B1220`), signifying stability and the "black box" of AI processing.
- **Action & Accent:** Primary Blue (`#2563EB`) is reserved for critical actions. Cyan (`#06B6D4`) is used specifically for AI-generated highlights, scores, and data visualizations to differentiate human-input data from machine-generated insights.
- **Semantic Feedback:** Status colors are high-chroma but balanced with generous white space to ensure they don't overwhelm the professional tone.

## Typography
The system employs a dual-font strategy:
- **Geist** is used for headlines, labels, and technical data. Its precise, geometric nature reflects the "AI" and "accuracy" aspects of the brand.
- **Inter** is used for all body text and long-form candidate descriptions to ensure maximum readability and a neutral, professional tone.

All labels and status badges should use Geist with a slight letter spacing increase to emphasize the "data-point" nature of the information.

## Layout & Spacing
The layout follows a **Fluid Grid** model with fixed sidebar constraints. 

- **Sidebar Navigation:** Always fixed at `280px`. It uses the Deep Navy palette.
- **Main Content:** A fluid area with a maximum readable width of `1440px`. 
- **Rhythm:** An 8px linear scale is used for all spacing. 
- **Margins:** 32px (`xl`) on desktop, 16px (`md`) on mobile.
- **Data Density:** While the overall brand is "generous," data tables should utilize "Compact" spacing (8px internal cell padding) to allow for high-information density without sacrificing the premium feel.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Ambient Shadows** rather than heavy borders.

- **Level 0 (Floor):** Background (`#F8FAFC`). No shadow.
- **Level 1 (Cards):** Main content cards. 1px border (`#E2E8F0`) with a very soft, diffused shadow: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`.
- **Level 2 (Modals/Popovers):** Higher elevation. No border, but a deeper shadow to suggest floating: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`.
- **Sidebar Depth:** The sidebar uses a zero-shadow, solid-fill approach to feel like a structural foundation of the window.

## Shapes
The design system utilizes a tiered rounding strategy to balance "modern friendliness" with "professional precision."

- **Base Elements:** Buttons, inputs, and small chips use `rounded-lg` (0.5rem / 8px).
- **Structural Elements:** Evidence cards and main dashboard containers use `rounded-2xl` (1rem / 16px).
- **Interactive Indicators:** Radio buttons and circular scores remain fully circular.
- **Selection States:** Highlighted items in lists use the base 8px rounding.

## Components

### Sidebar & Navigation
The sidebar should be treated as a dark workspace. Navigation links use a transparent background in their default state, transitioning to a subtle white-alpha (10% opacity) on hover, and a solid Electric Blue (`#3B82F6`) left-border accent when active.

### Status Badges (FOUND, NOT FOUND, AMBIGUOUS)
Badges are uppercase and use the `label-sm` Geist font.
- **Found:** Green background (10% opacity) with solid Green text.
- **Not Found:** Red background (10% opacity) with solid Red text.
- **Ambiguous:** Amber background (10% opacity) with solid Amber text.
- All badges have a 1px border matching the text color at 20% opacity.

### Evidence Cards
These are the core of the recruitment analysis. They must use the `rounded-2xl` shape with a Level 1 shadow. Header sections of cards should have a subtle bottom border (`#E2E8F0`) to separate meta-data from the main analysis content.

### Progress Bars & Scores
Circular scores (e.g., Match Percentage) should use a thick stroke with the Cyan (`#06B6D4`) accent for the value and a light slate (`#F1F5F9`) for the track. Center text should be Geist Bold.

### Professional Upload Zones
Use a dashed border (`#CBD5E1`) with a 2px stroke. The background should be a subtle gradient from `#FFFFFF` to `#F8FAFC`. Icons within the upload zone should be monochrome slate, turning Primary Blue on drag-over.

### Data Tables
Tables should be "borderless" between columns, using only subtle horizontal lines (`#F1F5F9`). The header row should use `label-md` Geist in Muted Slate (`#64748B`).