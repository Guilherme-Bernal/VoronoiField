# VoronoiField

**Football tactical analysis in Augmented Reality.** University project (Facens, UPX).

[Português](../README.md) · [English](README.en.md) · [Español](README.es.md)

**Live demo:** https://voronoi-field.vercel.app

## The problem

A tactics board shows where players stand, but not what that positioning *means*: who controls which part of the pitch, who is free to receive a pass, who is offside. VoronoiField turns the board into a question-and-answer tool: **"what if I move this player?"** and the result shows up instantly.

## What the app does

- **Control zones (Voronoi):** colors every point of the pitch with the team whose player is closest, and computes each team's share of the pitch.
- **Best pass:** for the ball carrier, picks the pass with the best mix of open lane, receiver space, forward gain and distance.
- **Offside:** draws the line (second-last defender or the ball) and flags who is beyond it.
- **Play result:** compares before and after and writes the conclusion. Example: "blue's control rose from 48% to 57%, the ball went from A11 to A8 and 2 blue players ended up offside."
- **Ready-made scenarios:** starting position, high line, low block, counter-attack and offside trap, for you to tweak by hand.
- **Formations:** 4-4-2, 4-3-3 and 3-5-2, plus 4 x 4 (easy to read) and 11 x 11 (full pitch) modes.
- **Animated play, trails and heat map** of player movement.
- **Share by link:** the tactic (and the play steps) is encoded in the URL.

## How to use

| Route | What it is for |
| --- | --- |
| `/sim` | 2D/3D simulator in the browser, no camera needed. Best place to explore. |
| `/ar` | Augmented Reality: point the camera at the marker and the pitch appears on top of it. |
| `/marcador` | Shows the marker to print or open on another screen. |

Short demo script: pick "offside trap" in the simulator, read the **Result** panel, drag a player and watch the conclusion change. Then repeat in AR.

**AR on a phone:** needs HTTPS and camera permission (the live link already has both). The marker is at `public/markers/campo-marcador.png`.

## How it works

Positions are normalized (0 to 1) on the pitch. The tactics engine (`src/tactics`) computes the Voronoi diagram with `d3-delaunay`, the pass scoring and the offside line. The 3D scene (`src/lib/ar`, Three.js) draws everything over the marker, which is tracked by MindAR (bundled in `src/vendor/mind-ar`).

## Limitations

- The model uses **positions only**, with no player speed or direction.
- "Control" means **space control**, not ball possession.
- The automatic "Play" is scripted and meant as an illustration.
- It has not been validated against real match data.

## Tech stack

React 19, Vite, TypeScript, Zustand, React Router, Three.js, d3-delaunay, MindAR, Vitest.

## Running locally

```bash
git clone https://github.com/Guilherme-Bernal/VoronoiField.git
cd VoronoiField
npm install
npm run dev
```

Open http://localhost:5173. Other commands: `npm run build`, `npm run lint`, `npm run preview`.

## Tests

```bash
npm run test
```

## Deployment

The project runs as a static site (for example on Vercel). `vercel.json` rewrites every route to `index.html`, so `/sim`, `/ar` and `/marcador` keep working on page reload.

## License

AGPL-3.0. See [LICENSE](../LICENSE).
