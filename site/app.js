document.documentElement.classList.add('js');

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
const form = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const issueLink = document.querySelector('[data-issue-link]');

const setMenu = (open, restoreFocus = false) => {
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  menu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);

  if (open) {
    menu.querySelector('a')?.focus();
  } else if (restoreFocus) {
    menuToggle.focus();
  }
};

menuToggle?.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false, true);
  }
});

window.addEventListener('scroll', () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 16);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelector('[data-year]').textContent = new Date().getFullYear();

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const requiredFields = ['name', 'email', 'message'];
  const hasEmptyField = requiredFields.some((field) => !String(data.get(field) || '').trim());
  const email = String(data.get('email') || '').trim();

  if (hasEmptyField || !email.includes('@')) {
    formStatus.textContent = 'Revisa tu nombre, correo y mensaje antes de continuar.';
    formStatus.style.color = '#b62d30';
    issueLink.hidden = true;
    return;
  }

  const name = String(data.get('name')).trim();
  const message = String(data.get('message')).trim();
  const title = `Consulta de proyecto: ${name}`;
  const body = `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`;
  issueLink.href = `https://github.com/MrChorusman/AAH_download/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  issueLink.hidden = false;
  formStatus.textContent = 'Borrador preparado. Revísalo y confirma el envío en GitHub.';
  formStatus.style.color = '#214f9c';
  form.reset();
});
