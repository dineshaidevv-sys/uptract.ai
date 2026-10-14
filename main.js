// A lightweight custom cursor for mouse and precision-pointer devices.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Keep the branded intro brief, with a hard fallback if a slow asset stalls the load event.
const pageLoader = document.querySelector('#page-loader');
if (pageLoader) {
  let loaderDismissed = false;
  const dismissLoader = () => {
    if (loaderDismissed) return;
    loaderDismissed = true;
    pageLoader.classList.add('is-hidden');
    pageLoader.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => pageLoader.remove(), 500);
  };

  window.addEventListener('load', () => window.setTimeout(dismissLoader, 180), { once: true });
  window.setTimeout(dismissLoader, 1800);
}

if (finePointer.matches && !reducedMotion.matches) {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="cursor-dot"></span><span class="cursor-ring"></span>';
  document.body.append(cursor);

  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let ringX = pointerX;
  let ringY = pointerY;
  let frame = 0;

  document.addEventListener('pointermove', (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    if (!cursor.classList.contains('is-visible')) cursor.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(animateRing);
  });

  function animateRing() {
    ringX += (pointerX - ringX) * 0.18;
    ringY += (pointerY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    if (Math.abs(pointerX - ringX) + Math.abs(pointerY - ringY) > 0.15) {
      frame = requestAnimationFrame(animateRing);
    } else {
      frame = 0;
    }
  }

  document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
  document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  document.addEventListener('pointerenter', () => cursor.classList.add('is-visible'));

  document.querySelectorAll('a, button, summary, input, textarea, [role="button"]').forEach((target) => {
    target.addEventListener('pointerenter', () => cursor.classList.add('is-interactive'));
    target.addEventListener('pointerleave', () => cursor.classList.remove('is-interactive'));
  });
}
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
      navigation.classList.remove('is-open');
    });
  });

  document.addEventListener('click', (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
      navigation.classList.remove('is-open');
    }
  });
}

// A small scroll state makes the sticky header feel anchored once the page moves.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const updateHeader = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;

    faqItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.removeAttribute('open');
      }
    });
  });
});

// Reveal content as it enters view without making the page depend on animation support.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });

  document.querySelectorAll('.intro-inner, .section-heading, .benefit-card, .approach-copy, .plan-card, .testimonial-card, .faq-item')
    .forEach((element) => {
      element.classList.add('reveal-on-scroll');
      const siblingIndex = Array.prototype.indexOf.call(element.parentElement.children, element);
      element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 3) * 65}ms`);
      revealObserver.observe(element);
    });
}

const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxJgDGnoDN2JaiulosO9msYPSat-quFWJyCDH2vlferKY_bKrtzkblmdWwvWTQZ1bV8DA/exec';
const contactForm = document.querySelector('.contact-form');
const formNote = document.querySelector('.form-note');
const yearNode = document.querySelector('#current-year');

if (yearNode) yearNode.textContent = String(new Date().getFullYear());

if (contactForm && formNote) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const submitLabel = submitButton?.querySelector('.button-label');
  const submitFrame = document.querySelector('.sheet-submit-frame');
  let activeRequestId = null;
  let submissionTimeout = null;

  function finishSubmission(success, name, message) {
    if (!activeRequestId) return;

    activeRequestId = null;
    window.clearTimeout(submissionTimeout);
    contactForm.querySelector('input[name="requestId"]')?.remove();
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.classList.remove('is-loading');
    if (submitLabel) submitLabel.textContent = 'Start free trial';
    formNote.classList.toggle('is-error', !success);
    formNote.textContent = success
      ? `Thanks${name ? `, ${name}` : ''}! Your enquiry has been received. We will be in touch soon.`
      : message;

    if (success) contactForm.reset();
  }

  window.addEventListener('message', (event) => {
    const response = event.data;
    // Apps Script may redirect the response to a Googleusercontent host.
    const trustedOrigin = event.origin === 'https://script.google.com'
      || event.origin === 'https://script.googleusercontent.com'
      || event.origin.endsWith('.googleusercontent.com');

    if (!trustedOrigin || !response || response.type !== 'uptract-sheet-response'
      || response.requestId !== activeRequestId) return;

    finishSubmission(response.ok === true, contactForm.querySelector('input[name="name"]').value.trim(),
      response.ok === true ? '' : 'We could not save your enquiry. Please try again.');
  });

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!contactForm.reportValidity()) {
      formNote.textContent = 'Please complete the required fields before submitting.';
      return;
    }

    if (!GOOGLE_SHEETS_WEB_APP_URL || !submitFrame || !submitButton) {
      formNote.classList.add('is-error');
      formNote.textContent = 'Form submission is not configured yet. Please try again later.';
      return;
    }

    formNote.classList.remove('is-error');
    const name = contactForm.querySelector('input[name="name"]').value.trim();
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requestInput = document.createElement('input');
    requestInput.type = 'hidden';
    requestInput.name = 'requestId';
    requestInput.value = requestId;
    contactForm.append(requestInput);

    activeRequestId = requestId;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.classList.add('is-loading');
    if (submitLabel) submitLabel.textContent = 'Sending...';
    formNote.textContent = 'Sending your enquiry...';
    contactForm.action = GOOGLE_SHEETS_WEB_APP_URL;
    contactForm.method = 'post';
    contactForm.target = submitFrame.name;
    submissionTimeout = window.setTimeout(() => {
      finishSubmission(false, name, 'We could not confirm the save. Check your Sheet before resubmitting to avoid a duplicate.');
    }, 30000);
    HTMLFormElement.prototype.submit.call(contactForm);
  });
}
