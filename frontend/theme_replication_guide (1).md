# Retro Neobrutalism Theme Guide

This document breaks down the entire design system used in the frontend of "Proudly Presents", providing you with exactly what you need to replicate this aesthetic in your next project.

## 1. Core Aesthetic Philosophy
The theme utilizes a **Neobrutalist / Retro Tech** design language characterized by:
- **High Contrast**: Harsh, dark borders (`2px solid #141413`) on almost all containers and buttons.
- **Hard Shadows**: Box shadows without blur (`4px 4px 0px 0px #141413`), creating a blocky, layered look.
- **Typography**: Heavy, uppercase headings (`font-black`) mixed with monospace fonts (`font-mono`) for technical labels, badges, and metadata.
- **Tactile Interactions**: Buttons and cards physically "press down" on hover/active states by translating their X/Y position and reducing their shadow size.
- **Textured Backgrounds**: A subtle dotted grid background to enhance the "engineering" feel.

---

## 2. Tailwind Configuration (`tailwind.config.js`)

Copy this into your new project's `tailwind.config.js`. This sets up your color palette and the specific hard shadows required for the neobrutalist look.

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: '#FDFBF7',      // Main background
          paper: '#F4F1EA',   // Cards, panels, secondary background
          ink: '#141413',     // Text, borders, shadows (near black)
          muted: '#5F5E5A',   // Secondary text
          border: '#141413',  // Same as ink
          orange: '#FF4D2D',  // Primary accent
          blue: '#1A56DB',    // Secondary accent
          mint: '#10B981',    // Success accent
          yellow: '#FBBF24',  // Warning/Highlight accent
          cream: '#FFFDF9'    // Lightest background (used in navbar)
        }
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #141413',
        'retro-sm': '2px 2px 0px 0px #141413',
        'retro-lg': '6px 6px 0px 0px #141413',
        'retro-orange': '4px 4px 0px 0px #FF4D2D',
        'retro-blue': '4px 4px 0px 0px #1A56DB'
      }
    }
  },
  plugins: [],
};
```

---

## 3. Global CSS & Background Pattern (`index.css`)

This applies the base background color, text color, selection color, default font, and the dotted grid pattern. It also styles the scrollbar to match the brutalist theme.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    /* Base text and background colors, plus custom selection color */
    @apply bg-retro-bg text-retro-ink antialiased selection:bg-retro-orange selection:text-white;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    
    /* Dotted background pattern */
    background-image: radial-gradient(#D6D1C4 1px, transparent 1px);
    background-size: 24px 24px;
  }
}

/* Custom crisp retro scrollbar */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: #F4F1EA;
  border-left: 2px solid #141413;
}
::-webkit-scrollbar-thumb {
  background: #141413;
  border: 2px solid #F4F1EA;
}
::-webkit-scrollbar-thumb:hover {
  background: #FF4D2D;
}

/* Base interactive elements */
button, input, textarea, select {
  @apply outline-none transition-all duration-150;
}
```

---

## 4. UI Component Reusability Guide

Here is how you apply these Tailwind classes to build standard UI elements in your new project.

### Buttons & CTAs
The signature "press" effect is achieved using `shadow-retro`, `hover:-translate-y-1`, and `active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm`.

```jsx
{/* Primary Button */}
<button className="border-2 border-retro-ink bg-retro-orange px-8 py-4 font-black uppercase text-white shadow-retro transition-all hover:bg-retro-ink active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm">
  Primary Action
</button>

{/* Secondary Button */}
<button className="border-2 border-retro-ink bg-white px-8 py-4 font-black uppercase text-retro-ink shadow-retro transition-all hover:bg-retro-paper active:translate-x-0.5 active:translate-y-0.5 active:shadow-retro-sm">
  Secondary Action
</button>
```

### Cards & Panels
Cards usually have a thick border, a solid shadow, and hover interactions that lift the card.

```jsx
<div className="group border-2 border-retro-ink bg-white p-8 shadow-retro transition-all hover:-translate-y-1 hover:shadow-retro-lg">
  {/* Card Content */}
  <h3 className="text-xl font-black uppercase text-retro-ink group-hover:text-retro-orange transition-colors">
    Card Title
  </h3>
  <p className="mt-3 text-sm font-medium text-retro-muted">
    This is some description text inside a neobrutalist card.
  </p>
</div>
```

### Badges & Technical Labels
Small, monospace tags are used heavily to give the app a technical/terminal feel.

```jsx
{/* Standard Technical Badge */}
<span className="border-2 border-retro-ink bg-retro-yellow px-3 py-1 font-mono text-xs font-black uppercase text-retro-ink">
  STATUS: ONLINE
</span>

{/* Inverted Badge */}
<span className="border border-retro-ink bg-retro-ink px-2.5 py-1 font-mono text-xs font-bold text-white">
  [ARCH_01]
</span>
```

### Headings & Typography
Headings should be bold (`font-black`) and almost always `uppercase`. Tracking is either tight for large headings or wide for smaller ones.

```jsx
{/* Hero Headline */}
<h1 className="text-4xl font-black tracking-tight text-retro-ink sm:text-6xl uppercase">
  Build Faster With <span className="bg-retro-ink text-white px-3 py-1 inline-block transform -rotate-1 shadow-retro">Automations</span>
</h1>

{/* Section Title */}
<h2 className="text-3xl font-black tracking-tight text-retro-ink uppercase">
  Core Services
</h2>
```

## 5. Key Layout Tricks

1. **Top Ticker Bar**: Use a tiny, monospace `border-b-2` bar at the very top of the site (above the navbar) to display "System Status" or metadata. It reinforces the engineering vibe.
2. **Dividers**: Instead of standard light grey dividers, use thick black borders `border-b-2 border-retro-ink` to separate sections.
3. **Monochrome Icons**: Keep icons (like lucide-react) mostly black, white, or utilizing the single accent color of their parent container.
