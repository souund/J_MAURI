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

// ---------- SESIONES — un solo player maestro reutilizable ----------
(function initYtFacades(){
  const frames = document.querySelectorAll('.yt-frame');
  if(!frames.length) return;

  let apiReady = false;
  let apiLoading = false;
  const pending = [];

  function loadApi(){
    if(window.YT && window.YT.Player){ apiReady = true; return; }
    if(apiLoading) return;
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

  let activePlayer = null;
  let activeFrame = null;
  let unmuteBtn = null;

  function destroyActive(){
    if(activePlayer){
      try{ activePlayer.destroy(); }catch(e){}
      activePlayer = null;
    }
    if(activeFrame) activeFrame.classList.remove('loading','loaded');
    if(unmuteBtn){ unmuteBtn.remove(); unmuteBtn = null; }
    document.querySelectorAll('.yt-mount').forEach(m => m.remove());
  }

  function restoreThumb(frame){
    const id = frame.dataset.ytId;
    frame.innerHTML =
      '<img class="yt-thumb" src="https://img.youtube.com/vi/' + id + '/hqdefault.jpg" alt=""/>' +
      '<button class="yt-play" aria-label="Reproducir"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>';
  }

  function showFallback(frame, id){
    frame.classList.remove('loading');
    frame.classList.add('loaded');
    frame.innerHTML =
      '<div class="yt-fallback">' +
        '<p>Este video no se puede reproducir aquí.</p>' +
        '<a href="https://youtu.be/' + id + '" target="_blank" rel="noopener">Ver en YouTube ↗</a>' +
      '</div>';
  }

  function addUnmuteButton(frame, player){
    const btn = document.createElement('button');
    btn.className = 'yt-unmute';
    btn.setAttribute('aria-label','Activar sonido');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm12.5-.9a5 5 0 0 1 0 7.8l-1.2-1.3a3.3 3.3 0 0 0 0-5.2l1.2-1.3zm2.1-2.1a8 8 0 0 1 0 12l-1.2-1.3a6.3 6.3 0 0 0 0-9.4l1.2-1.3z"/></svg>';
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      try{ player.unMute(); player.setVolume(100); }catch(err){}
      btn.remove();
    });
    frame.appendChild(btn);
    unmuteBtn = btn;
  }

  function playVideo(frame){
    if(activeFrame === frame && frame.classList.contains('loaded')) return;

    const id = frame.dataset.ytId;
    const prevFrame = activeFrame;

    destroyActive();

    activeFrame = frame;

    // Restauramos la portada de la tarjeta anterior (si existía)
    if(prevFrame) restoreThumb(prevFrame);

    frame.classList.add('loading');

    const mount = document.createElement('div');
    mount.className = 'yt-mount';
    frame.appendChild(mount);

    const watchdog = setTimeout(()=>{
      if(!frame.querySelector('iframe')){
        showFallback(frame, id);
        activeFrame = null;
      }
    }, 8000);

    function create(){
      if(!apiReady || !window.YT || !window.YT.Player){ pending.push(create); loadApi(); return; }
      try{
        activePlayer = new YT.Player(mount, {
          videoId: id,
          width: '100%',
          height: '100%',
          playerVars: { autoplay: 1, mute: 1, rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: (e)=>{
              clearTimeout(watchdog);
              frame.classList.remove('loading');
              frame.classList.add('loaded');
              try{ e.target.playVideo(); }catch(err){}
              addUnmuteButton(frame, e.target);
            },
            onError: ()=>{
              clearTimeout(watchdog);
              showFallback(frame, id);
              activeFrame = null;
            }
          }
        });
      }catch(err){
        clearTimeout(watchdog);
        showFallback(frame, id);
        activeFrame = null;
      }
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
    track.style.transform = 'translateX(-' + (index*100) + '%)';
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
