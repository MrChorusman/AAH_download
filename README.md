# AAH Download

Sitio corporativo estático para AAH Download. La interfaz propone una forma clara de presentar soluciones de descubrimiento y entrega de contenido, con una identidad propia y sin reutilizar textos, marca, código ni recursos de la web analizada como referencia.

## Ejecutar localmente

```bash
python3 -m http.server 3000 --bind 0.0.0.0 -d site
```

Abre `http://127.0.0.1:3000`. La página pública y el manifiesto de rutas se sirven desde `site/`.

## Estructura

- `site/index.html`: contenido, metadatos y estructura accesible.
- `site/styles.css`: sistema visual responsive.
- `site/app.js`: menú móvil, animaciones progresivas y preparación de borradores de contacto.
- `site/manus-routes.json`: declaración de rutas de Preview.
- `docs/reference-analysis.md`: síntesis del análisis público realizado con REA.

## Contacto

El formulario no publica ni envía mensajes automáticamente. Tras validar los campos, prepara un borrador de GitHub Issue que la persona usuaria revisa y confirma en `MrChorusman/AAH_download`. Si se habilita un correo o CRM propio, se puede sustituir ese flujo en `site/app.js` y `site/index.html`.

## Publicación

La configuración de build declara `site/` como salida estática. Antes de asociar un dominio definitivo, configura las URL canónicas y los metadatos sociales absolutos.
