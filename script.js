/* ==========================================================================
   J MAURI — PRESS KIT 2026 — "PERREO ESPACIAL"
   ========================================================================== */

// ---------- LOADER ----------
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('fade-out');
  }, 1200);
});

// ---------- CUSTOM CURSOR ----------
(function initCursor(){
  const cdot = document.getElementById('cdot');
  const cring = document.getElementById('cring');
  if(!cdot || !cring) return;
  if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  let mouseX=0, mouseY=0, ringX=0, ringY=0;
  document.addEventListener('mousemove',(e)=>{
    mouseX=e.clientX; mouseY=e.clientY;
    cdot.style.left=mouseX+'px'; cdot.style.top=mouseY+'px';
  });
  function animateRing(){
    ringX += (mouseX-ringX)*0.15;
    ringY += (mouseY-ringY)*0.15;
    cring.style.left=ringX+'px'; cring.style.top=ringY+'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
})();

// ---------- STARFIELD CANVAS (twinkling stars + slow drift) ----------
(function initStarfield(){
  const canvas = document.getElementById('starfield');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];
  const STAR_COUNT = window.innerWidth < 768 ? 90 : 180;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.documentElement.scrollHeight;
  }
  function initStars(){
    stars = Array.from({length: STAR_COUNT}, () => ({
      x: Math.random()*w,
      y: Math.random()*h,
      r: Math.random()*1.4 + 0.3,
      baseAlpha: Math.random()*0.6 + 0.2,
      twinkleSpeed: Math.random()*0.02 + 0.005,
      phase: Math.random()*Math.PI*2,
      hue: Math.random() > 0.85 ? 'magenta' : 'cyan'
    }));
  }
  function draw(t){
    ctx.clearRect(0,0,w,h);
    stars.forEach(s=>{
      const alpha = s.baseAlpha + Math.sin(t*s.twinkleSpeed + s.phase)*0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = s.hue === 'magenta'
        ? `rgba(255,47,208,${Math.max(0,alpha)})`
        : `rgba(255,255,255,${Math.max(0,alpha)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize();
  initStars();
  requestAnimationFrame(draw);
  window.addEventListener('resize', ()=>{ resize(); initStars(); });
})();

// ---------- WARP DIVIDERS (particle streak canvas between sections) ----------
(function initWarpDividers(){
  const canvases = document.querySelectorAll('.warp-canvas');
  canvases.forEach(canvas=>{
    const ctx = canvas.getContext('2d');
    let w,h, particles=[];
    function resize(){
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    function init(){
      particles = Array.from({length: 40}, ()=>({
        x: Math.random()*w,
        y: Math.random()*h,
        len: Math.random()*30+10,
        speed: Math.random()*2+1,
        alpha: Math.random()*0.5+0.2
      }));
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p=>{
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(p.x+p.len,p.y);
        ctx.strokeStyle = `rgba(55,232,255,${p.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        p.x += p.speed;
        if(p.x > w) p.x = -p.len;
      });
      requestAnimationFrame(draw);
    }
    resize(); init();
    requestAnimationFrame(draw);
    window.addEventListener('resize', ()=>{ resize(); init(); });
  });
})();

// ---------- SECTION REVEAL ON SCROLL ----------
(function initReveal(){
  const targets = document.querySelectorAll('.tray-block,.stat-card,.tl-item,.rider-setup,.hero-bio-panel');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => io.observe(t));
})();

// ---------- NAV DOTS ACTIVE STATE ----------
(function initNavDots(){
  const sections = document.querySelectorAll('.section');
  const dots = document.querySelectorAll('.navdot');
  if(!sections.length || !dots.length) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const id = entry.target.id;
        dots.forEach(d=>{
          d.classList.toggle('active', d.getAttribute('href') === '#'+id);
        });
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(s => io.observe(s));
})();

// ---------- YOUTUBE CAROUSEL ----------
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

  // basic touch swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  track.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - startX;
    if(diff > 50) prevBtn.click();
    else if(diff < -50) nextBtn.click();
  }, {passive:true});
})();

// ---------- TIMELINE SCROLL SNAP (horizontal drag on desktop) ----------
(function initTimelineDrag(){
  const wrap = document.querySelector('.timeline-wrap');
  if(!wrap) return;
  let isDown = false, startX, scrollLeft;

  wrap.addEventListener('mousedown', e=>{
    isDown = true;
    startX = e.pageX - wrap.offsetLeft;
    scrollLeft = wrap.scrollLeft;
    wrap.style.cursor = 'grabbing';
  });
  ['mouseleave','mouseup'].forEach(evt=>{
    wrap.addEventListener(evt, ()=>{ isDown = false; wrap.style.cursor = 'grab'; });
  });
  wrap.addEventListener('mousemove', e=>{
    if(!isDown) return;
    e.preventDefault();
    const x = e.pageX - wrap.offsetLeft;
    wrap.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
})();

// ---------- OCCASIONAL SCREEN FLASH (subtle, on fast scroll) ----------
(function initScreenFlash(){
  const flash = document.getElementById('screenFlash');
  if(!flash) return;
  let lastFlash = 0;
  window.addEventListener('scroll', ()=>{
    const now = Date.now();
    if(now - lastFlash > 4000 && Math.random() > 0.85){
      flash.classList.add('active');
      setTimeout(()=> flash.classList.remove('active'), 150);
      lastFlash = now;
    }
  });
})();
