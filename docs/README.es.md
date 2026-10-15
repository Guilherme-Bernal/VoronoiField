# VoronoiField

**Análisis táctico de fútbol en Realidad Aumentada.** Proyecto universitario (Facens, UPX).

[Português](../README.md) · [English](README.en.md) · [Español](README.es.md)

**Demo en línea:** https://voronoi-field.vercel.app

## El problema

Una pizarra táctica muestra dónde están los jugadores, pero no lo que esa posición *significa*: quién controla qué parte del campo, quién está libre para recibir un pase, quién está en fuera de juego. VoronoiField convierte la pizarra en una herramienta de pregunta y respuesta: **"¿y si muevo a este jugador?"** y el resultado aparece al instante.

## Qué hace la aplicación

- **Zonas de dominio (Voronoi):** pinta cada punto del campo con el color del equipo cuyo jugador está más cerca y calcula el porcentaje de campo de cada equipo.
- **Mejor pase:** para quien tiene el balón, señala el pase con la mejor combinación de línea libre, espacio del receptor, avance y distancia.
- **Fuera de juego:** dibuja la línea (penúltimo defensor o balón) y marca a quien la sobrepasa.
- **Resultado de la jugada:** compara el antes y el después y escribe la conclusión. Ejemplo: "el dominio del azul subió de 48% a 57%, el balón pasó de A11 a A8 y 2 jugadores azules quedaron en fuera de juego."
- **Escenarios listos:** posición inicial, línea alta, bloque bajo, contraataque y trampa de fuera de juego, para modificar a mano.
- **Formaciones:** 4-4-2, 4-3-3 y 3-5-2, más los modos 4 x 4 (lectura fácil) y 11 x 11 (campo completo).
- **Jugada animada, rastro y mapa de calor** del movimiento de los jugadores.
- **Compartir por enlace:** la táctica (y los pasos de la jugada) va codificada en la URL.

## Cómo usarla

| Ruta | Para qué sirve |
| --- | --- |
| `/sim` | Simulador 2D/3D en el navegador, sin cámara. El mejor lugar para explorar. |
| `/ar` | Realidad Aumentada: apunte la cámara al marcador y el campo aparece encima. |
| `/marcador` | Muestra el marcador para imprimir o abrir en otra pantalla. |

Guion corto de demostración: elija "trampa de fuera de juego" en el simulador, lea el panel **Resultado**, arrastre un jugador y vea cómo cambia la conclusión. Luego repita en AR.

**AR en el móvil:** requiere HTTPS y permiso de cámara (el enlace en línea ya cumple ambos). El marcador está en `public/markers/campo-marcador.png`.

## Cómo funciona

Las posiciones se normalizan (0 a 1) en el campo. El motor táctico (`src/tactics`) calcula el diagrama de Voronoi con `d3-delaunay`, la puntuación de los pases y la línea de fuera de juego. La escena 3D (`src/lib/ar`, Three.js) dibuja todo sobre el marcador, que se rastrea con MindAR (incluido en `src/vendor/mind-ar`).

## Limitaciones

- El modelo usa **solo posiciones**, sin velocidad ni dirección de los jugadores.
- "Dominio" es **control de espacio**, no posesión del balón.
- La "Jugada" automática está guionizada y sirve como ilustración.
- No se ha validado con datos reales de partidos.

## Tecnologías

React 19, Vite, TypeScript, Zustand, React Router, Three.js, d3-delaunay, MindAR, Vitest.

## Ejecución local

```bash
git clone https://github.com/Guilherme-Bernal/VoronoiField.git
cd VoronoiField
npm install
npm run dev
```

Abra http://localhost:5173. Otros comandos: `npm run build`, `npm run lint`, `npm run preview`.

## Pruebas

```bash
npm run test
```

## Publicación

El proyecto funciona como sitio estático (por ejemplo en Vercel). El archivo `vercel.json` redirige todas las rutas a `index.html`, para que `/sim`, `/ar` y `/marcador` funcionen al recargar la página.

## Licencia

AGPL-3.0. Vea [LICENSE](../LICENSE).
