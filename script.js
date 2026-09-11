/* ==========================================================================
   J MAURI — PRESS KIT 2026 — script v3
   - Sistema de videos simplificado (un solo iframe, cambio de src)
   - Intro, tabs, lightbox, navdots y reveal intactos
   ========================================================================== */

// ---------- INTRO / SPLASH ----------
(function initIntro(){
  const intro = document.getElementById('intro');
  if(!intro) return;

  const seen = sessionStorage.getItem('jmauri_intro_seen');
  if(seen){
    intro.remove();
    return;
  }

  document.body.style.overflow = 'hidden';

  const MIN_SHOW_MS = 2800;
  const start = Date.now();

  function hide(){
    const elapsed = Date.now() - start;
    const wait = Math.max(0, MIN_SHOW_MS - elapsed);
    setTimeout(()=>{
      intro.classList.add('intro-out');
      document.body.style.overflow = '';
      sessionStorage.setItem('jmauri_intro_seen', '1');
      setTimeout(()=> intro.remove(), 750);
    }, wait);
  }

  intro.addEventListener('click', hide);
  setTimeout(hide, MIN_SHOW_MS + 200);
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

// ---------- NAV DOTS ACTIVE STATE ----------
(function initNavDots(){
  const targets = document.querySelectorAll('.section, .head');
  const dots = document.querySelectorAll('.navdot');
  if(!targets.length || !dots.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.id;
        dots.forEach(d=>{
          d.classList.toggle('active', d.getAttribute('href') === '#'+id);
        });
      }
    });
  }, { threshold: 0.4 });
  targets.forEach(t => io.observe(t));
})();

// ---------- INFO TABS ----------
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

// ---------- GALLERY LIGHTBOX ----------
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
      const full = item.dataset.full;
      const alt = item.querySelector('img')?.alt || '';
      open(full, alt);
    }
  });
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) close(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
})();

// ---------- SESIONES — Selector de videos simple ----------
(function initVideoSelector(){
  const videoFrame = document.getElementById('videoFrame');
  const videoSelector = document.getElementById('videoSelector');
  if(!videoFrame || !videoSelector) return;

  const videos = [
    { id: "6LIKP_KYmgo", title: "Mauryseo Vol. 2" },
    { id: "upoUhtUHiQs", title: "Depto Session" },
    { id: "3eLYEonmF5A", title: "Déjate Llevar" },
    { id: "oZaOCgXWi0s", title: "Casa del Lago" },
    { id: "2HmVZI4MfkM", title: "Mundo Diferente" },
    { id: "0_9jwWLh-nw", title: "Nena Exclusive" },
    { id: "o-dtx72NlOY", title: "Mauryseo Vol. 1" }
  ];

  let currentIndex = 0;

  function loadVideo(index){
    if(index === currentIndex) return;
    const video = videos[index];
    const embedUrl = 'https://www.youtube-nocookie.com/embed/' + video.id + '?autoplay=1&rel=0&modestbranding=1';
    videoFrame.src = embedUrl;
    currentIndex = index;

    const thumbs = videoSelector.querySelectorAll('.video-thumb');
    thumbs.forEach((thumb, i)=>{
      thumb.classList.toggle('active', i === index);
    });
  }

  videos.forEach((video, index)=>{
    const thumb = document.createElement('button');
    thumb.className = 'video-thumb' + (index === 0 ? ' active' : '');
    thumb.setAttribute('aria-label', 'Reproducir ' + video.title);

    const thumbImg = document.createElement('img');
    thumbImg.src = 'https://img.youtube.com/vi/' + video.id + '/mqdefault.jpg';
    thumbImg.alt = video.title;
    thumbImg.loading = 'lazy';

    const thumbTitle = document.createElement('span');
    thumbTitle.textContent = video.title;

    thumb.appendChild(thumbImg);
    thumb.appendChild(thumbTitle);
    thumb.addEventListener('click', ()=> loadVideo(index));
    videoSelector.appendChild(thumb);
  });
})();
