// KreditPlus — script principal
// Supabase se inicializa desde supabase-client.js (cargado antes de este script)

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat("es-CO");

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar Supabase si está configurado
  if (typeof initSupabase === 'function') initSupabase();

  setupYear();
  setupMenu();
  setupSliders();
  setupReveal();
  setupCounters();
  setupModal();
  setupSolicitudForm();
  setupContactoForm();
  setupLoanCalculator();
  setupSavingsCalculator();
});

function setupYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

function setupMenu() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-primary-nav]");

  if (!header || !toggle || !nav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupSliders() {
  document.querySelectorAll("[data-slider]").forEach((slider) => {
    const track = slider.querySelector("[data-slider-track]");
    const slides = Array.from(track?.children || []);
    const dotsWrap = slider.querySelector("[data-slider-dots]");
    const prev = slider.querySelector("[data-slider-prev]");
    const next = slider.querySelector("[data-slider-next]");
    const autoplay = Number(slider.dataset.autoplay || 0);
    let index = 0;
    let timerId = null;

    if (!track || slides.length <= 1) {
      return;
    }

    const dots = slides.map((_, dotIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Ir al slide ${dotIndex + 1}`);
      button.addEventListener("click", () => {
        index = dotIndex;
        update();
        restart();
      });
      dotsWrap?.appendChild(button);
      return button;
    });

    function update() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function restart() {
      if (!autoplay) {
        return;
      }
      if (timerId) {
        window.clearInterval(timerId);
      }
      timerId = window.setInterval(() => {
        index = (index + 1) % slides.length;
        update();
      }, autoplay);
    }

    prev?.addEventListener("click", () => {
      index = (index - 1 + slides.length) % slides.length;
      update();
      restart();
    });

    next?.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      update();
      restart();
    });

    slider.addEventListener("mouseenter", () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    });

    slider.addEventListener("mouseleave", restart);

    update();
    restart();
  });
}

function setupReveal() {
  const nodes = document.querySelectorAll(".reveal");

  if (!nodes.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  nodes.forEach((node) => observer.observe(node));
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-counter]");

  if (!counters.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        currentObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(node) {
  const target = Number(node.dataset.counter || 0);
  const suffix = node.dataset.suffix || "";
  const prefix = node.dataset.prefix || "";
  const duration = 1500;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    node.textContent = `${prefix}${numberFormat.format(value)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function setupModal() {
  const modal = document.querySelector("[data-modal]");
  const overlay = modal?.querySelector("[data-modal-overlay]");
  const close = modal?.querySelector("[data-modal-close]");

  if (!modal) {
    return;
  }

  const openButtons = document.querySelectorAll("[data-modal-open]");

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", openModal);
  });

  close?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
}

// Formulario de precalificación (hero de index.html)
function setupSolicitudForm() {
  const form = document.querySelector("[data-quick-form]");
  if (!form) return;

  const btn = form.querySelector("button[type='submit']");
  const feedback = form.querySelector("[data-form-feedback]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

    const datos = {
      tipo_credito: form.querySelector('[name="tipo"]')?.value || '',
      monto:        form.querySelector('[name="monto"]')?.value || '',
      nombre:       form.querySelector('[name="nombre"]')?.value || '',
      celular:      form.querySelector('[name="celular"]')?.value || '',
      ciudad:       form.querySelector('[name="ciudad"]')?.value || ''
    };

    if (!datos.nombre || !datos.celular) {
      if (feedback) feedback.textContent = '⚠️ Nombre y celular son requeridos.';
      if (btn) { btn.disabled = false; btn.textContent = 'Quiero avanzar'; }
      return;
    }

    try {
      const result = typeof guardarSolicitud === 'function'
        ? await guardarSolicitud(datos)
        : { error: 'no_config' };

      if (result.error && result.error !== 'no_config') {
        if (feedback) feedback.textContent = '❌ Error al enviar. Intenta de nuevo.';
      } else {
        form.reset();
        if (feedback) feedback.textContent = '✅ ¡Solicitud recibida! Te contactamos pronto.';
        if (btn) btn.textContent = '¡Enviado!';
      }
    } catch (err) {
      if (feedback) feedback.textContent = '❌ Error de conexión. Intenta de nuevo.';
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

// Formulario de contacto (contacto.html)
function setupContactoForm() {
  const form = document.querySelector("[data-contacto-form]");
  if (!form) return;

  const btn = form.querySelector("button[type='submit']");
  const feedback = form.querySelector("[data-form-feedback]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

    const datos = {
      nombre:         form.querySelector('[name="full-name"]')?.value || '',
      email:          form.querySelector('[name="email"]')?.value || '',
      telefono:       form.querySelector('[name="phone"]')?.value || '',
      tipo_solicitud: form.querySelector('[name="topic"]')?.value || '',
      mensaje:        form.querySelector('[name="message"]')?.value || ''
    };

    if (!datos.nombre) {
      if (feedback) feedback.textContent = '⚠️ El nombre es requerido.';
      if (btn) { btn.disabled = false; btn.textContent = 'Enviar solicitud'; }
      return;
    }

    try {
      const result = typeof guardarContacto === 'function'
        ? await guardarContacto(datos)
        : { error: 'no_config' };

      if (result.error && result.error !== 'no_config') {
        if (feedback) feedback.textContent = '❌ Error al enviar. Intenta de nuevo.';
      } else {
        form.reset();
        if (feedback) feedback.textContent = '✅ Mensaje enviado. Te respondemos en menos de 24 horas.';
        if (btn) btn.textContent = '¡Enviado!';
      }
    } catch (err) {
      if (feedback) feedback.textContent = '❌ Error de conexión. Intenta de nuevo.';
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

function setupLoanCalculator() {
  const form = document.querySelector("[data-loan-form]");

  if (!form) {
    return;
  }

  const amount = form.querySelector("[name='amount']");
  const months = form.querySelector("[name='months']");
  const rate = form.querySelector("[name='rate']");
  const resultPayment = document.querySelector("[data-loan-payment]");
  const resultTotal = document.querySelector("[data-loan-total]");

  function update() {
    const principal = Number(amount?.value || 0);
    const term = Number(months?.value || 0);
    const annualRate = Number(rate?.value || 0);
    const monthlyRate = annualRate / 12 / 100;

    if (!principal || !term) {
      return;
    }

    let payment = 0;
    if (monthlyRate === 0) {
      payment = principal / term;
    } else {
      payment =
        (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
    }

    const total = payment * term;

    if (resultPayment) {
      resultPayment.textContent = currency.format(payment);
    }

    if (resultTotal) {
      resultTotal.textContent = currency.format(total);
    }
  }

  [amount, months, rate].forEach((field) =>
    field?.addEventListener("input", update)
  );

  update();
}

function setupSavingsCalculator() {
  const form = document.querySelector("[data-savings-form]");

  if (!form) {
    return;
  }

  const goal = form.querySelector("[name='goal']");
  const months = form.querySelector("[name='term']");
  const rate = form.querySelector("[name='yield']");
  const resultDeposit = document.querySelector("[data-savings-deposit]");
  const resultEnd = document.querySelector("[data-savings-end]");

  function update() {
    const target = Number(goal?.value || 0);
    const term = Number(months?.value || 0);
    const monthlyRate = Number(rate?.value || 0) / 12 / 100;

    if (!target || !term) {
      return;
    }

    let deposit = 0;

    if (monthlyRate === 0) {
      deposit = target / term;
    } else {
      deposit = target / ((Math.pow(1 + monthlyRate, term) - 1) / monthlyRate);
    }

    if (resultDeposit) {
      resultDeposit.textContent = currency.format(deposit);
    }

    if (resultEnd) {
      resultEnd.textContent = `${term} meses`;
    }
  }

  [goal, months, rate].forEach((field) =>
    field?.addEventListener("input", update)
  );

  update();
}
