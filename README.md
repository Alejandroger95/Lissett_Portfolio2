# Portfolio de Lissett Gayoso · versión 2

Portfolio web de eventos y producción de Lissett Gayoso, pensado para su paso al sector de eventos y diseño de espacios retail.

Esta es la **versión 2**: eventos como una tira de círculos que avanza en cámara lenta con el scroll, cursor personalizado, anillos 3D de fondo y una sección de habilidades con pruebas reales de su CV.

## Cómo verlo

No necesita instalación ni dependencias. Abre `index.html` en el navegador.

## Estructura

```
index.html      Contenido de la página
css/style.css   Estilos y adaptación a móvil, tablet y escritorio
js/script.js    Cursor, tira de eventos, anillos 3D y animaciones
img/            Fotos (ver abajo)
```

## Fotos que hay que añadir en `img/`

| Archivo | Contenido |
|---|---|
| `evento-1.jpg` | Premios Goya |
| `evento-2.jpg` | Madrid Fusión y Tast a la Rambla |
| `evento-3.jpg` | Elite Excellence |
| `evento-4.jpg` | La Suite Comunicación |
| `evento-5.jpg` | Brunch Electronik y San Isidro |
| `evento-6.jpg` | Eventos privados en Big Mamma |
| `evento-7.jpg` | Torneos y galas en Casino Atlantic City |
| `foto-lissett.jpg` | Retrato para la sección "Sobre mí" |

Conviene que todas las fotos de eventos tengan la **misma proporción** (por ejemplo 3:2), al menos 1200 px de ancho y menos de 300 KB cada una. Si falta alguna, la página muestra un recuadro de color en su lugar.

También hay que añadir el `CV_Lissett_Gayoso_2026.pdf` en la raíz, que es el que descarga el botón "Descargar CV".

## Pendiente de completar

Los textos entre `[corchetes]` en `index.html` son datos sin confirmar: fechas, funciones concretas y el nombre del máster.

## Comportamiento

- Con movimiento reducido en el sistema, o sin JavaScript, los eventos se muestran como una lista normal.
- En pantallas táctiles el cursor personalizado se oculta.
