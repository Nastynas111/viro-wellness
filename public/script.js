/* =========================================================
   VIRO — script.js v2
   Reveal animations, sticky nav, parallax-lite, counters,
   subscribe toggles, waitlist modal.
   ========================================================= */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Sticky nav scroll state ----------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const burger = document.getElementById('navBurger');
  const navMobile = document.getElementById('navMobile');
  const closeMobile = () => {
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    navMobile?.classList.remove('is-open');
    navMobile?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };
  burger?.addEventListener('click', () => {
    const open = !burger.classList.contains('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    navMobile?.classList.toggle('is-open', open);
    navMobile?.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('no-scroll', open);
  });
  navMobile?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // Stagger siblings inside same parent
          const siblings = Array.from(el.parentElement?.children || []).filter(c => c.classList.contains('reveal'));
          const i = siblings.indexOf(el);
          const delay = Math.min(i, 6) * 80;
          el.style.transitionDelay = delay + 'ms';
          el.classList.add('is-in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  // ---------- Count-up stats ----------
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1600;
    const start = performance.now();
    const startVal = 0;
    const format = (n) => n >= 1000 ? n.toLocaleString('en-US') : String(n);
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // ease out
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(startVal + (target - startVal) * eased);
      el.textContent = format(val);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = format(target);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && !reduceMotion) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(c => { c.textContent = parseInt(c.dataset.count, 10).toLocaleString('en-US'); });
  }

  // ---------- Parallax-lite ----------
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        const offset = center * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      });
      ticking = false;
    };
    const onScrollParallax = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScrollParallax, { passive: true });
    update();
  }

  // ---------- Subscribe / one-time pill toggle ----------
  document.querySelectorAll('.product__toggle').forEach(group => {
    const pills = group.querySelectorAll('.pill');
    pills.forEach(p => {
      p.addEventListener('click', (e) => {
        e.preventDefault();
        pills.forEach(x => x.classList.remove('pill--on'));
        p.classList.add('pill--on');
        const mode = p.dataset.mode;
        const card = group.closest('.product');
        const priceNow = card?.querySelector('.product__price-now');
        const priceSub = card?.querySelector('.product__price-sub');
        if (!priceNow || !priceSub) return;

        // First time: stash originals
        if (!priceNow.dataset.original) {
          priceNow.dataset.original = priceNow.textContent;
          priceSub.dataset.original = priceSub.textContent;
        }
        const original = priceNow.dataset.original;
        const num = parseFloat(original.replace(/[^0-9.]/g, '')) || 0;
        if (mode === 'sub') {
          const discounted = (num * 0.8).toFixed(2);
          priceNow.textContent = '$' + discounted;
          priceSub.textContent = 'Ships every 30 days · cancel anytime';
        } else {
          priceNow.textContent = priceSub.dataset.original ? original : original;
          priceSub.textContent = priceSub.dataset.original;
        }
      });
    });
  });

  // ---------- Waitlist modal ----------
  const modal = document.getElementById('checkoutModal');
  const successMsg = document.getElementById('waitlistSuccess');
  const openModal = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    setTimeout(() => modal.querySelector('input[type="email"]')?.focus(), 50);
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    successMsg?.setAttribute('hidden', '');
    const form = document.getElementById('waitlistForm');
    form?.reset();
    form?.querySelector('button[type="submit"]')?.removeAttribute('disabled');
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.js-checkout');
    if (trigger) {
      e.preventDefault();
      openModal();
      return;
    }
    if (e.target.closest('.js-modal-close')) {
      e.preventDefault();
      closeModal();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  // ---------- Waitlist persistence ----------
  const saveEmail = (email) => {
    try {
      const key = 'viro_waitlist';
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const entry = { email, ts: Date.now() };
      if (!list.some(e => e.email === email)) list.push(entry);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) { /* storage blocked, ignore */ }
  };

  // Modal form
  const waitForm = document.getElementById('waitlistForm');
  waitForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = waitForm.querySelector('input[type="email"]');
    const email = (input?.value || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input?.focus();
      return;
    }
    saveEmail(email);
    const btn = waitForm.querySelector('button[type="submit"]');
    btn?.setAttribute('disabled', '');
    successMsg?.removeAttribute('hidden');
  });

  // Final CTA form
  const finalForm = document.getElementById('finalCtaForm');
  finalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = finalForm.querySelector('input[type="email"]');
    const email = (input?.value || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      input?.focus();
      return;
    }
    saveEmail(email);
    input.value = '';
    openModal();
    if (successMsg) {
      successMsg.removeAttribute('hidden');
      successMsg.textContent = "You're in. Welcome to VIRO. ⟁";
    }
  });

  // ---------- Smooth in-page anchors (account for sticky nav) ----------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // ---------- Hero product subtle tilt on pointer move ----------
  const heroProduct = document.querySelector('.hero__product');
  if (heroProduct && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const img = heroProduct.querySelector('.hero__product-img');
    if (img) {
      heroProduct.addEventListener('pointermove', (e) => {
        const rect = heroProduct.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        img.style.transform = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
      heroProduct.addEventListener('pointerleave', () => {
        img.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
      });
    }
  }

})();
