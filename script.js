(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Black hole background video ---------- */
  const video = $('.bg-video');
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');

    if (reduceMotion) {
      video.pause();
    } else {
      const startVideo = () => video.play().catch(() => {});
      startVideo();

      // Some browsers block autoplay until the first interaction, so retry then
      const retry = () => {
        startVideo();
        window.removeEventListener('pointerdown', retry);
        window.removeEventListener('keydown', retry);
      };
      window.addEventListener('pointerdown', retry);
      window.addEventListener('keydown', retry);
    }
  }

  /* ---------- Scroll progress ---------- */
  const progress = $('#progress-bar');
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* ---------- Mobile menu ---------- */
  const menuToggle = $('#menu-toggle');
  const nav = $('#site-nav');

  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };

  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });

  $$('.nav-link').forEach((link) => link.addEventListener('click', closeMenu));

  /* ---------- Active nav link while scrolling ---------- */
  const navLinks = $$('.nav-link');
  const sections = navLinks
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) =>
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );
  sections.forEach((section) => navObserver.observe(section));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Hero typewriter ---------- */
  const typed = $('#typed');
  const roles = ['Frontend developer', 'AI/ML learner', 'Educational creator'];

  if (reduceMotion) {
    typed.textContent = roles[0];
  } else {
    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const type = () => {
      const word = roles[roleIndex];

      if (!deleting) {
        charIndex++;
        typed.textContent = word.slice(0, charIndex);
        if (charIndex === word.length) {
          deleting = true;
          return setTimeout(type, 1600);
        }
        return setTimeout(type, 90);
      }

      charIndex--;
      typed.textContent = word.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        return setTimeout(type, 400);
      }
      setTimeout(type, 45);
    };

    type();
  }

  /* ---------- Count-up stats ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.target);
    const decimals = Number(el.dataset.decimals) || 0;
    const suffix = el.dataset.suffix || '';

    if (reduceMotion) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const frame = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const statObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  $$('.stat-number').forEach((el) => statObserver.observe(el));

  /* ---------- Filter tabs (projects and skills) ---------- */
  const setupFilter = (listId, itemSelector, countEl) => {
    const tabs = $$(`#${listId} .tab`);

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', String(active));
        });

        const filter = tab.dataset.filter;
        let visible = 0;

        $$(itemSelector).forEach((item) => {
          const categories = (item.dataset.category || '').split(' ');
          const show = filter === 'all' || categories.includes(filter);
          item.classList.toggle('is-hidden', !show);
          if (show) visible++;
        });

        if (countEl) countEl.textContent = visible;
      });
    });
  };

  setupFilter('project-tabs', '.project-card');
  setupFilter('skill-tabs', '.skill-node', $('#node-count'));

  /* ---------- Copy email ---------- */
  const email = $('#contact-email').textContent.trim();
  const toast = $('#toast');
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2200);
  };

  $('#copy-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard');
    } catch {
      const range = document.createRange();
      range.selectNodeContents($('#contact-email'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      showToast('Press Ctrl+C to copy');
    }
  });

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  $('#contact-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = $('#form-name').value.trim();
    const from = $('#form-email').value.trim();
    const message = $('#form-message').value.trim();

    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${from}>`);

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    $('#form-status').textContent = 'Opening your email app...';
    e.target.reset();
  });

  /* ---------- Custom cursor (desktop with a mouse only) ---------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add('has-custom-cursor');

    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      document.body.classList.add('cursor-ready');
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      requestAnimationFrame(animateRing);
    };
    animateRing();

    const hoverTargets = 'a, button, .card, .tab, .skill-node, .hero-frame';

    document.addEventListener('pointerover', (e) => {
      if (e.target.closest(hoverTargets)) document.body.classList.add('cursor-hover');
    });

    document.addEventListener('pointerout', (e) => {
      if (e.target.closest(hoverTargets)) document.body.classList.remove('cursor-hover');
    });

    document.addEventListener('pointerdown', () => document.body.classList.add('cursor-press'));
    document.addEventListener('pointerup', () => document.body.classList.remove('cursor-press'));

    document.addEventListener('pointerleave', () => {
      document.body.classList.remove('cursor-ready');
    });
  }

  /* ---------- 3D tilt on the photo frame ---------- */
  const frame = $('.hero-frame');
  if (finePointer && !reduceMotion) {
    frame.addEventListener('pointermove', (e) => {
      const rect = frame.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      frame.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    });

    frame.addEventListener('pointerleave', () => {
      frame.style.transform = '';
    });
  }
})();