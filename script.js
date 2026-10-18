/* ==========================================================================
   J MAURI — PRESS KIT 2026 — script v6
   - Telonero: logo + barra de carga real + persianas
   - Logo recortado en barra flotante y pie (detecta si el arte es vertical)
   - Reloj CDMX, barra flotante con progreso, tabs, lightbox, navdots, videos
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LOGO_SRC = 'assets/press/dj-mauri-logo.webp';

// ---------- LOGO: detecta si es el arte vertical (para recortarlo) o fallo ----------
(function initLogoMode(){
  const root = document.documentElement;
  const img = new Image();
  img.onload = ()=>{
    if(img.naturalHeight / img.naturalWidth > 1.3) root.classList.add('logo-tall');
  };
  img.onerror = ()=> root.classList.add('logo-failed');
  img.src = LOGO_SRC;
})();

// ---------- TELONERO (preloader) ----------
(function initIntro(){
  const body = document.body;
  const intro = document.getElementById('intro');
  const ready = () => body.classList.add('is-ready');

  if(!intro){ ready(); return; }

  let seen = false;
  try { seen = sessionStorage.getItem('jmauri_intro_seen') === '1'; } catch(e){}
  if(seen){ intro.remove(); ready(); return; }

  body.classList.add('intro-lock');

  const bar  = document.getElementById('introBar');
  const wrap = document.getElementById('introWrap');
  const logo = document.getElementById('introLogo');

  const MIN_MS  = REDUCED ? 900 : 3200;   // duración mínima del telonero
  const HARD_MS = 8000;                   // seguro: nunca se queda trabado
  const start   = performance.now();

  function checkLogo(){
    if(!logo.naturalWidth){ intro.classList.add('logo-failed'); return; }
    if(logo.naturalHeight / logo.naturalWidth > 1.3) wrap.classList.add('is-tall');
  }

  // Recursos reales que esperamos: logo, fuentes y portada
  let done = 0;
  const TOTAL = 3;
  const tick = () => { done = Math.min(TOTAL, done + 1); };

  if(logo.complete){ checkLogo(); tick(); }
  else {
    logo.addEventListener('load',  ()=>{ checkLogo(); tick(); }, { once:true });
    logo.addEventListener('error', ()=>{ intro.classList.add('logo-failed'); tick(); }, { once:true });
  }

  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(tick, tick);
    setTimeout(()=>{ if(done < TOTAL) tick(); }, 2500);
  } else { tick(); }

  const cover = new Image();
  cover.onload = cover.onerror = tick;
  cover.src = 'assets/press/head-cover.webp';

  let p = 0;
  let forced = false;
  let dropped = false;

  function frame(now){
    if(dropped) return;
    const elapsed = now - start;
    const real = done / TOTAL;
    const timeFrac = Math.min(1, elapsed / MIN_MS);
    const target = forced ? 1 : Math.min(real, timeFrac);

    p += (target - p) * (forced ? 0.25 : 0.1);
    if(target === 1 && p > 0.995) p = 1;

    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';

    if(p >= 1 || elapsed > HARD_MS){ drop(); return; }
    requestAnimationFrame(frame);
  }

  function drop(){
    if(dropped) return;
    dropped = true;
    bar.style.transform = 'scaleX(1)';
    intro.classList.add('is-drop');

    setTimeout(()=>{
      intro.classList.add('is-open');     // persianas
      body.classList.remove('intro-lock');
      ready();
      try { sessionStorage.setItem('jmauri_intro_seen', '1'); } catch(e){}
      setTimeout(()=> intro.remove(), 1200);
    }, REDUCED ? 100 : 700);
  }

  intro.addEventListener('click', ()=>{
    if(performance.now() - start > 900) forced = true;
  });

  requestAnimationFrame(frame);
})();

// ---------- RELOJ DE CDMX (el club no cierra) ----------
(function initClock(){
  const el = document.getElementById('clock');
  if(!el) return;
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City'
    });
  } catch(e){ return; }
  const tick = () => { el.textContent = 'CDMX · ' + fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);
})();

// ---------- BARRA FLOTANTE: aparece al salir del head + progreso ----------
(function initMinibar(){
  const hero = document.getElementById('head');
  const progress = document.getElementById('minibarProgress');
  if(!hero) return;

  let ticking = false;
  function update(){
    const y = window.scrollY;
    document.body.classList.toggle('past-hero', y > hero.offsetHeight - 140);
    if(progress){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    }
    ticking = false;
  }
  window.addEventListener('scroll', ()=>{
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, { passive:true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- REVEAL AL SCROLL ----------
(function initSectionReveal(){
  if(!('IntersectionObserver' in window)) return;
  const sections = document.querySelectorAll('.section');
  if(!sections.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  sections.forEach(s=>{
    s.classList.add('pre-reveal');
    io.observe(s);
  });
})();

// ---------- NAV DOTS ----------
(function initNavDots(){
  const targets = document.querySelectorAll('.section, .hero');
  const dots = document.querySelectorAll('.navdot');
  if(!targets.length || !dots.length || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.id;
        dots.forEach(d => d.classList.toggle('active', d.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4 });
  targets.forEach(t => io.observe(t));
})();

// ---------- TABS ----------
(function initTabs(){
  const tabs = document.querySelectorAll('.tab');
  if(!tabs.length) return;
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');

      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-' + tab.dataset.tab);
      if(panel) panel.classList.add('active');
    });
  });
})();

// ---------- LIGHTBOX ----------
(function initLightbox(){
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  if(!lightbox) return;

  function open(src, alt){
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.gallery-item');
    if(item){
      const alt = item.querySelector('img')?.alt || '';
      open(item.dataset.full, alt);
    }
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) close(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
})();

// ---------- SESIONES: selector de videos ----------
(function initVideoSelector(){
  const videoFrame = document.getElementById('videoFrame');
  const videoSelector = document.getElementById('videoSelector');
  if(!videoFrame || !videoSelector) return;

  const videos = [
    { id: "wimV3hKELhw", title: "Mauryseo Vol. 3" },
    { id: "6LIKP_KYmgo", title: "Mauryseo Vol. 2" },
    { id: "o-dtx72NlOY", title: "Mauryseo Vol. 1" },
    { id: "2HmVZI4MfkM", title: "Mundo Diferente" },
    { id: "upoUhtUHiQs", title: "Depto Session" },
    { id: "3eLYEonmF5A", title: "Déjate Llevar" },
    { id: "oZaOCgXWi0s", title: "Casa del Lago" }
  ];

  let currentIndex = 0;

  function loadVideo(index){
    if(index === currentIndex) return;
    const video = videos[index];
    videoFrame.src = 'https://www.youtube-nocookie.com/embed/' + video.id + '?autoplay=1&rel=0&modestbranding=1';
    currentIndex = index;

    videoSelector.querySelectorAll('.video-thumb').forEach((thumb, i)=>{
      thumb.classList.toggle('active', i === index);
    });
  }

  videos.forEach((video, index)=>{
    const thumb = document.createElement('button');
    thumb.className = 'video-thumb' + (index === 0 ? ' active' : '');
    thumb.setAttribute('aria-label', 'Reproducir ' + video.title);

    const img = document.createElement('img');
    img.src = 'https://img.youtube.com/vi/' + video.id + '/mqdefault.jpg';
    img.alt = video.title;
    img.loading = 'lazy';
    img.decoding = 'async';

    const title = document.createElement('span');
    title.textContent = video.title;

    thumb.appendChild(img);
    thumb.appendChild(title);
    thumb.addEventListener('click', ()=> loadVideo(index));
    videoSelector.appendChild(thumb);
  });
})();
