# Nick Ludwig's Personal Site

Physics particle simulation personal site with a runtime markdown blog. Particles start on a grid and converge to form "NICK LUDWIG" text and a headshot silhouette. Temperature slider controls Brownian motion intensity.

## Features

- Particle physics simulation with spring forces and damping
- Auto light/dark mode based on system preference
- Click/tap to toggle between particle view and potential view
- Responsive particle counts for mobile/tablet/desktop
- Pauses when scrolled out of view to save CPU
- Runtime markdown blog with two sections: Blog and Technical Writing

## Project Structure

```
ludwi-gg-personal-site/
├── server/                 # Express server for runtime blog
│   ├── server.js           # Main server with routes
│   ├── markdown-parser.js  # Parses H1 date + H2 title format
│   ├── templates.js        # HTML templates
│   └── package.json
├── content/                # Markdown content (served at runtime)
│   ├── blog/               # Blog posts → /blog/:slug
│   └── tech/               # Technical writing → /tech/:slug
├── src/                    # Frontend JS (particle simulation)
├── styles/                 # CSS
├── public/                 # Static assets
├── dist/                   # Vite build output
└── index.html              # Homepage template
```

## Markdown Format

Posts use a simple H1 date + H2 title format:

```markdown
# 260129

## My Post Title

Content here...
```

The date is `YYMMDD` format (e.g., `260129` = January 29, 2026).

## Development

**Full server (with blog):**
```bash
npm run build              # Build frontend assets
cd server && npm install   # Install server deps
node server.js             # Start Express server
```

Opens at http://localhost:3000

## Build

```bash
npm run build
```

Output in `dist/` directory. The Express server serves from `dist/` in production.

## Deploy

Run the Express server on your VPS:

```bash
# Build frontend
npm run build

# Start server (use PM2 or systemd for production)
cd server
npm install --production
node server.js
```

Recommended: Use nginx as a reverse proxy in front of the Express server.

## Tech Stack

- Vanilla JS + ES Modules
- Vite (frontend bundling)
- Express (runtime server)
- marked (markdown parsing)
- Canvas 2D API
- CSS Variables for theming
