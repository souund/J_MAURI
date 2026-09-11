/* ==========================================================================
   J MAURI — PRESS KIT 2026
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

  // Duración total en pantalla antes de iniciar el fade-out.
  // Da tiempo a la entrada (1.1s) + al menos un ciclo completo de pulso (2.2s)
  // para que la marca "respire" antes de retirarse.
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

// ---------- REVEAL AL SCROLL — un solo tratamiento, consistente ----------
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

// ---------- INFO TABS (Biografía / Galería / Música) ----------
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

// ---------- SESIONES — YouTube IFrame API con fallback robusto ----------
(function initYtFacades(){
  const frames = document.querySelectorAll('.yt-frame');
  if(!frames.length) return;

  let apiReady = false;
  let apiLoading = false;
  const pending = [];

  function loadApi(){
    if(apiLoading || window.YT) { apiLoading = true; return; }
    apiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
  window.onYouTubeIframeAPIReady = function(){
    apiReady = true;
    pending.forEach(fn => fn());
    pending.length = 0;
  };

  function showFallback(frame, id){
    frame.innerHTML = `
      <div class="yt-fallback">
        <p>Este video no se puede reproducir aquí.</p>
        <a href="https://youtu.be/${id}" target="_blank" rel="noopener">Ver en YouTube ↗</a>
      </div>`;
  }

  function playVideo(frame){
    if(frame.classList.contains('loaded') || frame.classList.contains('loading')) return;
    const id = frame.dataset.ytId;
    frame.classList.add('loading');

    const mount = document.createElement('div');
    const mountId = 'ytp-' + id.replace(/[^a-zA-Z0-9]/g,'') + '-' + Math.random().toString(36).slice(2,7);
    mount.id = mountId;
    mount.style.position = 'absolute';
    mount.style.inset = '0';
    frame.appendChild(mount);

    void frame.offsetWidth;

    const watchdog = setTimeout(()=>{
      const hasIframe = frame.querySelector('iframe');
      if(!hasIframe){
        showFallback(frame, id);
        frame.classList.remove('loading');
        frame.classList.add('loaded');
      }
    }, 4000);

    function addUnmuteButton(player){
      const btn = document.createElement('button');
      btn.className = 'yt-unmute';
      btn.setAttribute('aria-label','Activar sonido');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        player.unMute();
        player.setVolume(100);
        btn.remove();
      });
      frame.appendChild(btn);
    }

    function create(){
      requestAnimationFrame(()=>{
        try{
          const player = new YT.Player(mountId, {
            videoId: id,
            playerVars: { autoplay: 1, mute: 1, rel: 0, modestbranding: 1, playsinline: 1 },
            events: {
              onReady: (e)=>{
                clearTimeout(watchdog);
                frame.classList.remove('loading');
                frame.classList.add('loaded');
                e.target.playVideo();
                addUnmuteButton(e.target);
              },
              onError: ()=>{
                clearTimeout(watchdog);
                showFallback(frame, id);
                frame.classList.remove('loading');
                frame.classList.add('loaded');
              }
            }
          });
        }catch(err){
          clearTimeout(watchdog);
          showFallback(frame, id);
          frame.classList.remove('loading');
          frame.classList.add('loaded');
        }
      });
    }

    if(apiReady && window.YT && window.YT.Player) create();
    else { pending.push(create); loadApi(); }
  }

  frames.forEach(frame=>{
    frame.addEventListener('click', ()=> playVideo(frame));
  });
})();

// ---------- SESIONES CAROUSEL ----------
(function initYtCarousel(){
  const track = document.getElementById('ytTrack');
  const prevBtn = document.getElementById('ytPrev');
  const nextBtn = document.getElementById('ytNext');
  const dotsWrap = document.getElementById('ytDots');
  if(!track) return;

  const cards = track.querySelectorAll('.yt-card');
  let index = 0;

  cards.forEach((_, i)=>{
    const dot = document.createElement('span');
    if(i===0) dot.classList.add('active');
    dot.addEventListener('click', ()=> goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('span');

  function update(){
    track.style.transform = `translateX(-${index*100}%)`;
    dots.forEach((d,i)=> d.classList.toggle('active', i===index));
  }
  function goTo(i){ index = i; update(); }

  prevBtn.addEventListener('click', ()=>{
    index = (index - 1 + cards.length) % cards.length;
    update();
  });
  nextBtn.addEventListener('click', ()=>{
    index = (index + 1) % cards.length;
    update();
  });

  let startX = 0;
  track.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  track.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if(diff > 50) prevBtn.click();
    else if(diff < -50) nextBtn.click();
  }, {passive:true});
})();
