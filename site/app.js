import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
const ACCEPTED_EXTENSIONS = new Set([
  'mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'm4a', 'flac',
]);

const searchForm = document.querySelector('[data-search-form]');
const searchInput = document.querySelector('#video-search');
const searchResult = document.querySelector('[data-search-result]');
const searchMessage = document.querySelector('[data-search-message]');
const searchLink = document.querySelector('[data-search-link]');
const fileInput = document.querySelector('#media-file');
const dropzone = document.querySelector('[data-dropzone]');
const fileSelected = document.querySelector('[data-file-selected]');
const fileName = document.querySelector('[data-file-name]');
const fileSize = document.querySelector('[data-file-size]');
const clearFile = document.querySelector('[data-clear-file]');
const consent = document.querySelector('[data-consent]');
const convertButton = document.querySelector('[data-convert]');
const statusBox = document.querySelector('[data-status]');
const statusLight = document.querySelector('[data-status-light]');
const statusText = document.querySelector('[data-status-text]');
const statusPercent = document.querySelector('[data-status-percent]');
const progressTrack = document.querySelector('[data-progress-track]');
const progressFill = document.querySelector('[data-progress-fill]');
const downloadLink = document.querySelector('[data-download]');
const downloadSize = document.querySelector('[data-download-size]');

let selectedFile = null;
let ffmpeg = null;
let ffmpegLoadPromise = null;
let outputUrl = null;
let lastFfmpegError = '';
let busy = false;

const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const setStatus = (message, kind = 'info') => {
  statusBox.hidden = false;
  statusBox.classList.remove('is-working', 'is-success', 'is-error', 'is-indeterminate');
  const statusClass = kind === 'working' ? 'is-working' : kind === 'success' ? 'is-success' : kind === 'error' ? 'is-error' : null;
  if (statusClass) statusBox.classList.add(statusClass);
  statusText.textContent = message;
  statusPercent.textContent = '';
  statusLight.setAttribute('aria-label', kind === 'working' ? 'En curso' : kind === 'success' ? 'Correcto' : kind === 'error' ? 'Error' : 'Estado');
};

const updateConvertState = () => {
  convertButton.disabled = busy || !selectedFile || !consent.checked;
  fileInput.disabled = busy;
  clearFile.disabled = busy;
  consent.disabled = busy;
  dropzone.classList.toggle('is-disabled', busy);
  dropzone.setAttribute('aria-disabled', String(busy));
};

const clearGeneratedOutput = () => {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = null;
  downloadLink.hidden = true;
  downloadLink.removeAttribute('href');
};

const rejectFile = (message) => {
  selectedFile = null;
  fileInput.value = '';
  fileSelected.hidden = true;
  consent.checked = false;
  clearGeneratedOutput();
  progressTrack.hidden = true;
  progressFill.style.width = '0%';
  setStatus(message, 'error');
  updateConvertState();
};

const setSearchAction = (message, href, label) => {
  searchResult.hidden = false;
  searchMessage.textContent = message;
  searchLink.hidden = !href;
  if (href) {
    searchLink.href = href;
    searchLink.textContent = label;
  } else {
    searchLink.removeAttribute('href');
    searchLink.textContent = '';
  }
};

const openYoutubeAndKeepFallback = (message, href, label) => {
  setSearchAction(message, href, label);
  window.open(href, '_blank', 'noopener,noreferrer');
};

const videoIdFromUrl = (rawValue) => {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`);
  } catch {
    return { isYoutube: false, id: null };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const youtubeHosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'youtube-nocookie.com']);
  if (!youtubeHosts.has(host)) return { isYoutube: false, id: null };

  let id = null;
  if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || null;
  if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] || null;
  }

  return { isYoutube: true, id: id && /^[\w-]{11}$/.test(id) ? id : null };
};

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (!query) {
    setSearchAction('Escribe una búsqueda o pega un enlace de YouTube.', null, '');
    searchInput.focus();
    return;
  }

  const youtube = videoIdFromUrl(query);
  if (youtube.isYoutube) {
    if (!youtube.id) {
      setSearchAction('No reconozco el enlace. Pega la URL completa de un vídeo o escribe palabras clave.', null, '');
      return;
    }
    const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(youtube.id)}`;
    openYoutubeAndKeepFallback('Vídeo reconocido y abierto en YouTube. Si el navegador bloquea la pestaña, usa el botón.', videoUrl, 'Reabrir vídeo en YouTube ↗');
    return;
  }

  const resultsUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  openYoutubeAndKeepFallback('Resultados oficiales abiertos en YouTube. Si el navegador bloquea la pestaña, usa el botón.', resultsUrl, 'Reabrir resultados en YouTube ↗');
});

const setSelectedFile = (file) => {
  if (!file) return;
  const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    rejectFile('Formato no admitido. Prueba MP4, MOV, WEBM, MKV, MP3, WAV, M4A o FLAC.');
    return;
  }
  if (file.size === 0) {
    rejectFile('El archivo está vacío. Elige otro archivo.');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    rejectFile('El límite de esta versión es 100 MB. Elige un archivo más pequeño.');
    return;
  }

  clearGeneratedOutput();
  progressTrack.hidden = true;
  progressFill.style.width = '0%';
  selectedFile = file;
  consent.checked = false;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  fileSelected.hidden = false;
  setStatus('Archivo listo. La conversión se ejecuta localmente en tu navegador.', 'info');
  updateConvertState();
};

fileInput.addEventListener('change', () => setSelectedFile(fileInput.files?.[0]));
clearFile.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  fileSelected.hidden = true;
  consent.checked = false;
  clearGeneratedOutput();
  progressTrack.hidden = true;
  progressFill.style.width = '0%';
  setStatus('Elige un archivo de audio o vídeo autorizado.', 'info');
  updateConvertState();
});
consent.addEventListener('change', updateConvertState);

dropzone.addEventListener('keydown', (event) => {
  if (busy) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
['dragenter', 'dragover'].forEach((name) => dropzone.addEventListener(name, (event) => {
  if (busy) return;
  event.preventDefault();
  dropzone.classList.add('is-dragging');
}));
['dragleave', 'drop'].forEach((name) => dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragging');
}));
dropzone.addEventListener('drop', (event) => {
  if (busy) return;
  setSelectedFile(event.dataTransfer?.files?.[0]);
});

const loadEngine = async () => {
  if (ffmpeg?.loaded) return ffmpeg;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    const engine = new FFmpeg();
    const onLog = ({ message }) => {
      if (/error|unknown encoder|does not contain any stream/i.test(message)) {
        lastFfmpegError = message;
        console.warn('[FFmpeg]', message);
      }
    };
    engine.on('log', onLog);
    try {
      const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');
      await engine.load({ coreURL, wasmURL });
      ffmpeg = engine;
      return engine;
    } catch (error) {
      engine.terminate();
      throw new Error(`WASM_LOAD_FAILED: ${error?.message || error}`);
    }
  })();

  try {
    return await ffmpegLoadPromise;
  } finally {
    ffmpegLoadPromise = null;
  }
};

const safeBasename = (name) => {
  const base = name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(0, 80);
  return base || 'audio';
};

convertButton.addEventListener('click', async () => {
  if (!selectedFile || !consent.checked || busy) return;
  busy = true;
  updateConvertState();
  downloadLink.hidden = true;
  progressTrack.hidden = true;
  progressFill.style.width = '0%';
  statusBox.classList.remove('is-error', 'is-success');
  statusBox.classList.add('is-working', 'is-indeterminate');
  statusBox.hidden = false;
  statusText.textContent = 'Cargando motor de conversión…';
  statusPercent.textContent = '';
  lastFfmpegError = '';
  let engine;
  let inputPath;
  let outputPath;
  let progressHandler;

  try {
    try {
      engine = await loadEngine();
    } catch (error) {
      throw new Error(`WASM_LOAD_FAILED: ${error?.message || error}`);
    }
    statusText.textContent = 'Preparando el archivo…';
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    inputPath = `input.${extension}`;
    outputPath = `${safeBasename(selectedFile.name)}.mp3`;

    const bytes = new Uint8Array(await selectedFile.arrayBuffer());
    await engine.writeFile(inputPath, bytes);
    statusText.textContent = 'Extrayendo el audio y creando MP3…';
    statusBox.classList.remove('is-indeterminate');
    progressTrack.hidden = false;
    progressHandler = ({ progress }) => {
      if (!Number.isFinite(progress)) return;
      const percent = Math.min(99, Math.max(0, Math.round(progress * 100)));
      progressFill.style.width = `${percent}%`;
      statusPercent.textContent = `${percent}% aprox.`;
    };
    engine.on('progress', progressHandler);

    const exitCode = await engine.exec([
      '-i', inputPath,
      '-map', '0:a:0',
      '-vn',
      '-c:a', 'libmp3lame',
      '-b:a', '320k',
      '-compression_level', '0',
      '-map_metadata', '0',
      '-id3v2_version', '3',
      outputPath,
    ]);
    engine.off('progress', progressHandler);
    progressHandler = null;
    if (exitCode !== 0) throw new Error(`FFMPEG_EXIT_${exitCode}: ${lastFfmpegError}`);

    const output = await engine.readFile(outputPath);
    if (!(output instanceof Uint8Array) || output.byteLength < 128) throw new Error('El resultado MP3 está vacío o incompleto.');
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = URL.createObjectURL(new Blob([output], { type: 'audio/mpeg' }));
    downloadLink.href = outputUrl;
    downloadLink.download = outputPath;
    downloadSize.textContent = `${formatBytes(output.byteLength)} · 320 kb/s`;
    downloadLink.hidden = false;
    progressFill.style.width = '100%';
    statusPercent.textContent = '';
    setStatus('Conversión completada. El archivo original no se ha subido.', 'success');
  } catch (error) {
    console.error('[AAH MP3]', error);
    const detail = `${String(error?.message || error)} ${lastFfmpegError}`;
    if (/memory|allocate|out of bounds|abort\(/i.test(detail)) {
      setStatus('El navegador se quedó sin memoria. Prueba con un archivo más pequeño o con un ordenador.', 'error');
    } else if (/encoder.*not found|unknown encoder|libmp3lame/i.test(detail)) {
      setStatus('Este núcleo de FFmpeg no incluye el codificador MP3. Recarga la página e inténtalo de nuevo.', 'error');
    } else if (/matches no streams|does not contain any stream|no audio stream/i.test(detail)) {
      setStatus('No se encontró una pista de audio en ese archivo.', 'error');
    } else if (/WASM_LOAD_FAILED|failed to fetch|networkerror/i.test(detail)) {
      setStatus('No se pudo cargar el motor de conversión. Comprueba la conexión a Internet y vuelve a intentarlo.', 'error');
    } else if (/invalid data|unsupported|decoder.*not found|could not find codec parameters/i.test(detail)) {
      setStatus('No se admite el códec interno de este archivo, aunque su extensión sea válida.', 'error');
    } else if (/FFMPEG_EXIT_/i.test(detail)) {
      setStatus('No se pudo procesar la pista de audio. El archivo puede no incluir audio o usar un códec no compatible.', 'error');
    } else if (/audio|stream/i.test(detail)) {
      setStatus('No se pudo leer una pista de audio compatible. Prueba otro archivo de audio o vídeo.', 'error');
    } else {
      setStatus('No se pudo convertir el archivo. Comprueba el formato y prueba con un archivo más pequeño.', 'error');
    }
  } finally {
    if (progressHandler && engine) engine.off('progress', progressHandler);
    if (engine && inputPath) await engine.deleteFile(inputPath).catch(() => {});
    if (engine && outputPath) await engine.deleteFile(outputPath).catch(() => {});
    busy = false;
    updateConvertState();
  }
});

window.addEventListener('pagehide', () => {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
});
