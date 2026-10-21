// Sim Story Universe · лёгкие «живые» эффекты поверх интерфейса.
// Ничего не меняет в данных и в React-коде: только добавляет классы и декор.

const REVEAL_SELECTOR = [
  '.character-card', '.story-card', '.moment-card', '.stat-card', '.relationship-card',
  '.idea-card', '.favorite-card', '.recent-story', '.quote-card', '.search-result-card',
  '.dynasty-chapter', '.detail-section', '.backup-option', '.result-group', '.tag-cloud-section',
  '.home-bottom-line', '.inspiration-strip',
].join(',');

const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia?.('(pointer: fine)').matches;

// ---------- Появление карточек при прокрутке ----------
function setupReveal() {
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('rv-in');
      io.unobserve(entry.target);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  const seen = new WeakSet();
  const scan = (root = document) => {
    const found = root.querySelectorAll ? root.querySelectorAll(REVEAL_SELECTOR) : [];
    let batch = 0;
    found.forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.classList.add('rv');
      el.style.setProperty('--rv-delay', `${Math.min(batch, 8) * 70}ms`);
      batch += 1;
      io.observe(el);
    });
  };

  scan();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
}

// ---------- Полоска прогресса прокрутки ----------
function setupProgress() {
  const bar = document.createElement('div');
  bar.className = 'ssu-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ---------- Звёздный след за курсором (только мышь) ----------
function setupSparkles() {
  if (reduceMotion || !finePointer) return;
  const glyphs = ['✦', '✧', '✿', '♡', '·'];
  const colors = ['#e9a7c0', '#cdbfe8', '#a9d3c0', '#f3c6a8', '#f0cf8d'];
  let last = 0;
  let alive = 0;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const t = performance.now();
    if (t - last < 55 || alive > 22) return;
    last = t;
    const el = document.createElement('span');
    el.className = 'ssu-spark';
    el.textContent = glyphs[(Math.random() * glyphs.length) | 0];
    el.style.left = `${e.clientX}px`;
    el.style.top = `${e.clientY}px`;
    el.style.color = colors[(Math.random() * colors.length) | 0];
    el.style.fontSize = `${9 + Math.random() * 9}px`;
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 46}px`);
    el.style.setProperty('--dy', `${14 + Math.random() * 30}px`);
    el.style.setProperty('--rot', `${(Math.random() - 0.5) * 120}deg`);
    document.body.appendChild(el);
    alive += 1;
    setTimeout(() => { el.remove(); alive -= 1; }, 1000);
  }, { passive: true });
}

// ---------- Ночная тема ----------
function setupTheme() {
  const KEY = 'ssu-theme';
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, v); } catch { /* ignore */ } };

  const saved = read();
  const preferred = saved || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day');
  const apply = (mode) => {
    if (mode === 'night') root.setAttribute('data-theme', 'night'); else root.removeAttribute('data-theme');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'night' ? '#1f1620' : '#fbf4f4');
    button.textContent = mode === 'night' ? '☀️' : '🌙';
    button.setAttribute('aria-label', mode === 'night' ? 'Включить дневную тему' : 'Включить ночную тему');
    button.title = button.getAttribute('aria-label');
  };

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ssu-theme-toggle';
  document.body.appendChild(button);

  let mode = preferred;
  apply(mode);
  button.addEventListener('click', () => {
    mode = mode === 'night' ? 'day' : 'night';
    write(mode);
    apply(mode);
  });
}

export function initEnhancements() {
  if (typeof document === 'undefined') return;
  setupTheme();
  setupProgress();
  setupSparkles();
  setupReveal();
}