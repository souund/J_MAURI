// ===== Menu toggle (mobile) =====
const menuToggle = document.getElementById('menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
  });
}

// ===== Cerrar menu al hacer click en un link =====
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('active');
  });
});

// ===== Header con fondo al hacer scroll =====
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.style.background = 'rgba(13,13,13,0.98)';
  } else {
    header.style.background = 'rgba(13,13,13,0.85)';
  }
});

// ===== Formulario de contacto =====
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Aquí puedes integrar EmailJS, Formspree o tu backend
    alert('Mensaje enviado. ¡Gracias por contactar!');
    form.reset();
  });
}
