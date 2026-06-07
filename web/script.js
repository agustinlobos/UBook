// UBook - script.js
// Controla interacciones básicas de la landing page.
// Más adelante esto se puede conectar a Supabase, backend o CRM.

document.addEventListener("DOMContentLoaded", () => {
  initActionButtons();
  initWaitlistForm();
  initScrollAnimations();
  initNavigationState();
});

/* =========================================
   CONFIGURACIÓN GENERAL
========================================= */

const UNIVERSITY_DOMAINS = [
  "udd.cl",
  "uandes.cl",
  "duocuc.cl",
  "uc.cl",
  "uchile.cl",
  "usach.cl",
  "udp.cl",
  "unab.cl",
  "uai.cl",
  "umayor.cl",
  "santotomas.cl",
  "uss.cl",
  "utem.cl",
  "ufrontera.cl",
  "uct.cl",
  "uach.cl",
  "ucsc.cl",
  "ubiobio.cl",
  "utalca.cl"
];

const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "live.com",
  "msn.com",
  "protonmail.com"
];

/* =========================================
   UTILIDADES
========================================= */

function scrollToElement(selector) {
  const element = document.querySelector(selector);

  if (!element) return;

  element.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function showToast(message, type = "info") {
  const oldToast = document.querySelector(".ubook-toast");

  if (oldToast) {
    oldToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `ubook-toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 50);

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

function getEmailDomain(email) {
  return email.trim().toLowerCase().split("@")[1] || "";
}

function isUniversityEmail(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail.includes("@")) {
    return false;
  }

  const domain = getEmailDomain(cleanEmail);

  if (!domain) {
    return false;
  }

  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) {
    return false;
  }

  return UNIVERSITY_DOMAINS.some((universityDomain) => {
    return domain === universityDomain || domain.endsWith(`.${universityDomain}`);
  });
}

function getWaitlistData() {
  return JSON.parse(localStorage.getItem("ubook_waitlist")) || [];
}

function saveWaitlistData(data) {
  localStorage.setItem("ubook_waitlist", JSON.stringify(data));
}

/* =========================================
   BOTONES CON DATA-ACTION
========================================= */

function initActionButtons() {
  const buttons = document.querySelectorAll("[data-action]");

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const action = button.dataset.action;

      if (action === "submit-waitlist") {
        return;
      }

      event.preventDefault();

      handleAction(action);
    });
  });
}

function handleAction(action) {
  switch (action) {
    case "open-waitlist":
      scrollToElement("#waitlist");
      break;

    case "show-how-it-works":
      scrollToElement("#how-it-works");
      break;

    case "request-turn":
      showToast(
        "La solicitud de turnos estará disponible en la app. Por ahora puedes unirte a la lista de espera.",
        "info"
      );

      setTimeout(() => {
        scrollToElement("#waitlist");
      }, 900);
      break;

    default:
      console.warn("Acción no reconocida:", action);
  }
}

/* =========================================
   FORMULARIO LISTA DE ESPERA
========================================= */

function initWaitlistForm() {
  const form = document.querySelector('[data-form="waitlist"]');

  if (!form) return;

  const inputs = form.querySelectorAll("input");

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleWaitlistSubmit(form);
  });
}

function handleWaitlistSubmit(form) {
  const nameInput = form.querySelector('input[name="name"]');
  const universityInput = form.querySelector('input[name="university"]');
  const communeInput = form.querySelector('input[name="commune"]');
  const emailInput = form.querySelector('input[name="email"]');

  const name = nameInput.value.trim();
  const university = universityInput.value.trim();
  const commune = communeInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  clearFormErrors(form);

  if (!name) {
    markInputError(nameInput, "Ingresa tu nombre.");
    return;
  }

  if (!university) {
    markInputError(universityInput, "Ingresa tu universidad.");
    return;
  }

  if (!commune) {
    markInputError(communeInput, "Ingresa tu comuna.");
    return;
  }

  if (!email) {
    markInputError(emailInput, "Ingresa tu correo universitario.");
    return;
  }

  if (!isUniversityEmail(email)) {
    markInputError(
      emailInput,
      "Usa un correo universitario chileno válido. No se aceptan Gmail, Outlook, Hotmail ni correos personales."
    );
    return;
  }

  const waitlist = getWaitlistData();

  const emailAlreadyExists = waitlist.some((user) => user.email === email);

  if (emailAlreadyExists) {
    showToast("Este correo ya está registrado en la lista de espera.", "info");
    return;
  }

  const newUser = {
    id: createId(),
    name,
    university,
    commune,
    email,
    createdAt: new Date().toISOString()
  };

  waitlist.push(newUser);
  saveWaitlistData(waitlist);

  showToast("Registro exitoso. Ya estás en la lista de espera de UBook.", "success");

  form.reset();

  console.log("Lista de espera UBook:", waitlist);
}

function clearFormErrors(form) {
  const inputs = form.querySelectorAll("input");

  inputs.forEach((input) => {
    input.classList.remove("input-error");
  });
}

function markInputError(input, message) {
  input.classList.add("input-error");
  input.focus();
  showToast(message, "error");
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `ubook-${Date.now()}`;
}

/* =========================================
   ANIMACIONES AL HACER SCROLL
========================================= */

function initScrollAnimations() {
  const elements = document.querySelectorAll(
    ".section__header, .section__content, .info-card, .benefit-card, .feature-card, .security-list li, .tags-list span, .social-block, .waitlist__container, .app-preview"
  );

  elements.forEach((element) => {
    element.classList.add("scroll-hidden");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-visible");
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });
}

/* =========================================
   ESTADO ACTIVO DE NAVEGACIÓN
========================================= */

function initNavigationState() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".site-nav__link");

  if (!sections.length || !navLinks.length) return;

  window.addEventListener("scroll", () => {
    let currentSectionId = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 130;
      const sectionHeight = section.offsetHeight;

      if (
        window.scrollY >= sectionTop &&
        window.scrollY < sectionTop + sectionHeight
      ) {
        currentSectionId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("is-active");

      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("is-active");
      }
    });
  });
}