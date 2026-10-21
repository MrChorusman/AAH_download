# Plan — buscador y convertidor autorizado

## Alcance y arquitectura

Reemplazar la portada corporativa actual por una página utilitaria de una sola vista, enfocada únicamente en (1) buscar en YouTube por consulta o abrir un vídeo indicado mediante su URL, y (2) extraer el audio y convertirlo a MP3 desde archivos de audio o vídeo elegidos por la persona usuaria y para los que tenga autorización. Al enviar una búsqueda, se abrirá la página oficial de resultados de YouTube en una pestaña nueva; si el navegador la bloquea, quedará un enlace alternativo visible. Sin una clave de API no se afirmará que los resultados se consultan dentro de este sitio. Al pegar la URL de un vídeo, sólo se facilitará abrirlo en YouTube. No se descargará contenido de YouTube, no se extraerán sus flujos audiovisuales ni se conectará el buscador al convertidor. El proyecto se destina a uso personal, sin finalidad educativa ni explotación comercial, como indicó la persona usuaria.

El proyecto seguirá como sitio estático servido desde `site/`, sin base de datos, cuenta, servidor ni credenciales. La conversión usará FFmpeg.wasm single-thread y la compilación oficial del núcleo con LAME, dentro de un Web Worker. El archivo se elegirá desde el dispositivo, se procesará localmente y se descargará el MP3 producido desde memoria del navegador. La página informará que no sube los archivos y que la conversión no puede recuperar calidad que la fuente no contenga. Para compatibilidad se fijarán las versiones de las bibliotecas y el toolchain. La primera conversión requiere descargar el núcleo wasm de aproximadamente 31 MB; se mostrará esa condición antes de cargarlo. Se limitarán los archivos a 100 MB como salvaguarda práctica del navegador y se permitirá un trabajo a la vez. MP3 de salida: 320 kb/s CBR, nivel de esfuerzo LAME máximo y frecuencia de origen cuando el codificador lo permita. En formatos/códecs incompatibles, entradas sin pista de audio o falta de memoria, se mostrará un mensaje claro y no se ofrecerá una descarga falsa. Vite compilará el sitio a `dist/`, con el comando de instalación/build declarado en Webdev.

## Estructura del proyecto

- `site/index.html`: buscador de YouTube, conversor de archivos, estados accesibles y límites visibles.
- `site/styles.css`: interfaz compacta responsive inspirada en la captura, con cabecera oscura, superficie clara, controles prominentes y acento coral propio de herramienta.
- `site/app.js`: validación de consultas/URL, construcción de enlaces oficiales, carga tardía del motor, conversión, progreso/errores, descarga y limpieza de recursos temporales.
- `site/public/manus-routes.json`: declara la única ruta pública `/` y se copia al build estático.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` y `vite.config.js`: dependencias versionadas, permisos mínimos de instalación y build Vite.
- `README.md` y `TODO.md`: instrucciones y criterios de aceptación actualizados.
- `docs/implementation-notes.md`: enlaces técnicos de FFmpeg.wasm y decisiones de compatibilidad.

Se mantendrá la declaración de una única ruta `/`; no se añadirá API ni credenciales. No se solicitará clave de YouTube API: la acción del buscador se delegará a `youtube.com/results` para evitar scraping, exponer credenciales o fingir resultados propios.

## Diseño

**Movimiento:** utilitario editorial de un solo propósito, con la densidad y jerarquía clara de una página clásica de búsqueda/descarga multimedia, reinterpretadas con la marca AAH.

**Principios:** función principal evidente; entrada y resultado separados visualmente; límites y privacidad comprensibles; ningún control sugiere descargar YouTube.

**Filosofía de color:** cabecera azul-negra para enmarcar la herramienta, fondo blanco cálido para lectura prolongada y coral para los botones de acción; contraste alto en mensajes de estado.

**Paradigma de layout:** columna estrecha centrada, cabecera oscura arriba y tarjeta del buscador que se superpone levemente al límite de la zona oscura. Convertidor como panel compacto debajo; no habrá secciones corporativas ni tarjetas de servicios.

**Elementos distintivos:** marca AAH en una cápsula minimal; enlaces «Buscar en YouTube» y «Convertir archivo»; una barra de estado de conversión con icono y nombre del archivo.

**Interacción:** flujo progresivo: escribir consulta o pegar URL, abrir el resultado oficial; o elegir archivo, revisar nombre/tamaño, confirmar autorización, cargar motor wasm bajo demanda, convertir y descargar el resultado. Validación inmediata; los controles incompatibles se deshabilitan mientras trabaja; los errores explican el siguiente paso.

**Animación:** sólo un pulso suave para el estado de carga y transiciones de controles; con `prefers-reduced-motion` respetado. La barra de progreso se trata como aproximada; el mensaje de estado no depende de ella.

**Tipografía:** Manrope para instrucciones y estados; DM Mono para etiquetas técnicas y tamaños. Jerarquía compacta: título 30–38 px, controles 14–16 px, etiquetas 10–11 px.

**Esencia de marca:** herramienta personal para encontrar en YouTube y convertir archivos que se pueden usar legítimamente, simple porque no mezcla búsqueda externa con extracción; personalidad: directa, prudente, útil.

**Voz:** etiquetas breves y concretas. Ejemplos: «Busca el vídeo en YouTube» y «Tu archivo se convierte aquí, sin subirse».

**Wordmark & logo:** conservar el símbolo lineal AAH existente junto al nombre; no usar la identidad ni el logotipo de la referencia.

**Color distintivo:** coral `#ef3340`, aplicado de forma restringida a acciones principales y marcadores de estado.

## Fundamento técnico

FFmpeg.wasm mantiene su procesamiento en un worker y su guía estima la descarga del core en unos 31 MB. La FAQ publica un límite teórico de 2 GB, pero la aplicación usará 100 MB para reducir fallos por memoria en navegadores, especialmente móviles. El build single-thread evita exigir `SharedArrayBuffer`/aislamiento de origen cruzado. Las referencias consultadas están en `docs/implementation-notes.md`.
