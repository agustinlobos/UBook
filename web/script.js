// UBook - app client.

const SUPABASE_URL = "https://ajvmyxwzmyksmjxzpgkt.supabase.co";
const SUPABASE_KEY = "sb_publishable_qPIVUE1aqQWplNaQzFHe1A_X4RKKoIG";
const SESSION_KEY = "ubook_session";

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

const NEARBY_LOCATIONS = {
  chicureo: ["colina", "piedra roja", "lo barnechea", "vitacura"],
  colina: ["chicureo", "piedra roja", "lo barnechea", "lampa"],
  buin: ["paine", "san bernardo", "calera de tango", "pirque"],
  paine: ["buin", "san bernardo"],
  "san bernardo": ["buin", "paine", "el bosque", "la cisterna"],
  "lo barnechea": ["vitacura", "las condes", "chicureo", "colina"],
  vitacura: ["lo barnechea", "las condes"],
  "las condes": ["vitacura", "lo barnechea", "providencia"],
  providencia: ["las condes", "nunoa", "santiago"],
  nunoa: ["providencia", "macul", "santiago", "la reina"],
  "la florida": ["macul", "puente alto", "penalolen"],
  "puente alto": ["la florida", "pirque", "san jose de maipo"]
};

const appState = {
  authMode: "login",
  session: null,
  user: null,
  profile: null,
  turns: [],
  turnApplications: [],
  driverProfiles: {},
  turnFilters: {
    sector: "",
    day: "",
    sort: "default"
  },
  history: [],
  ratings: [],
  messages: [],
  reports: [],
  groups: [],
  groupMembers: [],
  selectedTurnId: null,
  activeThread: null,
  realtime: {
    socket: null,
    heartbeatTimer: null,
    reconnectTimer: null,
    reloadTimer: null,
    ref: 0,
    topic: null,
    joined: false,
    pendingReload: false
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  initActionButtons();
  initAuthModal();
  initAuthForm();
  initWaitlistForm();
  initAppTabs();
  initAppForms();
  initProfilePhotoInput();
  initScrollAnimations();
  initNavigationState();

  appState.session = getStoredSession();

  if (appState.session?.access_token) {
    await bootstrapAuthenticatedApp();
  }
});

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
  }, 3600);
}

function getEmailDomain(email) {
  return email.trim().toLowerCase().split("@")[1] || "";
}

function isUniversityEmail(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    return false;
  }

  const domain = getEmailDomain(cleanEmail);

  if (!domain || BLOCKED_EMAIL_DOMAINS.includes(domain)) {
    return false;
  }

  return UNIVERSITY_DOMAINS.some((universityDomain) => {
    return domain === universityDomain || domain.endsWith(`.${universityDomain}`);
  });
}

function isValidEmail(email) {
  return /^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email.trim());
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeLocation(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function locationIncludes(text, location) {
  const cleanText = normalizeLocation(text);
  const cleanLocation = normalizeLocation(location);

  if (!cleanText || !cleanLocation) {
    return false;
  }

  return ` ${cleanText} `.includes(` ${cleanLocation} `);
}

function money(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
}

function formatTurnDate(dateValue) {
  if (!dateValue) {
    return "Por definir";
  }

  return new Date(`${dateValue}T12:00:00`).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatTurnTime(timeValue) {
  if (!timeValue) {
    return "Por definir";
  }

  return String(timeValue).slice(0, 5);
}

function normalizeTurnTime(timeValue) {
  const match = String(timeValue || "").trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return "";
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeVehiclePlate(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

function isValidVehiclePlate(value) {
  return /^[A-Z0-9]{4,10}$/.test(value);
}

function getStoredSession() {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);

    if (session) {
      localStorage.removeItem(SESSION_KEY);
      return JSON.parse(session);
    }

    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  appState.session = {
    ...appState.session,
    ...session
  };
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(appState.session));
}

function clearSession() {
  appState.session = null;
  appState.user = null;
  appState.profile = null;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function getTokenPayload(token) {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isAccessTokenExpiring(token) {
  const payload = getTokenPayload(token);

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now() + 60000;
}

async function refreshSession() {
  const refreshToken = appState.session?.refresh_token;

  if (!refreshToken) {
    throw new Error("No hay una sesión activa para renovar.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const text = await response.text();
  const payload = parseSupabasePayload(text);

  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || "No se pudo renovar la sesión.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  saveSession(payload);
  return appState.session;
}

async function ensureFreshSession() {
  if (!appState.session?.access_token || !isAccessTokenExpiring(appState.session.access_token)) {
    return;
  }

  await refreshSession();
}

function parseSupabasePayload(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function supabaseFetch(path, options = {}) {
  const { retryAuth, ...fetchOptions } = options;

  if (fetchOptions.auth !== false) {
    await ensureFreshSession();
  }

  const headers = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {})
  };

  if (fetchOptions.auth !== false && appState.session?.access_token) {
    headers.Authorization = `Bearer ${appState.session.access_token}`;
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...fetchOptions,
    headers
  });

  const text = await response.text();
  const payload = parseSupabasePayload(text);

  if (!response.ok) {
    if (response.status === 401 && fetchOptions.auth !== false && !retryAuth && appState.session?.refresh_token) {
      await refreshSession();
      return supabaseFetch(path, {
        ...fetchOptions,
        retryAuth: true
      });
    }

    const message = payload?.msg || payload?.message || payload?.error_description || "No se pudo completar la solicitud.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function getRealtimeEndpoint() {
  return `${SUPABASE_URL.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_KEY)}&vsn=1.0.0`;
}

function nextRealtimeRef() {
  appState.realtime.ref += 1;
  return String(appState.realtime.ref);
}

function sendRealtimeMessage(topic, event, payload = {}, joinRef = null) {
  const socket = appState.realtime.socket;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify([joinRef, nextRealtimeRef(), topic, event, payload]));
}

function getRealtimeChangesConfig() {
  const userId = appState.profile?.id;

  if (!userId) {
    return [];
  }

  const groupTurnSubscriptions = appState.groups.map((group) => ({
    event: "*",
    schema: "public",
    table: "university_turns",
    filter: `group_id=eq.${group.id}`
  }));

  return [
    {
      event: "*",
      schema: "public",
      table: "university_turns",
      filter: "visibility=eq.public"
    },
    {
      event: "*",
      schema: "public",
      table: "university_turns",
      filter: `driver_id=eq.${userId}`
    },
    ...groupTurnSubscriptions,
    {
      event: "*",
      schema: "public",
      table: "turn_messages",
      filter: `sender_id=eq.${userId}`
    },
    {
      event: "*",
      schema: "public",
      table: "turn_messages",
      filter: `recipient_id=eq.${userId}`
    },
    {
      event: "*",
      schema: "public",
      table: "turn_applications",
      filter: `applicant_id=eq.${userId}`
    },
    {
      event: "*",
      schema: "public",
      table: "turn_applications",
      filter: `driver_id=eq.${userId}`
    },
    {
      event: "*",
      schema: "public",
      table: "turn_history",
      filter: `user_id=eq.${userId}`
    }
  ];
}

function startRealtimeSubscriptions() {
  stopRealtimeSubscriptions();

  if (!appState.session?.access_token || !appState.profile?.id) {
    return;
  }

  if (typeof WebSocket === "undefined") {
    return;
  }

  let socket;

  try {
    socket = new WebSocket(getRealtimeEndpoint());
  } catch (error) {
    console.warn("Realtime connection unavailable", error);
    return;
  }

  const topic = `realtime:ubook:${appState.profile.id}`;

  appState.realtime.socket = socket;
  appState.realtime.topic = topic;
  appState.realtime.joined = false;

  socket.addEventListener("open", () => {
    const payload = {
      config: {
        broadcast: { self: false },
        presence: { key: appState.profile.id },
        postgres_changes: getRealtimeChangesConfig()
      },
      access_token: appState.session.access_token
    };

    sendRealtimeMessage(topic, "phx_join", payload);
    appState.realtime.heartbeatTimer = setInterval(() => {
      sendRealtimeMessage("phoenix", "heartbeat", {});
    }, 30000);
  });

  socket.addEventListener("message", (event) => {
    handleRealtimeMessage(event.data);
  });

  socket.addEventListener("close", () => {
    if (appState.realtime.socket !== socket) {
      return;
    }

    cleanupRealtimeSocket(false);
    scheduleRealtimeReconnect();
  });

  socket.addEventListener("error", () => {
    socket.close();
  });
}

function handleRealtimeMessage(data) {
  let message;

  try {
    message = JSON.parse(data);
  } catch {
    return;
  }

  const [, , topic, event, payload] = message;

  if (topic !== appState.realtime.topic) {
    return;
  }

  if (event === "phx_reply" && payload?.status === "ok") {
    appState.realtime.joined = true;
    return;
  }

  if (event === "postgres_changes") {
    scheduleRealtimeReload();
  }
}

function scheduleRealtimeReload() {
  if (!appState.session?.access_token) {
    return;
  }

  appState.realtime.pendingReload = true;
  window.clearTimeout(appState.realtime.reloadTimer);
  appState.realtime.reloadTimer = window.setTimeout(async () => {
    if (!appState.realtime.pendingReload) {
      return;
    }

    appState.realtime.pendingReload = false;

    try {
      await loadAppData();
    } catch (error) {
      console.warn("Realtime refresh failed", error);
    }
  }, 500);
}

function scheduleRealtimeReconnect() {
  if (!appState.session?.access_token || !appState.profile?.id) {
    return;
  }

  window.clearTimeout(appState.realtime.reconnectTimer);
  appState.realtime.reconnectTimer = window.setTimeout(() => {
    startRealtimeSubscriptions();
  }, 2500);
}

function cleanupRealtimeSocket(closeSocket = true) {
  window.clearInterval(appState.realtime.heartbeatTimer);
  window.clearTimeout(appState.realtime.reloadTimer);

  if (closeSocket && appState.realtime.socket) {
    appState.realtime.socket.close();
  }

  appState.realtime.socket = null;
  appState.realtime.heartbeatTimer = null;
  appState.realtime.reloadTimer = null;
  appState.realtime.joined = false;
  appState.realtime.pendingReload = false;
}

function stopRealtimeSubscriptions() {
  window.clearTimeout(appState.realtime.reconnectTimer);
  appState.realtime.reconnectTimer = null;
  cleanupRealtimeSocket(true);
}

async function authSignUp({ name, university, commune, email, password }) {
  return supabaseFetch("/auth/v1/signup", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: name,
        university,
        commune
      }
    })
  });
}

async function authSignIn(email, password) {
  return supabaseFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password })
  });
}

async function authGetUser() {
  return supabaseFetch("/auth/v1/user", {
    method: "GET"
  });
}

async function authLogout() {
  if (!appState.session?.access_token) return;

  await supabaseFetch("/auth/v1/logout", {
    method: "POST"
  }).catch(() => null);
}

async function createUserGroup(name, emails) {
  return supabaseFetch("/rest/v1/rpc/create_user_group", {
    method: "POST",
    body: JSON.stringify({
      group_name: name,
      member_emails: emails
    })
  });
}

async function submitTurnRating(historyId, rating) {
  return supabaseFetch("/rest/v1/rpc/submit_turn_rating", {
    method: "POST",
    body: JSON.stringify({
      target_history_id: historyId,
      score: rating
    })
  });
}

async function respondTurnApplication(applicationId, responseStatus) {
  return supabaseFetch("/rest/v1/rpc/respond_turn_application", {
    method: "POST",
    body: JSON.stringify({
      application_id: applicationId,
      response_status: responseStatus
    })
  });
}

function initActionButtons() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;

    if (action === "submit-waitlist") {
      return;
    }

    event.preventDefault();
    handleAction(action);
  });
}

function handleAction(action) {
  switch (action) {
    case "open-register":
      openAuthModal("login");
      break;

    case "close-auth":
      closeModal("auth");
      break;

    case "close-register":
      closeModal("register");
      break;

    case "open-waitlist":
      scrollToElement("#waitlist");
      break;

    case "show-how-it-works":
      scrollToElement("#how-it-works");
      break;

    case "request-turn":
      if (appState.session) {
        showApp();
        setActiveTab("turns");
        return;
      }

      openAuthModal("login");
      break;

    case "logout":
      logout();
      break;

    default:
      break;
  }
}

function initAuthModal() {
  setAuthMode(appState.authMode);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal("auth");
      closeModal("register");
    }
  });

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setAuthMode(button.dataset.authMode);
    });
  });
}

function openAuthModal(mode = "login") {
  setAuthMode(mode);
  openModal("auth");
  syncAuthAutocomplete();
}

function openModal(name) {
  const modal = document.querySelector(`[data-modal="${name}"]`);

  if (!modal) return;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const firstInput = name === "auth"
    ? null
    : modal.querySelector(".form-field:not([hidden]) input, .form-field:not([hidden]) select, .form-field:not([hidden]) textarea");

  if (firstInput) {
    setTimeout(() => firstInput.focus(), 120);
  }
}

function closeModal(name) {
  const modal = document.querySelector(`[data-modal="${name}"]`);

  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (name === "auth") {
    syncAuthAutocomplete(false);
  }
}

function setAuthMode(mode) {
  appState.authMode = mode;

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.authMode === mode);
  });

  document.querySelectorAll(".auth-signup-field").forEach((field) => {
    field.hidden = mode !== "signup";
  });

  const authForm = document.querySelector('[data-form="auth"]');
  const submitButton = authForm?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = mode === "signup" ? "Crear cuenta" : "Iniciar sesión";
  }

  syncAuthAutocomplete();
}

function syncAuthAutocomplete(forceEnabled = null) {
  const authForm = document.querySelector('[data-form="auth"]');
  const emailInput = document.querySelector("#auth-email");
  const passwordInput = document.querySelector("#auth-password");

  if (authForm) {
    authForm.autocomplete = "off";
  }

  if (emailInput) {
    emailInput.autocomplete = "off";
    emailInput.name = "ubook_access_email";
  }

  if (passwordInput) {
    passwordInput.autocomplete = "off";
    passwordInput.name = "ubook_access_code";
  }

  if (forceEnabled === false) {
    [emailInput, passwordInput].forEach((input) => {
      if (input) {
        input.readOnly = true;
      }
    });
  }
}

function initAuthForm() {
  const form = document.querySelector('[data-form="auth"]');

  if (!form) return;

  initAuthInputProtection();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleAuthSubmit(form);
  });
}

function initAuthInputProtection() {
  const inputs = [
    document.querySelector("#auth-email"),
    document.querySelector("#auth-password")
  ].filter(Boolean);

  const unlock = (input) => {
    input.readOnly = false;
  };

  const lock = () => {
    inputs.forEach((input) => {
      input.readOnly = true;
    });
  };

  inputs.forEach((input) => {
    input.addEventListener("pointerdown", () => unlock(input));
    input.addEventListener("touchstart", () => unlock(input), { passive: true });
    input.addEventListener("keydown", () => unlock(input));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      document.activeElement?.blur?.();
      lock();
    }
  });

  window.addEventListener("pageshow", lock);
}

async function handleAuthSubmit(form) {
  const nameInput = form.querySelector('input[name="name"]');
  const universityInput = form.querySelector('input[name="university"]');
  const communeInput = form.querySelector('input[name="commune"]');
  const emailInput = document.querySelector("#auth-email");
  const passwordInput = document.querySelector("#auth-password");
  const name = normalizeText(nameInput.value);
  const university = normalizeText(universityInput.value);
  const commune = normalizeText(communeInput.value);
  const email = normalizeText(emailInput.value).toLowerCase();
  const password = passwordInput.value;

  if (!isValidEmail(email)) {
    showToast("Ingresa un email válido.", "error");
    return;
  }

  if (password.length < 6) {
    showToast("La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  if (appState.authMode === "signup") {
    if (!isUniversityEmail(email)) {
      showToast("Usa un correo universitario válido. Los correos personales no pueden registrarse.", "error");
      return;
    }

    if (!name || !university || !commune) {
      showToast("Completa nombre, universidad y comuna para crear la cuenta.", "error");
      return;
    }
  }

  setFormLoading(form, true);
  setAuthLoading(true);

  try {
    if (appState.authMode === "signup") {
      const signup = await authSignUp({ name, university, commune, email, password });

      if (!signup.access_token) {
        setAuthLoading(false);
        showToast("Cuenta creada. Revisa tu correo si Supabase solicita confirmación antes de iniciar sesión.", "success");
        setAuthMode("login");
        return;
      }

      saveSession(signup);
    } else {
      const session = await authSignIn(email, password);
      saveSession(session);
    }

    closeModal("auth");
    form.reset();
    const appReady = await bootstrapAuthenticatedApp();
    setAuthLoading(false);

    if (appReady) {
      showToast("Sesión iniciada.", "success");
    }
  } catch (error) {
    setAuthLoading(false);
    if (error.status === 422 || /already|registered|exists/i.test(error.message)) {
      showToast("Ese correo ya tiene una cuenta. Inicia sesión con ese email.", "error");
    } else if (appState.authMode === "login" && (error.status === 400 || /invalid|credentials|login/i.test(error.message))) {
      showToast("Ese correo no está registrado o la contraseña no coincide.", "error");
    } else {
      showToast(error.message, "error");
    }
  } finally {
    setFormLoading(form, false);
  }
}

function setAuthLoading(isLoading) {
  const loading = document.querySelector("[data-auth-loading]");

  if (!loading) {
    return;
  }

  loading.hidden = !isLoading;
}

async function bootstrapAuthenticatedApp() {
  try {
    const authData = await authGetUser();
    appState.user = authData;
  } catch (error) {
    stopRealtimeSubscriptions();
    clearSession();
    hideApp();
    showToast("Tu sesión expiró. Inicia sesión nuevamente.", "error");
    return false;
  }

  try {
    await ensureProfile();
    await loadAppData();
    showApp();
    window.setTimeout(() => {
      try {
        startRealtimeSubscriptions();
      } catch (error) {
        console.warn("Realtime startup failed", error);
      }
    }, 0);
    return true;
  } catch (error) {
    console.error("Authenticated app bootstrap failed", error);
    stopRealtimeSubscriptions();
    showToast("No se pudieron cargar tus datos. Recarga la página e intenta nuevamente.", "error");
    return false;
  }
}

async function ensureProfile() {
  const user = appState.user;
  const existing = await selectRows(
    "profiles",
    "id,email,full_name,university,commune,avatar_url,rating,rating_count",
    `id=eq.${encodeURIComponent(user.id)}`
  );

  if (existing[0]) {
    appState.profile = existing[0];
    return;
  }

  const fallbackName = user.user_metadata?.full_name || user.email.split("@")[0];
  const fallbackUniversity = user.user_metadata?.university || "Universidad";
  const fallbackCommune = user.user_metadata?.commune || "Comuna";
  const profile = {
    id: user.id,
    email: user.email,
    full_name: fallbackName,
    university: fallbackUniversity,
    commune: fallbackCommune
  };

  await upsertRow("profiles", profile);
  appState.profile = {
    ...profile,
    rating: 0,
    rating_count: 0
  };
}

async function loadAppData() {
  await loadGroupData();

  const turns = await selectRows(
    "university_turns",
    "id,driver_id,driver_name,driver_rating,origin,destination,university,departure_date,departure_time,seats_available,contribution_clp,vehicle_plate,visibility,group_id,status,created_at",
    "status=eq.active&order=departure_date.asc.nullslast&order=departure_time.asc"
  );

  appState.turns = sortTurnsForProfile(turns);
  await loadTurnDriverProfiles(appState.turns);
  appState.turnApplications = await selectRows(
    "turn_applications",
    "id,turn_id,applicant_id,applicant_name,applicant_email,driver_id,status,created_at,updated_at,decided_at",
    "order=created_at.desc"
  ).catch(() => []);
  appState.history = await selectRows(
    "turn_history",
    "id,turn_id,driver_id,driver_name,origin,destination,university,ride_date,departure_time,contribution_clp,vehicle_plate,status,created_at",
    "order=ride_date.desc&order=departure_time.desc"
  ).catch(() => []);
  appState.ratings = await selectRows(
    "turn_ratings",
    "id,history_id,rating,updated_at",
    "order=updated_at.desc"
  ).catch(() => []);
  appState.messages = await selectRows(
    "turn_messages",
    "id,turn_id,sender_id,recipient_id,body,created_at",
    "order=created_at.asc"
  ).catch(() => []);
  appState.reports = [];

  renderApp();
}

async function loadTurnDriverProfiles(turns) {
  const driverIds = [...new Set(turns.map((turn) => turn.driver_id).filter(Boolean))];

  if (!driverIds.length) {
    appState.driverProfiles = {};
    return;
  }

  const drivers = await selectRows(
    "profiles",
    "id,full_name,avatar_url",
    `id=in.(${driverIds.join(",")})`
  ).catch(() => []);

  appState.driverProfiles = drivers.reduce((acc, driver) => {
    acc[driver.id] = driver;
    return acc;
  }, {});
}

async function loadGroupData() {
  appState.groups = await selectRows(
    "user_groups",
    "id,name,owner_id,created_at",
    "order=created_at.desc"
  ).catch(() => []);
  appState.groupMembers = await selectRows(
    "group_members",
    "group_id,user_id,role,created_at",
    "order=created_at.asc"
  ).catch(() => []);
}

function sortTurnsForProfile(turns) {
  const profileCommune = appState.profile?.commune;

  return [...turns].sort((a, b) => {
    const scoreDiff = getTurnLocationScore(a, profileCommune) - getTurnLocationScore(b, profileCommune);

    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return getTurnSortKey(a).localeCompare(getTurnSortKey(b));
  });
}

function applyTurnFilters(turns) {
  const { sector, day, sort } = appState.turnFilters;
  let filtered = [...turns];

  if (sector) {
    filtered = filtered.filter((turn) => {
      return matchesTurnSector(turn, sector);
    });
  }

  if (day) {
    filtered = filtered.filter((turn) => {
      return turn.departure_date === day;
    });
  }

  if (sort === "value_asc") {
    filtered.sort((a, b) => Number(a.contribution_clp || 0) - Number(b.contribution_clp || 0));
  } else if (sort === "value_desc") {
    filtered.sort((a, b) => Number(b.contribution_clp || 0) - Number(a.contribution_clp || 0));
  } else if (sort === "date_asc") {
    filtered.sort((a, b) => getTurnSortKey(a).localeCompare(getTurnSortKey(b)));
  } else if (sort === "date_desc") {
    filtered.sort((a, b) => getTurnSortKey(b).localeCompare(getTurnSortKey(a)));
  }

  return filtered;
}

function matchesTurnSector(turn, sector) {
  const normalizedSector = normalizeLocation(sector);

  if (!normalizedSector) {
    return true;
  }

  return [
    turn.origin,
    turn.destination,
    turn.university
  ].some((value) => locationIncludes(value, normalizedSector));
}

function getTurnLocationScore(turn, profileCommune) {
  const userLocation = normalizeLocation(profileCommune);
  const origin = normalizeLocation(turn.origin);

  if (!userLocation || !origin) {
    return 3;
  }

  if (locationIncludes(origin, userLocation) || locationIncludes(userLocation, origin)) {
    return 0;
  }

  const nearbyLocations = getNearbyLocations(userLocation);

  if (nearbyLocations.some((location) => locationIncludes(origin, location))) {
    return 1;
  }

  return 2;
}

function getNearbyLocations(userLocation) {
  if (NEARBY_LOCATIONS[userLocation]) {
    return NEARBY_LOCATIONS[userLocation];
  }

  const matchingKey = Object.keys(NEARBY_LOCATIONS).find((location) => {
    return locationIncludes(userLocation, location) || locationIncludes(location, userLocation);
  });

  return matchingKey ? NEARBY_LOCATIONS[matchingKey] : [];
}

function getTurnSortKey(turn) {
  return `${turn.departure_date || "9999-12-31"} ${formatTurnTime(turn.departure_time)}`;
}

async function selectRows(table, columns, query = "") {
  const queryString = query ? `&${query}` : "";
  return supabaseFetch(`/rest/v1/${table}?select=${encodeURIComponent(columns)}${queryString}`, {
    method: "GET"
  });
}

async function insertRow(table, row, options = {}) {
  const prefer = options.returnRepresentation === false ? "return=minimal" : "return=representation";

  return supabaseFetch(`/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Prefer: prefer
    },
    body: JSON.stringify(row)
  });
}

async function deleteRows(table, filters) {
  return supabaseFetch(`/rest/v1/${table}?${filters}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal"
    }
  });
}

async function upsertRow(table, row) {
  return supabaseFetch(`/rest/v1/${table}`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(row)
  });
}

async function updateRows(table, filters, row) {
  return supabaseFetch(`/rest/v1/${table}?${filters}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify(row)
  });
}

function showApp() {
  document.body.classList.add("app-mode");
  const app = document.querySelector("[data-app]");

  if (app) {
    app.hidden = false;
  }

  setDefaultTurnDate();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function hideApp() {
  document.body.classList.remove("app-mode");
  const app = document.querySelector("[data-app]");

  if (app) {
    app.hidden = true;
  }
}

function renderApp() {
  [
    ["profile", renderProfile],
    ["turns", renderTurns],
    ["threads", renderThreads],
    ["messages", renderMessages],
    ["rating", renderRating],
    ["reports", renderReports],
    ["history", renderHistoryCalendar],
    ["groups", renderGroups],
    ["private turn groups", renderPrivateTurnGroupOptions]
  ].forEach(([name, render]) => {
    try {
      render();
    } catch (error) {
      console.warn(`Render failed: ${name}`, error);
    }
  });
}

function renderProfile() {
  const profile = appState.profile;

  if (!profile) return;

  document.querySelector("[data-profile-greeting]").textContent = `Hola, ${profile.full_name}`;
  document.querySelector("[data-profile-email]").textContent = profile.email;
  renderAvatar();

  const profileForm = document.querySelector('[data-form="profile"]');

  if (profileForm) {
    profileForm.querySelector('input[name="name"]').value = profile.full_name;
    profileForm.querySelector('input[name="university"]').value = profile.university;
    profileForm.querySelector('input[name="commune"]').value = profile.commune;
    profileForm.querySelector('input[name="email"]').value = profile.email;
  }
}

function renderAvatar() {
  const profile = appState.profile;
  const initials = getInitials(profile?.full_name || "UBook");
  const avatar = document.querySelector("[data-profile-avatar]");
  const smallAvatar = document.querySelector("[data-profile-avatar-small]");

  if (avatar) {
    avatar.innerHTML = profile?.avatar_url
      ? `<img src="${profile.avatar_url}" alt="Foto de perfil" />`
      : `<span>${initials}</span>`;
  }

  if (smallAvatar) {
    if (profile?.avatar_url) {
      smallAvatar.src = profile.avatar_url;
      smallAvatar.hidden = false;
    } else {
      smallAvatar.removeAttribute("src");
      smallAvatar.hidden = true;
    }
  }
}

function renderTurns() {
  const list = document.querySelector("[data-turns-list]");

  if (!list) return;

  if (!appState.turns.length) {
    list.innerHTML = '<p class="empty-state">Todavía no hay turnos activos.</p>';
    return;
  }

  const visibleTurns = applyTurnFilters(appState.turns);

  if (!visibleTurns.length) {
    list.innerHTML = '<p class="empty-state">No hay turnos que coincidan con estos filtros.</p>';
    return;
  }

  list.innerHTML = visibleTurns.map((turn) => {
    const application = getOwnTurnApplication(turn.id);
    const canMessage = canMessageTurnDriver(turn);
    const locationScore = getTurnLocationScore(turn, appState.profile?.commune);
    const locationLabel = locationScore === 0
      ? "Cerca de ti"
      : locationScore === 1
        ? "Zona cercana"
        : "";
    const privateGroupName = turn.visibility === "private"
      ? getGroupName(turn.group_id)
      : "";

    const driverProfile = turn.driver_id ? appState.driverProfiles[turn.driver_id] : null;
    const driverAvatar = getDriverTurnAvatarHtml(turn.driver_id, turn.driver_name, driverProfile?.avatar_url);

    return `
      <article class="app-turn-card" data-open-turn="${turn.id}">
        <div class="app-turn-card__avatar">
          ${driverAvatar}
        </div>
        <div class="app-turn-card__top">
          <div>
            <small>${escapeHtml(turn.university)}</small>
            <h3>${escapeHtml(turn.origin)} → ${escapeHtml(turn.destination)}</h3>
          </div>
          <span>${turn.seats_available} cupos</span>
        </div>
        <div class="app-turn-card__match ${locationLabel ? "" : "is-empty"}" ${locationLabel ? "" : 'aria-hidden="true"'}>${locationLabel}</div>
        ${privateGroupName ? `<div class="app-turn-private">Privado · ${escapeHtml(privateGroupName)}</div>` : ""}
        <div class="app-turn-meta">
          <div><small>Fecha</small><strong>${formatTurnDate(turn.departure_date)}</strong></div>
          <div><small>Hora</small><strong>${formatTurnTime(turn.departure_time)}</strong></div>
          <div><small>Aporte</small><strong>${money(turn.contribution_clp)}</strong></div>
          <div><small>Conductor</small><strong>${escapeHtml(turn.driver_name)}</strong></div>
          <div><small>Patente</small><strong>${escapeHtml(turn.vehicle_plate || "Por definir")}</strong></div>
          <div><small>Rating</small><strong>${Number(turn.driver_rating).toFixed(1)} / 5</strong></div>
        </div>
        <div class="app-turn-card__actions">
          <button class="button button--primary button--full" type="button" data-view-turn="${turn.id}">
            Ver turno
          </button>
          ${application ? `<span class="turn-application-pill ${application.status}">${getApplicationStatusLabel(application.status)}</span>` : ""}
          ${canMessage ? `<button class="button button--secondary button--full" type="button" data-message-turn="${turn.id}">Enviar mensaje</button>` : ""}
        </div>
      </article>
    `;
  }).join("");

  list.querySelectorAll("[data-view-turn], [data-open-turn]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target.closest("[data-message-turn]")) return;
      const turnId = element.dataset.viewTurn || element.dataset.openTurn;
      selectTurn(turnId);
    });
  });

  list.querySelectorAll("[data-message-turn]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const turn = appState.turns.find((item) => item.id === button.dataset.messageTurn);

      if (!turn?.driver_id || turn.driver_id === appState.profile.id) return;

      appState.activeThread = {
        turnId: turn.id,
        recipientId: turn.driver_id,
        recipientName: turn.driver_name
      };

      setActiveTab("messages");
      renderMessages();
    });
  });

  renderTurnDetail();
  renderReportTurnOptions();
}

function selectTurn(turnId) {
  appState.selectedTurnId = turnId;
  renderTurnDetail();
  document.querySelector("[data-turn-detail]")?.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function renderTurnDetail() {
  const detail = document.querySelector("[data-turn-detail]");

  if (!detail) return;

  const turn = appState.turns.find((item) => item.id === appState.selectedTurnId);

  if (!turn) {
    detail.hidden = true;
    detail.innerHTML = "";
    return;
  }

  const isDriver = turn.driver_id === appState.profile.id;
  const canMessage = canMessageTurnDriver(turn);
  const capacityLabel = `${turn.seats_available} ${turn.seats_available === 1 ? "cupo disponible" : "cupos disponibles"}`;
  const historyMatch = appState.history.find((item) => item.turn_id === turn.id);
  const alreadyInHistory = Boolean(historyMatch);
  const application = getOwnTurnApplication(turn.id);
  const canApply = !isDriver && !application && Number(turn.seats_available) > 0;
  const applicationAction = getTurnApplicationActionHtml(turn, application, canApply);
  const driverApplications = isDriver ? getDriverApplicationsHtml(turn.id) : "";
  const driverProfile = turn.driver_id ? appState.driverProfiles[turn.driver_id] : null;
  const driverAvatar = getDriverTurnAvatarHtml(turn.driver_id, turn.driver_name, driverProfile?.avatar_url);

  detail.hidden = false;
  detail.innerHTML = `
    <div class="turn-detail__content">
      <div>
        <p class="eyebrow">Turno seleccionado</p>
        <h2>${escapeHtml(turn.origin)} → ${escapeHtml(turn.destination)}</h2>
        <div class="turn-detail__driver">
          <div class="turn-detail__avatar">
            ${driverAvatar}
          </div>
          <div>
            <small>Conductor</small>
            <strong>${escapeHtml(turn.driver_name)}</strong>
          </div>
        </div>
        <div class="turn-detail__stats">
          <div><small>Capacidad</small><strong>${capacityLabel}</strong></div>
          <div><small>Fecha</small><strong>${formatTurnDate(turn.departure_date)}</strong></div>
          <div><small>Hora</small><strong>${formatTurnTime(turn.departure_time)}</strong></div>
          <div><small>Aporte</small><strong>${money(turn.contribution_clp)}</strong></div>
          <div><small>Patente</small><strong>${escapeHtml(turn.vehicle_plate || "Por definir")}</strong></div>
        </div>
        <div class="turn-detail__actions">
          ${applicationAction}
          <button class="button button--primary" type="button" data-detail-message ${canMessage ? "" : "disabled"}>Enviar mensaje</button>
          <button class="button button--secondary" type="button" data-detail-report ${alreadyInHistory ? "" : "disabled"}>Denunciar</button>
        </div>
        ${driverApplications}
      </div>
      <div class="route-map" aria-label="Mapa del turno desde ${escapeHtml(turn.origin)} hasta ${escapeHtml(turn.destination)}">
        <div class="route-map__grid"></div>
        <div class="route-map__line"></div>
        <div class="route-map__pin route-map__pin--start"></div>
        <div class="route-map__pin route-map__pin--end"></div>
        <article class="route-map__label route-map__label--start">
          <small>Sale desde</small>
          <strong>${escapeHtml(turn.origin)}</strong>
        </article>
        <article class="route-map__label route-map__label--end">
          <small>Llega a</small>
          <strong>${escapeHtml(turn.destination)}</strong>
        </article>
      </div>
    </div>
  `;

  detail.querySelector("[data-detail-message]")?.addEventListener("click", () => {
    if (!canMessage) return;
    appState.activeThread = {
      turnId: turn.id,
      recipientId: turn.driver_id,
      recipientName: turn.driver_name
    };
    setActiveTab("messages");
    renderMessages();
  });

  detail.querySelector("[data-detail-report]")?.addEventListener("click", () => {
    if (!historyMatch) {
      showToast("Solo puedes denunciar turnos que ya estén en tu historial.", "error");
      return;
    }

    setActiveTab("reports");
    const reportTurn = document.querySelector('[data-form="report"] select[name="turn"]');
    if (reportTurn) {
      reportTurn.value = `history:${historyMatch.id}`;
    }
  });

  detail.querySelector("[data-apply-turn]")?.addEventListener("click", async () => {
    await handleApplyToTurn(turn);
  });

  detail.querySelectorAll("[data-application-response]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleApplicationResponse(
        button.dataset.applicationId,
        button.dataset.applicationResponse,
        button
      );
    });
  });
}

function getOwnTurnApplication(turnId) {
  return appState.turnApplications.find((application) => {
    return application.turn_id === turnId && application.applicant_id === appState.profile?.id;
  });
}

function getAcceptedTurnApplications(turnId) {
  return appState.turnApplications.filter((application) => {
    return application.turn_id === turnId && application.status === "accepted";
  });
}

function canMessageTurnDriver(turn) {
  if (!turn?.driver_id || turn.driver_id === appState.profile?.id) {
    return false;
  }

  return getOwnTurnApplication(turn.id)?.status === "accepted";
}

function getApplicationStatusLabel(status) {
  const labels = {
    pending: "Solicitud pendiente",
    accepted: "Solicitud aceptada",
    rejected: "Solicitud rechazada"
  };

  return labels[status] || "Solicitud";
}

function getTurnApplicationActionHtml(turn, application, canApply) {
  if (turn.driver_id === appState.profile.id) {
    return "";
  }

  if (application) {
    return `<span class="turn-application-status ${application.status}">${getApplicationStatusLabel(application.status)}</span>`;
  }

  return `
    <button class="button button--primary" type="button" data-apply-turn ${canApply ? "" : "disabled"}>
      ${Number(turn.seats_available) > 0 ? "Postular" : "Sin cupos"}
    </button>
  `;
}

function getDriverApplicationsHtml(turnId) {
  const applications = appState.turnApplications.filter((application) => application.turn_id === turnId);

  if (!applications.length) {
    return '<div class="turn-applications"><strong>Solicitudes</strong><p class="empty-state">Aún no hay postulaciones para este turno.</p></div>';
  }

  return `
    <div class="turn-applications">
      <strong>Solicitudes</strong>
      ${applications.map((application) => `
        <article class="turn-application">
          <div>
            <span>${escapeHtml(application.applicant_name)}</span>
            <small>${escapeHtml(application.applicant_email)} · ${getApplicationStatusLabel(application.status)}</small>
          </div>
          ${application.status === "pending" ? `
            <div class="turn-application__actions">
              <button class="button button--primary button--small" type="button" data-application-id="${application.id}" data-application-response="accepted">Aceptar</button>
              <button class="button button--secondary button--small" type="button" data-application-id="${application.id}" data-application-response="rejected">No aceptar</button>
            </div>
          ` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function getDriverTurnAvatarHtml(driverId, driverName, avatarUrl) {
  if (avatarUrl) {
    return `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(driverName)}" />`;
  }

  return `<span>${escapeHtml(getInitials(driverName || "UBook"))}</span>`;
}

function renderThreads() {
  const list = document.querySelector("[data-threads-list]");

  if (!list) return;

  const passengerThreads = appState.turns.filter((turn) => {
    return canMessageTurnDriver(turn);
  });
  const driverThreads = appState.turns.flatMap((turn) => {
    if (turn.driver_id !== appState.profile.id) {
      return [];
    }

    return getAcceptedTurnApplications(turn.id).map((application) => ({
      turn,
      application
    }));
  });

  list.innerHTML = `
    <button class="thread-item is-system" type="button" data-thread-system="welcome">
      <strong>UBook</strong>
      <span>Bienvenida y recomendaciones de seguridad</span>
    </button>
    <div class="groups-list" data-groups-list></div>
  ` + passengerThreads.map((turn) => `
    <button class="thread-item" type="button" data-thread-turn="${turn.id}">
      <strong>${escapeHtml(turn.driver_name)}</strong>
      <span>${escapeHtml(turn.origin)} → ${escapeHtml(turn.destination)}</span>
    </button>
  `).join("") + driverThreads.map(({ turn, application }) => `
    <button class="thread-item" type="button" data-thread-application="${application.id}">
      <strong>${escapeHtml(application.applicant_name)}</strong>
      <span>${escapeHtml(turn.origin)} → ${escapeHtml(turn.destination)}</span>
    </button>
  `).join("");

  list.querySelector("[data-thread-system]")?.addEventListener("click", () => {
    appState.activeThread = {
      system: "welcome",
      recipientName: "UBook"
    };
    renderMessages();
  });

  list.querySelectorAll("[data-thread-turn]").forEach((button) => {
    button.addEventListener("click", () => {
      const turn = appState.turns.find((item) => item.id === button.dataset.threadTurn);

      appState.activeThread = {
        turnId: turn.id,
        recipientId: turn.driver_id,
        recipientName: turn.driver_name
      };

      renderMessages();
    });
  });

  list.querySelectorAll("[data-thread-application]").forEach((button) => {
    button.addEventListener("click", () => {
      const application = appState.turnApplications.find((item) => item.id === button.dataset.threadApplication);
      const turn = appState.turns.find((item) => item.id === application?.turn_id);

      if (!application || !turn || turn.driver_id !== appState.profile.id || application.status !== "accepted") {
        return;
      }

      appState.activeThread = {
        turnId: turn.id,
        recipientId: application.applicant_id,
        recipientName: application.applicant_name
      };

      renderMessages();
    });
  });
}

function renderGroups() {
  const list = document.querySelector("[data-groups-list]");

  if (!list) return;

  if (!appState.groups.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = appState.groups.map((group) => `
    <article class="group-item">
      <strong>${escapeHtml(group.name)}</strong>
    </article>
  `).join("");
}

function renderPrivateTurnGroupOptions() {
  const select = document.querySelector('[data-form="private-turn"] select[name="group"]');
  const privateTurnToggle = document.querySelector("[data-private-turn-toggle]");
  const privateTurnForm = document.querySelector('[data-form="private-turn"]');

  if (!select || !privateTurnToggle || !privateTurnForm) return;

  privateTurnToggle.hidden = !appState.groups.length;

  if (!appState.groups.length) {
    privateTurnForm.hidden = true;
    privateTurnToggle.setAttribute("aria-expanded", "false");
  }

  const currentValue = select.value;
  const options = appState.groups.map((group) => {
    return `<option value="${group.id}">${escapeHtml(group.name)}</option>`;
  }).join("");

  select.innerHTML = '<option value="">Selecciona un grupo</option>' + options;
  select.value = appState.groups.some((group) => group.id === currentValue) ? currentValue : "";
}

function getGroupName(groupId) {
  return appState.groups.find((group) => group.id === groupId)?.name || "Grupo privado";
}

function renderMessages() {
  const header = document.querySelector("[data-chat-header]");
  const list = document.querySelector("[data-chat-messages]");
  const form = document.querySelector('[data-form="message"]');

  if (!header || !list || !form) return;

  if (!appState.activeThread) {
    appState.activeThread = {
      system: "welcome",
      recipientName: "UBook"
    };
  }

  if (appState.activeThread.system === "welcome") {
    header.textContent = "Bienvenida de UBook";
    list.innerHTML = `
      <article class="chat-message system-message">
        <p>Bienvenido a UBook. Antes de coordinar un turno, revisa el perfil del conductor, acuerda el punto exacto de encuentro dentro del chat y reporta cualquier conducta sospechosa desde Denuncias.</p>
        <small>Mensaje fijado</small>
      </article>
    `;
    form.querySelector("input").disabled = true;
    form.querySelector("button").disabled = true;
    return;
  }

  header.textContent = `Chat con ${appState.activeThread.recipientName}`;
  form.querySelector("input").disabled = false;
  form.querySelector("button").disabled = false;

  const messages = appState.messages.filter((message) => {
    const sameTurn = message.turn_id === appState.activeThread.turnId;
    const betweenUsers =
      [message.sender_id, message.recipient_id].includes(appState.profile.id) &&
      [message.sender_id, message.recipient_id].includes(appState.activeThread.recipientId);

    return sameTurn && betweenUsers;
  });

  if (!messages.length) {
    list.innerHTML = '<p class="empty-state">Aún no hay mensajes en este chat.</p>';
    return;
  }

  list.innerHTML = messages.map((message) => {
    const own = message.sender_id === appState.profile.id;
    return `
      <article class="chat-message ${own ? "is-own" : ""}">
        <p>${escapeHtml(message.body)}</p>
        <small>${new Date(message.created_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}</small>
      </article>
    `;
  }).join("");

  list.scrollTop = list.scrollHeight;
}

function renderRating() {
  const rating = Number(appState.profile?.rating || 0);
  const count = Number(appState.profile?.rating_count || 0);
  const value = document.querySelector("[data-rating-value]");
  const stars = document.querySelector("[data-rating-stars]");
  const ratingCount = document.querySelector("[data-rating-count]");

  if (!value || !stars || !ratingCount) return;

  value.textContent = rating.toFixed(1);
  stars.innerHTML = Array.from({ length: 5 }, (_, index) => {
    return `<span class="${index < Math.round(rating) ? "is-filled" : ""}">★</span>`;
  }).join("");
  ratingCount.textContent = count ? `${count} calificaciones recibidas.` : "Sin calificaciones todavía.";
}

function renderReports() {
  renderReportTurnOptions();

  const list = document.querySelector("[data-reports-list]");

  if (!list) return;

  list.innerHTML = "";
}

function renderReportTurnOptions() {
  const select = document.querySelector('[data-form="report"] select[name="turn"]');

  if (!select) return;

  const currentValue = select.value;
  const historyOptions = appState.history.map((turn) => {
    return `<option value="history:${turn.id}">${formatTurnDate(turn.ride_date)} · ${escapeHtml(turn.origin)} → ${escapeHtml(turn.destination)} · ${escapeHtml(turn.driver_name)}</option>`;
  }).join("");

  select.innerHTML = '<option value="">Selecciona un turno de tu historial</option>' + historyOptions;
  select.value = appState.history.some((turn) => `history:${turn.id}` === currentValue) ? currentValue : "";
}

function renderHistoryCalendar() {
  const container = document.querySelector("[data-history-calendar]");

  if (!container) return;

  renderHistorySpendSummary();

  const ownTurns = appState.turns
    .filter((turn) => turn.driver_id === appState.profile.id)
    .map((turn) => ({
      id: `turn-${turn.id}`,
      type: "Publicado",
      origin: turn.origin,
      destination: turn.destination,
      date: turn.departure_date || new Date().toISOString().slice(0, 10),
      time: turn.departure_time,
      driverName: turn.driver_name,
      contribution: turn.contribution_clp,
      vehiclePlate: turn.vehicle_plate
    }));
  const historyTurns = appState.history.map((turn) => ({
    id: `history-${turn.id}`,
    historyId: turn.id,
    type: "Realizado",
    origin: turn.origin,
    destination: turn.destination,
    date: turn.ride_date,
    time: turn.departure_time,
    driverName: turn.driver_name,
    driverId: turn.driver_id,
    contribution: turn.contribution_clp,
    vehiclePlate: turn.vehicle_plate
  }));
  const items = [...ownTurns, ...historyTurns].sort((a, b) => {
    return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
  });

  if (!items.length) {
    container.innerHTML = '<p class="empty-state">Todavía no tienes turnos en tu calendario.</p>';
    return;
  }

  const groups = items.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  container.innerHTML = Object.entries(groups).map(([date, entries]) => `
    <article class="history-day">
      <div class="history-day__date">
        <strong>${new Date(`${date}T12:00:00`).toLocaleDateString("es-CL", { weekday: "short", day: "2-digit", month: "short" })}</strong>
        <span>${date}</span>
      </div>
      <div class="history-day__items">
        ${entries.map((item) => `
          <div class="history-event">
            <span>${item.type}</span>
            <strong>${escapeHtml(item.origin)} → ${escapeHtml(item.destination)}</strong>
            <small>${formatTurnTime(item.time)} · ${escapeHtml(item.driverName)} · Patente ${escapeHtml(item.vehiclePlate || "por definir")} · ${money(item.contribution)}</small>
            ${renderHistoryEventActions(item)}
          </div>
        `).join("")}
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-rate-history]").forEach((button) => {
    button.addEventListener("click", () => {
      handleRateHistoryTurn(button.dataset.rateHistory, Number(button.dataset.rating), button);
    });
  });

  container.querySelectorAll("[data-delete-history]").forEach((button) => {
    button.addEventListener("click", () => {
      handleDeleteHistoryTurn(button.dataset.deleteHistory, button);
    });
  });
}

function renderHistoryRatingAction(item) {
  if (item.type !== "Realizado" || !item.historyId || !item.driverId || item.driverId === appState.profile.id) {
    return "";
  }

  const rating = appState.ratings.find((entry) => entry.history_id === item.historyId);

  if (rating) {
    return `
      <div class="history-event__rating">
        <strong>Puntuado ${rating.rating} / 5</strong>
      </div>
    `;
  }

  return `
    <div class="history-event__rating">
      <strong>Puntuar este turno</strong>
      <div class="history-rating-buttons" aria-label="Puntuar conductor">
        ${[1, 2, 3, 4, 5].map((value) => `
          <button type="button" data-rate-history="${item.historyId}" data-rating="${value}">${value}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderHistoryDeleteAction(item) {
  if (item.type !== "Realizado" || !item.historyId) {
    return "";
  }

  return `
    <div class="history-event__delete">
      <button type="button" class="button button--secondary" data-delete-history="${item.historyId}">
        Eliminar del historial
      </button>
    </div>
  `;
}

function renderHistoryEventActions(item) {
  const ratingAction = renderHistoryRatingAction(item);
  const deleteAction = renderHistoryDeleteAction(item);

  if (!ratingAction && !deleteAction) {
    return "";
  }

  return `
    <div class="history-event__actions">
      ${ratingAction}
      ${deleteAction}
    </div>
  `;
}

function renderHistorySpendSummary() {
  const container = document.querySelector("[data-history-spend]");

  if (!container) return;

  const { start, end } = getCurrentWeekRange();
  const weeklyHistory = appState.history.filter((turn) => {
    const rideDate = parseLocalDate(turn.ride_date);
    return rideDate && rideDate >= start && rideDate <= end;
  });
  const total = weeklyHistory.reduce((sum, turn) => sum + Number(turn.contribution_clp || 0), 0);

  container.innerHTML = `
    <article class="history-spend-card">
      <div>
        <small>Gasto semanal en turnos</small>
        <strong>${money(total)}</strong>
      </div>
      <p>${weeklyHistory.length} ${weeklyHistory.length === 1 ? "turno registrado" : "turnos registrados"} entre ${formatShortDate(start)} y ${formatShortDate(end)}.</p>
    </article>
  `;
}

function getCurrentWeekRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function parseLocalDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = String(dateValue).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatShortDate(date) {
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short"
  });
}

function initAppTabs() {
  document.querySelectorAll("[data-app-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.appTab);
    });
  });
}

function setActiveTab(tabName) {
  document.querySelectorAll("[data-app-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.appTab === tabName);
  });

  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabName);
  });
}

function initAppForms() {
  const turnForm = document.querySelector('[data-form="turn"]');
  const profileForm = document.querySelector('[data-form="profile"]');
  const messageForm = document.querySelector('[data-form="message"]');
  const reportForm = document.querySelector('[data-form="report"]');
  const groupForm = document.querySelector('[data-form="group"]');
  const privateTurnForm = document.querySelector('[data-form="private-turn"]');
  const turnToggle = document.querySelector("[data-turn-toggle]");
  const turnFiltersToggle = document.querySelector("[data-turn-filters-toggle]");
  const turnFiltersPanel = document.querySelector("[data-turn-filters]");
  const turnFilterSector = document.querySelector("#turn-filter-sector");
  const turnFilterDay = document.querySelector("#turn-filter-day");
  const turnFilterSort = document.querySelector("#turn-filter-sort");
  const turnFiltersReset = document.querySelector("[data-turn-filters-reset]");
  const groupToggle = document.querySelector("[data-group-toggle]");
  const privateTurnToggle = document.querySelector("[data-private-turn-toggle]");
  const vehiclePlateInput = turnForm?.querySelector('input[name="vehicle_plate"]');
  const privateVehiclePlateInput = privateTurnForm?.querySelector('input[name="vehicle_plate"]');

  turnToggle?.addEventListener("click", () => {
    if (!turnForm) {
      return;
    }

    turnForm.hidden = !turnForm.hidden;
    turnToggle.setAttribute("aria-expanded", String(!turnForm.hidden));

    if (!turnForm.hidden) {
      turnForm.querySelector("input")?.focus();
    }
  });
  turnFiltersToggle?.addEventListener("click", () => {
    if (!turnFiltersPanel) {
      return;
    }

    turnFiltersPanel.hidden = !turnFiltersPanel.hidden;
    turnFiltersToggle.setAttribute("aria-expanded", String(!turnFiltersPanel.hidden));
  });
  turnFilterSector?.addEventListener("change", () => {
    appState.turnFilters.sector = turnFilterSector.value;
    renderTurns();
  });
  turnFilterDay?.addEventListener("change", () => {
    appState.turnFilters.day = turnFilterDay.value;
    renderTurns();
  });
  turnFilterSort?.addEventListener("change", () => {
    appState.turnFilters.sort = turnFilterSort.value;
    renderTurns();
  });
  turnFiltersReset?.addEventListener("click", () => {
    appState.turnFilters = {
      sector: "",
      day: "",
      sort: "default"
    };

    if (turnFilterSector) turnFilterSector.value = "";
    if (turnFilterDay) turnFilterDay.value = "";
    if (turnFilterSort) turnFilterSort.value = "default";
    renderTurns();
  });
  groupToggle?.addEventListener("click", () => {
    if (!groupForm) {
      return;
    }

    groupForm.hidden = !groupForm.hidden;
    groupToggle.setAttribute("aria-expanded", String(!groupForm.hidden));

    if (!groupForm.hidden) {
      groupForm.querySelector("input")?.focus();
    }
  });
  privateTurnToggle?.addEventListener("click", () => {
    if (!privateTurnForm) {
      return;
    }

    privateTurnForm.hidden = !privateTurnForm.hidden;
    privateTurnToggle.setAttribute("aria-expanded", String(!privateTurnForm.hidden));

    if (!privateTurnForm.hidden) {
      privateTurnForm.querySelector("select, input")?.focus();
    }
  });
  vehiclePlateInput?.addEventListener("input", () => {
    vehiclePlateInput.value = normalizeVehiclePlate(vehiclePlateInput.value);
  });
  privateVehiclePlateInput?.addEventListener("input", () => {
    privateVehiclePlateInput.value = normalizeVehiclePlate(privateVehiclePlateInput.value);
  });
  turnForm?.addEventListener("submit", handleCreateTurn);
  profileForm?.addEventListener("submit", handleProfileUpdate);
  messageForm?.addEventListener("submit", handleSendMessage);
  reportForm?.addEventListener("submit", handleCreateReport);
  groupForm?.addEventListener("submit", handleCreateGroup);
  privateTurnForm?.addEventListener("submit", handleCreatePrivateTurn);
  setDefaultTurnDate();
}

function setDefaultTurnDate() {
  const dateInput = document.querySelector('[data-form="turn"] input[name="date"]');
  const privateDateInput = document.querySelector('[data-form="private-turn"] input[name="date"]');
  const today = getTodayDateValue();

  if (dateInput) {
    dateInput.min = today;
    if (!dateInput.value || dateInput.value < today) {
      dateInput.value = today;
    }
  }

  if (privateDateInput) {
    privateDateInput.min = today;
    if (!privateDateInput.value || privateDateInput.value < today) {
      privateDateInput.value = today;
    }
  }
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isPastDepartureDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) {
    return false;
  }

  const [hours, minutes] = timeValue.split(":").map(Number);
  const departure = new Date(`${dateValue}T00:00:00`);
  departure.setHours(hours, minutes, 0, 0);

  return departure < new Date();
}

async function handleCreateTurn(event) {
  event.preventDefault();

  const form = event.currentTarget;
  await createTurnFromForm(form, {
    visibility: "public",
    successMessage: "Turno publicado."
  });
}

async function handleCreatePrivateTurn(event) {
  event.preventDefault();

  const form = event.currentTarget;
  await createTurnFromForm(form, {
    visibility: "private",
    groupId: form.group.value,
    successMessage: "Turno privado publicado."
  });
}

async function createTurnFromForm(form, { visibility, groupId = null, successMessage }) {
  const origin = normalizeText(form.origin.value);
  const destination = normalizeText(form.destination.value);
  const vehiclePlate = normalizeVehiclePlate(form.vehicle_plate.value);
  const departureTimeInput = normalizeText(form.time.value);
  const departureTime = normalizeTurnTime(departureTimeInput);
  const departureDate = form.date.value;
  const seats = Number(form.seats.value);
  const contribution = Number(form.contribution.value);

  if (visibility === "private" && !groupId) {
    showToast("Selecciona un grupo para publicar el turno privado.", "error");
    return;
  }

  if (!origin || !destination || !departureTimeInput || !departureDate || !seats) {
    showToast("Completa los datos del turno.", "error");
    return;
  }

  if (!vehiclePlate) {
    showToast("La patente es obligatoria para publicar el turno.", "error");
    return;
  }

  if (!isValidVehiclePlate(vehiclePlate)) {
    showToast("Escribe una patente válida usando 4 a 10 letras o números. Ej: ABCD12.", "error");
    return;
  }

  if (!departureTime) {
    showToast("Escribe la hora de salida en formato HH:MM. Ej: 07:30.", "error");
    return;
  }

  if (departureDate < getTodayDateValue()) {
    showToast("No puedes publicar un turno con una fecha anterior a hoy.", "error");
    form.date.value = getTodayDateValue();
    return;
  }

  if (isPastDepartureDateTime(departureDate, departureTime)) {
    showToast("No puedes publicar un turno con una hora anterior a la actual.", "error");
    return;
  }

  setFormLoading(form, true);

  try {
    await insertRow("university_turns", {
      driver_id: appState.profile.id,
      driver_name: appState.profile.full_name,
      driver_rating: Number(appState.profile.rating || 0),
      origin,
      destination,
      university: appState.profile.university,
      vehicle_plate: vehiclePlate,
      departure_date: departureDate,
      departure_time: departureTime,
      seats_available: seats,
      contribution_clp: contribution,
      visibility,
      group_id: groupId,
      status: "active"
    });

    form.reset();
    form.date.value = getTodayDateValue();
    form.seats.value = 3;
    form.contribution.value = 3000;
    await loadAppData();
    showToast(successMessage, "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setFormLoading(form, false);
  }
}

async function handleApplyToTurn(turn) {
  if (!turn?.id || turn.driver_id === appState.profile.id) {
    return;
  }

  if (Number(turn.seats_available) <= 0) {
    showToast("Este turno no tiene cupos disponibles.", "error");
    return;
  }

  try {
    await insertRow("turn_applications", {
      turn_id: turn.id
    });
    await loadAppData();
    showToast("Postulación enviada. El emisor del turno debe aceptarte.", "success");
  } catch (error) {
    if (error.status === 409 || /duplicate|unique/i.test(error.message)) {
      showToast("Ya postulaste a este turno.", "error");
    } else {
      showToast(error.message, "error");
    }
  }
}

async function handleApplicationResponse(applicationId, responseStatus, button) {
  if (!applicationId || !["accepted", "rejected"].includes(responseStatus)) {
    return;
  }

  if (button) {
    button.disabled = true;
  }

  try {
    await respondTurnApplication(applicationId, responseStatus);
    await loadAppData();
    showToast(responseStatus === "accepted" ? "Solicitud aceptada. El cupo fue descontado." : "Solicitud rechazada.", "success");
  } catch (error) {
    if (button) {
      button.disabled = false;
    }
    showToast(error.message, "error");
  }
}

async function addTurnToHistory(turn) {
  try {
    const [historyItem] = await insertRow("turn_history", {
      user_id: appState.profile.id,
      turn_id: turn.id,
      driver_id: turn.driver_id || null,
      driver_name: turn.driver_name,
      origin: turn.origin,
      destination: turn.destination,
      university: turn.university,
      vehicle_plate: turn.vehicle_plate || null,
      ride_date: turn.departure_date || new Date().toISOString().slice(0, 10),
      departure_time: turn.departure_time,
      contribution_clp: turn.contribution_clp,
      status: "completed"
    });

    appState.history.unshift(historyItem);
    renderTurnDetail();
    renderHistoryCalendar();
    renderReportTurnOptions();
    showToast("Turno agregado al historial.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleRateHistoryTurn(historyId, rating, button) {
  if (!historyId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    showToast("Selecciona una puntuación válida entre 1 y 5.", "error");
    return;
  }

  const history = appState.history.find((item) => item.id === historyId);

  if (!history) {
    showToast("No se encontró este turno en tu historial.", "error");
    return;
  }

  if (!history.driver_id || history.driver_id === appState.profile.id) {
    showToast("Este turno no se puede puntuar.", "error");
    return;
  }

  const ratingButtons = button.closest(".history-rating-buttons")?.querySelectorAll("button") || [];
  ratingButtons.forEach((item) => {
    item.disabled = true;
  });

  try {
    await submitTurnRating(historyId, rating);
    await loadAppData();
    showToast("Puntuación guardada.", "success");
  } catch (error) {
    ratingButtons.forEach((item) => {
      item.disabled = false;
    });
    showToast(error.message, "error");
  }
}

async function handleDeleteHistoryTurn(historyId, button) {
  if (!historyId) {
    showToast("No se encontró el turno a eliminar.", "error");
    return;
  }

  if (!window.confirm("Este turno se quitará de tu historial. Las puntuaciones asociadas también se eliminarán.")) {
    return;
  }

  if (button) {
    button.disabled = true;
  }

  try {
    await deleteRows("turn_history", `id=eq.${encodeURIComponent(historyId)}`);
    await loadAppData();
    renderHistoryCalendar();
    showToast("Turno eliminado del historial.", "success");
  } catch (error) {
    if (button) {
      button.disabled = false;
    }
    showToast(error.message, "error");
  }
}

async function handleCreateReport(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const selectedTurn = parseReportTurnValue(form.turn.value);
  const reason = form.reason.value;
  const details = normalizeText(form.details.value);
  const history = selectedTurn.type === "history"
    ? appState.history.find((item) => item.id === selectedTurn.id)
    : null;

  if (!history) {
    showToast("Selecciona un turno de tu historial para denunciar.", "error");
    return;
  }

  if (details.length < 10) {
    showToast("Agrega más detalle para enviar la denuncia.", "error");
    return;
  }

  setFormLoading(form, true);

  try {
    await insertRow("reports", {
      reporter_id: appState.profile.id,
      reported_user_id: history.driver_id || null,
      turn_id: null,
      history_id: history.id,
      reason,
      details
    }, { returnRepresentation: false });

    form.reset();
    renderReports();
    showToast("Denuncia enviada de forma anónima.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setFormLoading(form, false);
  }
}

function parseReportTurnValue(value) {
  if (!value) {
    return { type: null, id: null };
  }

  const [type, id] = value.split(":");

  if (type !== "history" || !id) {
    return { type: null, id: null };
  }

  return { type, id };
}

async function handleProfileUpdate(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const fullName = normalizeText(form.name.value);
  const university = normalizeText(form.university.value);
  const commune = normalizeText(form.commune.value);

  if (!fullName || !university || !commune) {
    showToast("Completa tu perfil.", "error");
    return;
  }

  setFormLoading(form, true);

  try {
    const [updated] = await updateRows("profiles", `id=eq.${encodeURIComponent(appState.profile.id)}`, {
      full_name: fullName,
      university,
      commune
    });

    appState.profile = {
      ...appState.profile,
      ...updated
    };
    appState.driverProfiles[appState.profile.id] = appState.profile;

    appState.turns = sortTurnsForProfile(appState.turns);
    renderApp();
    showToast("Perfil actualizado.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setFormLoading(form, false);
  }
}

function initProfilePhotoInput() {
  const photoInput = document.querySelector('#profile-photo');

  photoInput?.addEventListener("change", async () => {
    const file = photoInput.files?.[0];

    if (!file) return;

    try {
      const avatarUrl = await fileToAvatarDataUrl(file);
      const [updated] = await updateRows("profiles", `id=eq.${encodeURIComponent(appState.profile.id)}`, {
        avatar_url: avatarUrl
      });

      appState.profile = {
        ...appState.profile,
        ...updated
      };
      appState.driverProfiles[appState.profile.id] = appState.profile;
      renderProfile();
      renderTurns();
      renderTurnDetail();
      showToast("Foto de perfil actualizada.", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      photoInput.value = "";
    }
  });
}

function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("Sube una imagen PNG, JPG o WebP."));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      reject(new Error("La imagen no puede superar 4 MB."));
      return;
    }

    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("No pudimos leer la imagen."));

    image.onload = () => {
      const size = 320;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      canvas.width = size;
      canvas.height = size;
      context.drawImage(image, x, y, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => reject(new Error("La imagen no es válida."));

    reader.readAsDataURL(file);
  });
}

function getInitials(name) {
  return normalizeText(name)
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function reportReasonLabel(reason) {
  const labels = {
    seguridad: "Seguridad",
    conducta: "Conducta inapropiada",
    turno_falso: "Turno falso",
    acoso: "Acoso",
    otro: "Otro"
  };

  return labels[reason] || "Denuncia";
}

async function handleCreateGroup(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const name = normalizeText(form.name.value);
  const emails = normalizeText(form.emails.value)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!name) {
    showToast("Escribe un nombre para el grupo.", "error");
    return;
  }

  const invalidEmail = emails.find((email) => !isUniversityEmail(email));

  if (invalidEmail) {
    showToast("Usa solo correos universitarios válidos para agregar miembros.", "error");
    return;
  }

  setFormLoading(form, true);

  try {
    await createUserGroup(name, emails);
    form.reset();
    await loadAppData();
    showToast("Grupo creado.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setFormLoading(form, false);
  }
}

async function handleSendMessage(event) {
  event.preventDefault();

  if (!appState.activeThread) return;

  const activeTurn = appState.turns.find((turn) => turn.id === appState.activeThread.turnId);
  const isDriverThread = activeTurn?.driver_id === appState.profile.id;
  const isAcceptedApplicantThread = activeTurn?.driver_id === appState.activeThread.recipientId
    && getOwnTurnApplication(activeTurn.id)?.status === "accepted";
  const isAcceptedDriverThread = isDriverThread && appState.turnApplications.some((application) => {
    return application.turn_id === activeTurn.id
      && application.applicant_id === appState.activeThread.recipientId
      && application.status === "accepted";
  });

  if (!activeTurn || (!isAcceptedApplicantThread && !isAcceptedDriverThread)) {
    showToast("Solo puedes enviar mensajes en turnos aceptados.", "error");
    return;
  }

  const form = event.currentTarget;
  const body = normalizeText(form.message.value);

  if (!body) return;

  setFormLoading(form, true);

  try {
    const [message] = await insertRow("turn_messages", {
      turn_id: appState.activeThread.turnId,
      sender_id: appState.profile.id,
      recipient_id: appState.activeThread.recipientId,
      body
    });

    appState.messages.push(message);
    form.reset();
    renderMessages();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setFormLoading(form, false);
  }
}

async function logout() {
  await authLogout();
  stopRealtimeSubscriptions();
  clearSession();
  hideApp();
  showToast("Sesión cerrada.", "info");
}

function initWaitlistForm() {
  const forms = document.querySelectorAll('[data-form="waitlist"]');

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      handleWaitlistSubmit(form);
    });
  });
}

async function handleWaitlistSubmit(form) {
  const name = normalizeText(form.querySelector('input[name="name"]').value);
  const university = normalizeText(form.querySelector('input[name="university"]').value);
  const commune = normalizeText(form.querySelector('input[name="commune"]').value);
  const email = normalizeText(form.querySelector('input[name="email"]').value).toLowerCase();

  if (!name || !university || !commune || !isUniversityEmail(email)) {
    showToast("Completa el formulario con un correo universitario válido.", "error");
    return;
  }

  setFormLoading(form, true);

  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, university, commune, email })
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "No pudimos completar el registro.");
    }

    showToast(result.message || "Registro exitoso.", "success");
    form.reset();
    closeModal("register");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setFormLoading(form, false);
  }
}

function setFormLoading(form, isLoading) {
  const submitButton = form.querySelector('button[type="submit"]');

  if (!submitButton) return;

  submitButton.disabled = isLoading;
  submitButton.dataset.originalText = submitButton.dataset.originalText || submitButton.textContent;
  submitButton.textContent = isLoading ? "Enviando..." : submitButton.dataset.originalText;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
