---
name: Hikvision NVR Web Downloader
description: A professional web interface for searching and downloading recordings from Hikvision NVR systems, featuring a clean corporate aesthetic with high-contrast data tables and utilitarian form controls.
type: design-system
version: 1.0.0

# Color Palette

colors:
  primary:
    main: "#1E3A5F"
    light: "#2563EB"
    dark: "#1D4ED8"
    contrastText: "#FFFFFF"
  secondary:
    main: "#059669"
    light: "#10B981"
    dark: "#047857"
    contrastText: "#FFFFFF"
  error:
    main: "#DC2626"
    light: "#EF4444"
    dark: "#B91C1C"
  warning:
    main: "#D97706"
    light: "#F59E0B"
    dark: "#B45309"
  success:
    main: "#059669"
    light: "#10B981"
    dark: "#047857"
  background:
    default: "#F8FAFC"
    paper: "#FFFFFF"
  text:
    primary: "#0F172A"
    secondary: "#475569"
    disabled: "#94A3B8"
  divider: "#E2E8F0"
  action:
    hover: "rgba(30, 58, 95, 0.04)"
    selected: "rgba(30, 58, 95, 0.08)"
    disabled: "rgba(15, 23, 42, 0.26)"
    disabledBackground: "rgba(15, 23, 42, 0.12)"
  scrollbar:
    thumb: "#CBD5E1"
    track: "#F1F5F9"
  border:
    default: "#CBD5E1"
    hover: "#94A3B8"
    focused: "#1E3A5F"

# Typography

typography:
  fontFamilies:
    display: '"Fira Code", monospace'
    body: '"Fira Sans", "Inter", system-ui, -apple-system, sans-serif'
  scales:
    h1:
      fontFamily: '"Fira Code", monospace'
      fontWeight: 700
      fontSize: "2.5rem"
      letterSpacing: "-0.02em"
    h2:
      fontFamily: '"Fira Code", monospace'
      fontWeight: 600
      fontSize: "2rem"
      letterSpacing: "-0.01em"
    h3:
      fontFamily: '"Fira Code", monospace'
      fontWeight: 600
      fontSize: "1.5rem"
    h4:
      fontFamily: '"Fira Code", monospace'
      fontWeight: 500
      fontSize: "1.25rem"
    h5:
      fontFamily: '"Fira Sans", sans-serif'
      fontWeight: 600
      fontSize: "1.125rem"
    h6:
      fontFamily: '"Fira Sans", sans-serif'
      fontWeight: 600
      fontSize: "1rem"
    body1:
      fontSize: "0.9375rem"
      lineHeight: 1.6
    body2:
      fontSize: "0.875rem"
      lineHeight: 1.5
    caption:
      fontSize: "0.75rem"
      color: "#64748B"

# Spacing

spacing:
  baseUnit: 8
  borderRadius:
    default: 8
    button: 6
    chip: 6
    scrollbar: 4
    progressBar: 4
    iconButton: 8

# Elevation & Shadows

shadows:
  buttonHover: "0 4px 12px rgba(30, 58, 95, 0.25)"
  focusOutline: "0 0 0 2px #1E3A5F"

# Motion

motion:
  default:
    duration: 150
    easing: "ease-out"
  transitions:
    default: "all 150ms ease-out"
    borderColor: "border-color 150ms ease-out"

# Component Tokens

components:
  button:
    borderRadius: 6
    padding: "8px 16px"
    focusOutline: "2px solid #1E3A5F"
    focusOffset: "2px"
    hoverShadow: "0 4px 12px rgba(30, 58, 95, 0.25)"
    outlinedBorder: "#CBD5E1"
    outlinedHoverBorder: "#1E3A5F"
    outlinedHoverBg: "rgba(30, 58, 95, 0.04)"
  textField:
    borderColor: "#CBD5E1"
    hoverBorderColor: "#94A3B8"
    focusedBorderColor: "#1E3A5F"
    focusedBorderWidth: "2px"
  paper:
    backgroundColor: "#FFFFFF"
    border: "1px solid #E2E8F0"
    backgroundImage: none
  tableCell:
    borderColor: "#E2E8F0"
    headBackground: "#F8FAFC"
    headFontWeight: 600
    headColor: "#0F172A"
    rowHover: "rgba(30, 58, 95, 0.02)"
    rowSelected: "rgba(30, 58, 95, 0.04)"
    rowSelectedHover: "rgba(30, 58, 95, 0.06)"
  linearProgress:
    borderRadius: 4
    backgroundColor: "#E2E8F0"
    height: 6
  chip:
    borderRadius: 6
  alert:
    borderRadius: 8
    error:
      backgroundColor: "rgba(220, 38, 38, 0.08)"
      color: "#B91C1C"
    warning:
      backgroundColor: "rgba(217, 119, 6, 0.08)"
      color: "#B45309"
    success:
      backgroundColor: "rgba(5, 150, 105, 0.08)"
      color: "#047857"
    info:
      backgroundColor: "rgba(30, 58, 95, 0.08)"
      color: "#1E3A5F"
  dialog:
    backgroundColor: "#FFFFFF"
    border: "1px solid #E2E8F0"
  autocomplete:
    paperBackgroundColor: "#FFFFFF"
    paperBorder: "1px solid #E2E8F0"
  tooltip:
    backgroundColor: "#0F172A"
    color: "#F8FAFC"
    fontSize: "0.75rem"
    border: "1px solid #334155"
  iconButton:
    borderRadius: 8
    transition: "all 150ms ease-out"
    focusOutline: "2px solid #1E3A5F"
    focusOffset: "2px"
  checkbox:
    uncheckedColor: "#94A3B8"
    checkedColor: "#1E3A5F"

# Selection

selection:
  backgroundColor: "rgba(30, 58, 95, 0.15)"

---

# Hikvision NVR Web Downloader — Design Language

## Visual Identity

A utilitarian, professional web interface built for surveillance operators and IT administrators. The aesthetic draws from industrial control panels and enterprise dashboards — high information density, clear visual hierarchy, and zero decorative flourishes. The design prioritizes scannability and accuracy over beauty, because operators may be scanning footage at 2 AM under pressure.

## Color

The palette is anchored by **deep navy (#1E3A5F)** as the primary action color — authoritative, visible against light backgrounds, and reminiscent of Hikvision's brand identity. **Emerald green (#059669)** signals success states, reflecting the "confirmed/operational" status common in surveillance contexts. **Amber (#D97706)** provides warning states that demand attention without the urgency of red.

The near-white **#F8FAFC** background reduces eye strain during extended sessions, while the **#0F172A** text ensures maximum legibility. All interactive elements maintain strong contrast ratios — accessibility is a requirement, not an afterthought.

## Typography

**Fira Code** anchors headings (h1–h4), lending a technical, developer-tool aesthetic that signals "this is a precision instrument." Monospace fonts reinforce the data-centric nature of the interface — timestamps, file sizes, and IP addresses should look like code, not prose.

**Fira Sans** handles body text and UI labels, offering a clean geometric sans that remains readable at small sizes. The font pairing creates a subtle hierarchy: headings feel like a terminal; body text feels like a modern web app.

## Spatial System

An **8px base unit** governs all spacing, maintaining rhythm across padding, margins, and gaps. Border radii are deliberately small (6–8px) — rounded corners feel too casual for a security application. The 90% max-width container balances information density with readability on large monitors.

## Motion Philosophy

Transitions are short (150ms) and functional — they confirm interactions without interrupting workflow. The `ease-out` curve provides responsive feedback where it matters. No decorative animations; no entrance effects that would delay task completion.

## Component Strategy

**Buttons**: Minimal elevation with subtle hover shadows. Outlined buttons use light borders that darken on interaction, avoiding the visual weight of filled secondary actions.

**Tables**: The primary data display mechanism. Zebra striping is absent — instead, subtle row hovers and selection states keep the interface clean while maintaining orientation during rapid scanning.

**Form Controls**: Standard input fields with a clear focus ring (2px navy border). Text fields use MUI's outlined variant, which provides better visual hierarchy than filled variants for this use case.

**Alerts**: Soft tinted backgrounds (8% opacity color washes) keep alerts visible but not distracting. Border-radius matches the overall system (8px).

## Focus & Accessibility

All interactive elements have visible focus indicators — a 2px navy outline with 2px offset. This is critical for keyboard navigation during long operation sessions. Color is never the sole indicator of state; error/warning states use both color AND icons/additional text.

## Icon Philosophy

The interface uses Material Icons (via MUI), keeping with a standardized, professional icon vocabulary. Icons are functional — indicating state, reinforcing action labels, or highlighting status — not decorative.

---

*Last updated: 2026-04-27*
