# AAH Download

Herramienta personal de dos pasos separados: permite buscar en YouTube y abrir sus resultados oficiales; además, convierte archivos locales de audio o vídeo a MP3 cuando la persona usuaria tiene autorización para utilizarlos. No descarga ni extrae medios de YouTube.

## Ejecutar localmente

Requiere Node.js 22.12 o posterior y pnpm 11.25.0:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre `http://localhost:3000`. Para compilar el sitio estático ejecuta `pnpm build`; Vite escribe `dist/`.

## Conversión

La conversión usa FFmpeg.wasm en el navegador. Los archivos seleccionados no se envían al servidor. La primera conversión descarga el núcleo WebAssembly desde jsDelivr (aprox. 31 MB). El límite de entrada es 100 MB; la velocidad y la memoria disponible dependen del navegador y el dispositivo. El resultado es MP3 a 320 kb/s CBR con el ajuste de LAME de mayor calidad disponible. Una conversión con pérdida no puede mejorar la calidad de la fuente. El formulario pide confirmar que se tiene autorización sobre el archivo.

Al enviar una búsqueda de texto se abre inmediatamente la página oficial `youtube.com/results` en otra pestaña; al pegar una URL de vídeo, se abre el vídeo en YouTube. Si el navegador bloquea la pestaña, queda visible un enlace alternativo. No se consulta ni extrae el flujo multimedia, y la búsqueda no necesita una clave API.

## Archivos

`site/index.html`, `site/styles.css` y `site/app.js` contienen la interfaz. `site/public/manus-routes.json` declara la ruta `/`. `vite.config.js` define el servidor de desarrollo y el build. `docs/implementation-notes.md` registra fuentes y decisiones del conversor.
