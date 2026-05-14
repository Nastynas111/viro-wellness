/* VIRO — interactions
   ------------------------------------------------------------ */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ---------- year ----------
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- nav: scroll state ----------
  const nav = $('#nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // ---------- nav: mobile burger ----------
  const burger = $('#navBurger');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    // close on link tap
    $$('.nav__links a').forEach(a =>
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  // ---------- reveal on scroll ----------
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = $$('.reveal');
  if (reveals.length && 'IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  // ---------- count-up stats ----------
  const counters = $$('.js-count');
  if (counters.length && 'IntersectionObserver' in window && !prefersReduced) {
    const animateCount = (el) => {
      const to = parseFloat(el.dataset.to || '0');
      const finalLabel = el.dataset.final ? parseFloat(el.dataset.final) : to;
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const dur = 1500;
      const start = performance.now();
      const initial = 0;
      const target = finalLabel;
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const val = initial + (target - initial) * easeOut(t);
        el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(c => {
      const finalLabel = c.dataset.final ? parseFloat(c.dataset.final) : parseFloat(c.dataset.to || '0');
      const decimals = parseInt(c.dataset.decimals || '0', 10);
      c.textContent = decimals ? finalLabel.toFixed(decimals) : Math.round(finalLabel).toLocaleString();
    });
  }

  // ---------- quiz ----------
  (function quiz() {
    const card = $('#quizCard');
    if (!card) return;

    const steps = $$('.quiz__step', card);
    const total = steps.filter(s => s.dataset.step !== 'done').length;
    const bar   = $('#quizBar');
    const stepN = $('#quizStep');
    const totalN= $('#quizTotal');
    const pctN  = $('#quizPct');
    const back  = $('#quizBack');
    const form  = $('#quizForm');

    if (totalN) totalN.textContent = total;
    const history = [];
    let current = 1;

    function show(stepKey) {
      steps.forEach(s => s.classList.toggle('is-active', String(s.dataset.step) === String(stepKey)));
      const isDone = stepKey === 'done';
      const idx = isDone ? total : Number(stepKey);
      const pct = isDone ? 100 : Math.round((idx / total) * 100);
      if (bar)   bar.style.width = pct + '%';
      if (stepN) stepN.textContent = isDone ? total : idx;
      if (pctN)  pctN.textContent  = pct + '%';
      if (back)  back.hidden = history.length === 0 || isDone;
      current = stepKey;
    }

    $$('.quiz__opt', card).forEach(btn => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.next;
        if (!next) return;
        history.push(current);
        show(next);
      });
    });

    if (back) {
      back.addEventListener('click', () => {
        const prev = history.pop();
        if (prev != null) show(prev);
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('#quizEmail').value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          $('#quizEmail').focus();
          return;
        }
        // TODO: POST to backend / Klaviyo / Shopify customer
        try {
          const waitlist = JSON.parse(localStorage.getItem('viro_waitlist') || '[]');
          waitlist.push({ email, source: 'quiz', ts: Date.now() });
          localStorage.setItem('viro_waitlist', JSON.stringify(waitlist));
        } catch (_) { /* noop */ }
        show('done');
      });
    }

    show(1);
  })();

  // ---------- checkout modal ----------
  (function modal() {
    const modal = $('#modalCheckout');
    if (!modal) return;
    const form = $('#waitlistForm');
    const success = $('#waitlistSuccess');

    function open() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const input = $('#waitlistEmail');
      if (input) setTimeout(() => input.focus(), 80);
    }
    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    // Intercept any link whose href ends with #checkout-coming-soon OR has .js-checkout
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (a.classList.contains('js-checkout') || href.endsWith('#checkout-coming-soon')) {
        e.preventDefault();
        open();
      }
    });

    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = $('#waitlistEmail');
        const email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          input.focus();
          input.style.borderColor = '#c9a84c';
          return;
        }
        try {
          const waitlist = JSON.parse(localStorage.getItem('viro_waitlist') || '[]');
          waitlist.push({ email, source: 'modal', ts: Date.now() });
          localStorage.setItem('viro_waitlist', JSON.stringify(waitlist));
        } catch (_) { /* noop */ }
        if (success) success.hidden = false;
        form.hidden = true;
      });
    }
  })();

  // ---------- testimonial cards: keyboard activate ----------
  $$('.vcard__media').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Hook for future modal/video player
        card.click();
      }
    });
  });

})();
