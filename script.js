/* ==========================================================================
   J MAURI — PRESS KIT 2026
   ========================================================================== */

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

  // Delegated: works even for gallery items added later
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
