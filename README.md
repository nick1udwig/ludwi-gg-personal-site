# Nick Ludwig Personal Site

Physics particle simulation personal site. Particles start on a grid and converge to form "NICK LUDWIG" text and a headshot silhouette. Temperature slider controls Brownian motion intensity.

## Features

- Particle physics simulation with spring forces and damping
- Auto light/dark mode based on system preference
- Click/tap to toggle between particle view and potential view
- Responsive particle counts for mobile/tablet/desktop
- Pauses when scrolled out of view to save CPU

## Development

```bash
npm install
npm run dev
```

Opens at http://localhost:3000

## Build

```bash
npm run build
```

Output in `dist/` directory.

## Deploy

Static site - deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc).

```bash
npm run build
# Upload dist/ to your host
```

## Tech Stack

- Vanilla JS + ES Modules
- Vite (build tool)
- Canvas 2D API
- CSS Variables for theming
