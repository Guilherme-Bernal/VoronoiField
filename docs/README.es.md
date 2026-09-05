# VoronoiField (Espanol)

> Analisis tactico en AR en tiempo real (futbol)

## La idea

Una aplicacion de Realidad Aumentada que, al apuntar el celular/tablet
hacia una cancha dibujada o una maqueta sobre la mesa, superpone la
formacion tactica, las lineas de pase y las zonas de presion - en vivo
e interactivo, con el usuario moviendo a los jugadores.

## Stack

- React + Vite + TypeScript
- React Three Fiber (R3F) + drei - renderizado 3D
- MindAR - tracking de imagen (marcador AR)
- d3-delaunay - calculo del diagrama de Voronoi (zonas de presion)
- Vitest + Testing Library - pruebas automatizadas
- ESLint (con react-hooks) - calidad de codigo

## Como ejecutarlo

npm install
npm run dev

Abre http://localhost:5173

## Pruebas

npm run test
npm run test:watch
npm run test:ui

## Marcador AR

El modo AR necesita un marcador compilado - ver markers/README.md.

## Licencia

AGPL-3.0 - ver LICENSE en la raiz del repositorio. Esto significa que
cualquiera que modifique este proyecto y lo ponga disponible en red
(incluida una version web publica) debe tambien disponibilizar el
codigo fuente modificado.
