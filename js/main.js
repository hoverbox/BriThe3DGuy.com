// ============================================================
//  main.js — shared across all pages
// ============================================================

// --- Mobile nav toggle ---
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  // Close nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// --- Mark active nav link based on current page ---
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// --- Newsletter form handler ---
// Replace the alert below with your real email service (Mailchimp, ConvertKit, etc.)
function handleSubscribe(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;
  const btn   = e.target.querySelector('button');
  btn.textContent = '✓ You\'re in!';
  btn.style.background = '#1db954';
  setTimeout(() => {
    btn.textContent = 'Subscribe';
    btn.style.background = '';
    e.target.reset();
  }, 3000);
  // TODO: POST to your email service API here
  console.log('Subscribed:', email);
}
