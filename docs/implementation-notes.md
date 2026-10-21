# Notas técnicas: conversión local a MP3

La integración usará FFmpeg.wasm 0.12.x y el núcleo single-thread 0.12.x. La guía oficial muestra `FFmpeg.load`, `writeFile`, `exec` y `readFile`, y estima el núcleo en aproximadamente 31 MB. El mismo proyecto documenta el procesamiento en un Web Worker y que los medios del usuario permanecen en su navegador: [uso de FFmpeg.wasm](https://ffmpegwasm.netlify.app/docs/getting-started/usage/) y [arquitectura](https://ffmpegwasm.netlify.app/docs/overview/).

La compilación wasm declara LAME 3.100 entre sus bibliotecas, y FFmpeg admite `libmp3lame` al construir con ese soporte. Para la salida se usará `-b:a 320k` y `-compression_level 0`; FFmpeg documenta que el nivel 0 ofrece la mayor calidad del algoritmo a costa de más tiempo. Ese ajuste no recupera detalle que ya falte en la fuente: [codificador libmp3lame](https://ffmpeg.org/ffmpeg-codecs.html#libmp3lame) y [configuración del núcleo wasm](https://github.com/ffmpegwasm/ffmpeg.wasm-core/blob/n4.3.1-wasm/configure).

La FAQ oficial fija 2 GB como límite duro teórico de entrada por el límite de WebAssembly. La aplicación impone un límite inferior (100 MB) porque el tamaño teórico no garantiza que el navegador, el teléfono o su memoria puedan procesar un archivo tan grande: [FAQ de FFmpeg.wasm](https://ffmpegwasm.netlify.app/docs/faq/).

La búsqueda de palabras clave se delega a `youtube.com/results?search_query=…`. Las URLs de vídeo sólo generan un enlace de apertura a YouTube. No se leen resultados mediante scraping ni se extraen ni descargan medios de YouTube.
