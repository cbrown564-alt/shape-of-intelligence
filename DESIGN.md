# Design System

## Intent

A midnight science theatre held in the hands: cold instrument light, living color, and matter that reacts immediately to touch. The interface is an essay rather than an app shell; each viewport is one movement in a continuous composition.

## Color

The strategy is a full palette on a pure near-black ground. Cobalt belongs to machine perception, chlorophyll green to biological systems, coral to the human body, and sulfur yellow to collective or alien sensing.

```css
--bg: oklch(0.075 0 0);
--surface: oklch(0.13 0 0);
--ink: oklch(0.96 0 0);
--muted: oklch(0.73 0.018 260);
--primary: oklch(0.62 0.18 258);
--accent-life: oklch(0.78 0.18 142);
--accent-human: oklch(0.72 0.19 29);
--accent-alien: oklch(0.86 0.17 93);
```

## Typography

The display face is Archivo Black: dense, physical, and poster-like. The reading face is Manrope: open, lucid, and comfortable on iPad. Short scientific labels use the same family rather than costume-like monospace.

## Layout

Each movement occupies at least one viewport, with copy anchored to a side and the interactive field given the larger share. Text blocks stay under 60 characters per line. Insets account for iPad safe areas. Chapters alternate alignment and color pressure to create rhythm without recurring cards or section scaffolding.

## Motion

One persistent particle system reforms between chapters. Touch creates local attraction or repulsion. Entrances use clipping, blur, and short opacity transitions; they never hide the readable default. Reduced motion freezes each form and removes smooth scrolling.

## Components

- Chapter: a full-viewport narrative movement.
- Intelligence field: persistent canvas renderer and primary tactile control.
- Listen control: reads the active movement using the device voice.
- Sense selector: changes the alien-intelligence model through large touch targets.
- Progress rail: shows the reader's position without turning the essay into navigation chrome.
