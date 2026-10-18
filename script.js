/* ==========================================================================
   J MAURI — PRESS KIT 2026 — script v4
   - Telonero sincronizado con la carga real (fuentes + logo + portada)
   - Hero con EQ pausable, parallax ligero y mini barra
   - Waveform divider, "now playing", tabs, lightbox, navdots
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- TELONERO ----------
(function initIntro(){
  const body = document.body;
  const intro = document.getElementById('intro');
  const ready = () => body.classList.add('is-ready');

  if(!intro){ ready(); return; }

  let seen = false;
  try { seen = sessionStorage.getItem('jmauri_intro_seen') === '1'; } catch(e){}
  if(seen){ intro.remove(); ready(); return; }

  body.classList.add('intro-lock');

  const bar   = document.getElementById('introBar');
  const label = document.getElementById('introLabel');
  const bpm   = document.getElementById('introBpm');
  const logo  = document.getElementById('introLogo');

  const MIN_MS  = REDUCED ? 900 : 3600;   // duración mínima del telonero
  const HARD_MS = 8000;                   // seguro: nunca se queda trabado
  const start   = performance.now();

  // Recursos reales que esperamos
  let done = 0;
  const TOTAL = 3;
  const tick = () => { done = Math.min(TOTAL, done + 1); };

  // 1) logo del telonero
  if(logo.complete){
    if(logo.naturalWidth === 0) intro.classList.add('logo-failed');
    tick();
  } else {
    logo.addEventListener('load', tick, { once:true });
    logo.addEventListener('error', ()=>{ intro.classList.add('logo-failed'); tick(); }, { once:true });
  }
  // 2) fuentes
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(tick, tick);
    setTimeout(()=>{ if(done < TOTAL) tick(); }, 2500); // si las fuentes tardan, no bloquear
  } else { tick(); }
  // 3) portada del hero
  const cover = new Image();
  cover.onload = cover.onerror = tick;
  cover.src = 'assets/press/head-cover.webp';

  let p = 0;            // progreso mostrado (0..1)
  let forced = false;   // el usuario tocó para saltar
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
    bpm.textContent = String(Math.round(p * 128)).padStart(3, '0') + ' BPM';
    label.textContent =
      p >= 1   ? 'DROP' :
      p > 0.7  ? 'CUE READY' :
      p > 0.3  ? 'SYNCING BEATS' : 'LOADING SET';

    if(p >= 1 || elapsed > HARD_MS){ drop(); return; }
    requestAnimationFrame(frame);
  }

  function drop(){
    if(dropped) return;
    dropped = true;
    bar.style.transform = 'scaleX(1)';
    bpm.textContent = '128 BPM';
    label.textContent = 'DROP';
    intro.classList.add('is-drop');

    setTimeout(()=>{
      intro.classList.add('is-open');     // persianas
      body.classList.remove('intro-lock');
      ready();
      try { sessionStorage.setItem('jmauri_intro_seen', '1'); } catch(e){}
      setTimeout(()=> intro.remove(), 1200);
    }, REDUCED ? 100 : 750);
  }

  // Tocar para saltar (después de que el logo ya apareció)
  intro.addEventListener('click', ()=>{
    if(performance.now() - start > 900) forced = true;
  });

  requestAnimationFrame(frame);
})();

// ---------- HERO: ECUALIZADOR ----------
(function initHeroEq(){
  const eq = document.getElementById('heroEq');
  if(!eq) return;
  const hero = document.getElementById('head');
  const BARS = window.innerWidth < 560 ? 32 : 64;

  // Pseudo-aleatorio determinista: mismo patrón en cada visita
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const frag = document.createDocumentFragment();
  for(let i = 0; i < BARS; i++){
    const b = document.createElement('i');
    b.className = 'eq-bar';
    // más energía hacia el centro, como un espectro real
    const centre = 1 - Math.abs(i / (BARS - 1) - 0.5) * 1.1;
    b.style.setProperty('--min', (0.08 + rnd() * 0.12).toFixed(2));
    b.style.setProperty('--max', (0.25 + rnd() * 0.75 * centre).toFixed(2));
    b.style.setProperty('--dur', (0.55 + rnd() * 0.9).toFixed(2) + 's');
    b.style.setProperty('--delay', (-rnd() * 2).toFixed(2) + 's');
    frag.appendChild(b);
  }
  eq.appendChild(frag);

  // Pausar animaciones cuando el hero no se ve
  if('IntersectionObserver' in window){
    new IntersectionObserver(([e])=>{
      hero.classList.toggle('is-paused', !e.isIntersecting);
    }, { threshold: 0 }).observe(hero);
  }
})();

// ---------- HERO: PARALLAX + MINI BARRA ----------
(function initScrollFx(){
  const hero = document.getElementById('head');
  const img = hero && hero.querySelector('.hero-bg img');
  if(!hero) return;

  let ticking = false;
  function update(){
    const y = window.scrollY;
    const h = hero.offsetHeight;
    document.body.classList.toggle('past-hero', y > h - 140);
    if(img && !REDUCED && y < h){
      img.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', ()=>{
    if(!ticking){ ticking = true; requestAnimationFrame(update); }
  }, { passive:true });
  update();

  // "Escuchar" abre directamente la pestaña Música
  const listen = document.getElementById('heroListen');
  if(listen){
    listen.addEventListener('click', ()=>{
      const t = document.querySelector('.tab[data-tab="musica"]');
      if(t) t.click();
    });
  }
})();

// ---------- WAVEFORM DIVIDER ----------
(function initWave(){
  const wave = document.getElementById('wave');
  if(!wave) return;
  const N = window.innerWidth < 560 ? 56 : 90;
  const frag = document.createDocumentFragment();
  for(let i = 0; i < N; i++){
    const t = i / N;
    // forma tipo pista: intro suave, build, drop y salida
    const env = 0.25 + 0.75 * Math.pow(Math.sin(Math.PI * t), 0.6);
    const v = Math.abs(Math.sin(i * 1.7) * 0.55 + Math.sin(i * 0.43 + 1) * 0.45);
    const bar = document.createElement('i');
    bar.style.setProperty('--h', Math.max(6, Math.round((8 + v * 46) * env)) + 'px');
    frag.appendChild(bar);
  }
  wave.appendChild(frag);
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

// ---------- SESIONES: selector + NOW PLAYING ----------
(function initVideoSelector(){
  const videoFrame = document.getElementById('videoFrame');
  const videoSelector = document.getElementById('videoSelector');
  const nowTitle = document.getElementById('nowTitle');
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
    if(nowTitle) nowTitle.textContent = video.title;

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
