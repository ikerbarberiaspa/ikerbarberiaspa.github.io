/* IKER BARBERÍA SPA: plantilla de presentación sin reservas. */

document.documentElement.classList.add('js');
const qs = (sel, base = document) => base.querySelector(sel);
const qsa = (sel, base = document) => [...base.querySelectorAll(sel)];

// Menú accesible para móviles.
const menuToggle = qs('.menu-toggle');
const nav = qs('.primary-nav');
function closeMenu() {
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Abrir menú');
  nav?.classList.remove('is-open');
}
menuToggle?.addEventListener('click', () => {
  const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
  nav.classList.toggle('is-open', opening);
});
qsa('.primary-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

// Cabecera compacta y navegación por secciones.
const header = qs('.site-header');
function updateHeader() { header?.classList.toggle('scrolled', window.scrollY > 20); }
window.addEventListener('scroll', updateHeader, {passive:true});
updateHeader();
const sectionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    qsa('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
  });
}, {rootMargin: '-35% 0px -55% 0px', threshold:0}) : null;
qsa('main section[id]').forEach(s => sectionObserver?.observe(s));

// Apariciones suaves con alternativa sin JavaScript moderno.
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {rootMargin: '0px 0px -40px 0px', threshold:.04});
  qsa('.reveal').forEach(item => revealObserver.observe(item));
} else qsa('.reveal').forEach(item => item.classList.add('in-view'));

// Galería con filtros reales: "ambos" también se ve en Hombres y Mujeres.
// IMPORTANTE: No cambies los data-filter ni data-category sin modificar esta lógica.
// El mismo control combina los filtros y la selección de Inicio.
function createSelection({items, filters, categoryKey, filterKey, toggle, status, label, section}) {
  let category = 'todos';
  let expanded = false;
  const controls = toggle?.closest('.selection-controls');
  function render() {
    const matches = items.filter(item => category === 'todos' || item.dataset[categoryKey] === category || item.dataset[categoryKey] === 'ambos');
    const hasSelection = Boolean(toggle) && matches.some(item => item.dataset.featured === 'true');
    const visible = hasSelection && !expanded ? matches.filter(item => item.dataset.featured === 'true') : matches;
    const shown = new Set(visible);
    items.forEach(item => { item.hidden = !shown.has(item); });
    filters.forEach(button => {
      const active = button.dataset[filterKey] === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (controls) {
      controls.hidden = false;
      status.textContent = `${visible.length} de ${matches.length} ${label}`;
      toggle.hidden = !hasSelection || matches.every(item => item.dataset.featured === 'true');
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? 'VOLVER A LA SELECCIÓN' : `VER ${label === 'fotografías' ? 'LAS' : 'LOS'} ${matches.length} ${label.toUpperCase()}`;
    }
    if (section) {
      qsa('.iker-gallery-collection', section).forEach(group => {
        group.hidden = !qsa('.gallery-item', group).some(item => !item.hidden);
      });
    }
  }
  function select(nextCategory) { category = nextCategory; expanded = false; render(); }
  filters.forEach(button => button.addEventListener('click', () => select(button.dataset[filterKey])));
  toggle?.addEventListener('click', () => {
    expanded = !expanded;
    render();
    if (!expanded) toggle.scrollIntoView({block:'nearest', behavior:'instant'});
  });
  render();
  return {select};
}

createSelection({items:qsa('.gallery-item'), filters:qsa('.filter'), categoryKey:'category', filterKey:'filter',
  toggle:qs('#toggle-gallery'), status:qs('#gallery-count'), label:'fotografías', section:qs('#galeria')});


// Lightbox accessible con escape y clic fuera.
const lightbox = qs('#lightbox');
const lightboxImage = qs('#lightbox-image');
const lightboxCaption = qs('#lightbox-caption');
qsa('.gallery-item').forEach(item => item.addEventListener('click', () => {
  const image = qs('img', item);
  lightboxImage.srcset = '';
  lightboxImage.src = item.dataset.fullSrc || image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  const caption = item.dataset.caption || 'Imagen de galería';
  lightboxCaption.textContent = item.dataset.photoType === 'ilustrativa' ? caption + ' · Imagen ilustrativa' : caption;
  if (typeof lightbox.showModal === 'function') lightbox.showModal();
}));
// Carruseles de Bótox capilar y tarjetas de servicios.
qsa('.gallery-carousel').forEach(carousel => {
  let slides;
  try { slides = JSON.parse(carousel.dataset.slides || '[]'); } catch { return; }
  if (slides.length < 2) return;
  const image = qs('img', carousel);
  if (!image) return;
  let current = 0;
  let timer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const indicators = document.createElement('div');
  indicators.className = 'gallery-carousel-indicators';
  indicators.setAttribute('role', 'group');
  indicators.setAttribute('aria-label', `Fotos de ${carousel.dataset.caption || 'este servicio'}`);
  const indicatorButtons = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gallery-carousel-indicator';
    button.setAttribute('aria-label', `Mostrar foto ${index + 1} de ${slides.length}`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      showSlide(index);
    });
    indicators.append(button);
    return button;
  });
  carousel.append(indicators);
  const showSlide = (nextIndex) => {
    current = (nextIndex + slides.length) % slides.length;
    const slide = slides[current];
    image.src = slide.src;
    image.srcset = slide.srcset;
    image.alt = slide.alt;
    image.width = slide.width;
    image.height = slide.height;
    image.style.objectPosition = slide.objectPosition || '';
    carousel.dataset.fullSrc = slide.full;
    indicatorButtons.forEach((button, index) => {
      const active = index === current;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  };
  qsa('[data-carousel-direction]', carousel).forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      showSlide(current + Number(button.dataset.carouselDirection));
    });
  });
  const pause = () => { window.clearInterval(timer); timer = undefined; };
  const resume = () => {
    if (!reducedMotion && !timer) timer = window.setInterval(() => showSlide(current + 1), 5500);
  };
  carousel.addEventListener('pointerenter', pause);
  carousel.addEventListener('pointerleave', resume);
  carousel.addEventListener('focusin', pause);
  carousel.addEventListener('focusout', event => {
    if (!carousel.contains(event.relatedTarget)) resume();
  });
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
  showSlide(0);
  resume();
});
qs('#close-lightbox')?.addEventListener('click', () => lightbox.close());
lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.close(); });

// Filtros de servicios por categoría: hombres y mujeres.
const serviceSelection = createSelection({items:qsa('[data-service-category]'), filters:qsa('[data-service-filter]'),
  categoryKey:'serviceCategory', filterKey:'serviceFilter', label:'servicios'});
qsa('[data-jump-filter]').forEach(link => {
  link.addEventListener('click', () => serviceSelection.select(link.dataset.jumpFilter));
});
const year = qs('#year');
if(year) year.textContent=String(new Date().getFullYear());


