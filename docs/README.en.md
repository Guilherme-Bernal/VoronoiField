# VoronoiField (English)

> Real-time AR tactical analysis for football/soccer

## The idea

An Augmented Reality app that, when you point a phone/tablet at a
drawn pitch or a tabletop mockup, overlays tactical formation, passing
lines and pressure zones - live and interactive, with the user moving
the players themselves.

## Stack

- React + Vite + TypeScript
- React Three Fiber (R3F) + drei - 3D rendering
- MindAR - image tracking (AR marker)
- d3-delaunay - Voronoi diagram computation (pressure zones)
- Vitest + Testing Library - automated tests
- ESLint (with react-hooks) - code quality

## Running it

npm install
npm run dev

Open http://localhost:5173

## Tests

npm run test
npm run test:watch
npm run test:ui

## AR marker

AR mode needs a compiled marker - see markers/README.md.

## License

AGPL-3.0 - see LICENSE at the repo root. This means anyone who
modifies this project and makes it available over a network (including
a public web version) must also make the modified source code
available.
