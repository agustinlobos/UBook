const UNIVERSITY_DOMAINS = [
  "udd.cl",
  "miuandes.cl",
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

const BLOCKED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "live.com",
  "msn.com",
  "protonmail.com"
]);

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;
const rateLimitStore = new Map();

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function normalizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getEmailDomain(email) {
  return email.trim().toLowerCase().split("@")[1] || "";
}

function isUniversityEmail(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (!/^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanEmail)) {
    return false;
  }

  const domain = getEmailDomain(cleanEmail);

  if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return false;
  }

  return UNIVERSITY_DOMAINS.some((universityDomain) => {
    return domain === universityDomain || domain.endsWith(`.${universityDomain}`);
  });
}

function validatePayload(payload) {
  const name = normalizeText(payload.name);
  const university = normalizeText(payload.university);
  const commune = normalizeText(payload.commune);
  const email = normalizeText(payload.email).toLowerCase();

  if (name.length < 2 || name.length > 120) {
    return { error: "Ingresa un nombre valido." };
  }

  if (university.length < 2 || university.length > 120) {
    return { error: "Ingresa una universidad valida." };
  }

  if (commune.length < 2 || commune.length > 120) {
    return { error: "Ingresa una comuna valida." };
  }

  if (!isUniversityEmail(email)) {
    return {
      error:
        "Usa un correo universitario chileno valido. No se aceptan correos personales."
    };
  }

  return {
    data: {
      name,
      university,
      commune,
      email
    }
  };
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + WINDOW_MS };

  if (record.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return record.count > MAX_REQUESTS_PER_WINDOW;
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!origin || allowedOrigins.length === 0) {
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host || allowedOrigins.includes(origin);
  } catch {
    return false;
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (rawBody.length > 10_000) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  return JSON.parse(rawBody || "{}");
}

async function insertWaitlistSignup(signup) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      status: 503,
      message: "El backend no tiene configurada la conexion con Supabase."
    };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(signup)
  });

  if (response.ok) {
    return { ok: true };
  }

  const error = await response.json().catch(() => ({}));

  if (response.status === 409 || error.code === "23505") {
    return {
      ok: false,
      status: 409,
      message: "Este correo ya esta registrado en la lista de espera."
    };
  }

  return {
    ok: false,
    status: 502,
    message: "No pudimos guardar el registro. Intentalo nuevamente."
  };
}

module.exports = async function handler(req, res) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { message: "Metodo no permitido." });
  }

  if (!isAllowedOrigin(req)) {
    return sendJson(res, 403, { message: "Origen no permitido." });
  }

  const ip = getClientIp(req);

  if (isRateLimited(`ip:${ip}`)) {
    return sendJson(res, 429, { message: "Demasiados intentos. Intenta mas tarde." });
  }

  let payload;

  try {
    payload = await readBody(req);
  } catch {
    return sendJson(res, 400, { message: "Solicitud invalida." });
  }

  const validation = validatePayload(payload);

  if (validation.error) {
    return sendJson(res, 400, { message: validation.error });
  }

  if (isRateLimited(`email:${validation.data.email}`)) {
    return sendJson(res, 429, { message: "Demasiados intentos. Intenta mas tarde." });
  }

  const result = await insertWaitlistSignup(validation.data);

  if (!result.ok) {
    return sendJson(res, result.status, { message: result.message });
  }

  return sendJson(res, 201, {
    message: "Registro exitoso. Ya estas en la lista de espera de UBook."
  });
};
