# TODO — AAH Download

## Alcance activo: buscador y convertidor autorizado

El proyecto es personal, sin finalidad educativa ni explotación comercial, según indicó la persona usuaria. El alcance aprobado deja la búsqueda en YouTube separada de la conversión local autorizada.

- [x] **Ingeniería inversa pública con REA.** Usar REA para observar la portada y enviar una consulta pública de prueba a `https://tech-trans.com.pl/`; registrar el formulario, el paso hacia resultados y los controles visibles. No pulsar controles de descarga ni guardar medios ajenos. Aplicar sólo la estructura de búsqueda como referencia; no copiar su marca, sus recursos o su endpoint.

- [x] **Búsqueda que delega a YouTube.** La página permite escribir palabras clave y abre en una pestaña nueva los resultados oficiales de YouTube. Si la entrada es una URL reconocible de vídeo de YouTube, sólo abre ese vídeo en YouTube. No obtiene ni extrae la descarga de audio/vídeo desde YouTube ni da a entender que el buscador muestre resultados locales.

- [x] **Conversión a MP3 de archivos autorizados.** Permite elegir un archivo local de audio o vídeo de hasta 100 MB cuyo uso está autorizado por la persona usuaria. Extrae sólo la pista de audio, convierte a MP3 y ofrece el resultado para descargar. La conversión se ejecuta en el navegador con FFmpeg.wasm; no se suben los medios del usuario a un servidor. El motor se carga sólo cuando se solicita la conversión y se informa antes que su núcleo wasm pesa aproximadamente 31 MB.

- [x] **Calidad, límites y estados veraces.** Produce MP3 a 320 kb/s CBR usando el nivel de calidad más alto disponible para LAME, sin prometer mejorar la calidad del original. Muestra nombre y tamaño del archivo, indica progreso/estado, impide acciones incompatibles mientras convierte, limpia recursos temporales y explica archivos sin audio, formatos no admitidos o falta de memoria sin fingir que se creó una descarga.

- [x] **Interfaz funcional inspirada en la referencia.** Reemplaza las secciones corporativas por una herramienta de una sola página con cabecera oscura, buscador prominente, tarjeta compacta de conversión y diseño adaptable a móvil y escritorio. Usa identidad AAH propia; no copia logo, textos, marca ni recursos de Y2Mate.

- [x] **Validación real.** Probar búsqueda mediante consulta y URL de YouTube sin activar descarga; convertir en Chromium un archivo de audio de prueba y un archivo de vídeo local de prueba con audio; confirmar que el MP3 descargado puede analizarse y decodificarse; comprobar el caso de vídeo sin audio, el rechazo de extensión y que el proyecto sigue siendo utilizable en un viewport móvil de 390 px.

- [ ] **Sincronización del código.** Tras los cambios y sus pruebas, sincronizar el código validado con `MrChorusman/AAH_download` en `main`, sin reescribir historial ni sobrescribir cambios concurrentes.

## Entrega anterior conservada

La página corporativa anterior fue reemplazada como resultado deliberado del nuevo alcance. Su análisis público de REA permanece en `docs/reference-analysis.md`; no forma parte de la nueva interfaz.
