/** Constantes de dominio de umoov. */

/**
 * Allowlist de dominios de correo universitario chileno (EPIC 2).
 * Solo estudiantes con estos dominios pueden registrarse.
 * Ampliar a medida que se sumen universidades al piloto.
 */
export const UNIVERSITY_EMAIL_DOMAINS = [
  "udd.cl", // Universidad del Desarrollo
  "uc.cl", // Pontificia Universidad Católica
  "uchile.cl", // Universidad de Chile
  "usach.cl", // Universidad de Santiago
  "uai.cl", // Universidad Adolfo Ibáñez
  "alumnos.uai.cl",
  "udp.cl", // Universidad Diego Portales
  "unab.cl", // Universidad Andrés Bello
  "uandes.cl", // Universidad de los Andes
  "miuandes.cl",
  "usm.cl", // Universidad Técnica Federico Santa María
  "pucv.cl", // Pontificia Universidad Católica de Valparaíso
  "uv.cl", // Universidad de Valparaíso
  "utem.cl", // Universidad Tecnológica Metropolitana
  "umayor.cl", // Universidad Mayor
  "ufrontera.cl", // Universidad de La Frontera
  "udec.cl", // Universidad de Concepción
  "ucsc.cl", // Universidad Católica de la Santísima Concepción
  "uft.cl", // Universidad Finis Terrae
  "uss.cl", // Universidad San Sebastián
  "ucentral.cl", // Universidad Central
  "duocuc.cl", // Duoc UC
  "santotomas.cl", // Universidad Santo Tomás
  "uct.cl", // Universidad Católica de Temuco
  "uach.cl", // Universidad Austral de Chile
  "ubiobio.cl", // Universidad del Bío-Bío
  "utalca.cl", // Universidad de Talca
] as const;

/** Dominios personales explícitamente bloqueados. */
export const BLOCKED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "live.com",
  "msn.com",
  "protonmail.com",
]);

const EMAIL_REGEX = /^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/** Sectores/comunas iniciales (zonas prioritarias del informe). */
export const SECTORS = [
  "Chicureo",
  "Piedra Roja",
  "Chamisero",
  "Colina",
  "Lampa",
  "Buin",
  "Paine",
  "San Bernardo",
  "Lo Barnechea",
  "Vitacura",
  "Las Condes",
  "Providencia",
  "Ñuñoa",
  "La Florida",
  "Puente Alto",
  "Talagante",
  "Pirque",
  "Curacaví",
] as const;

/**
 * Devuelve true si el correo pertenece a un dominio universitario permitido.
 * Acepta subdominios (ej. alumnos.uc.cl).
 */
export function isUniversityEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  if (!isValidEmailFormat(clean)) return false;
  const domain = clean.split("@")[1];
  if (!domain || BLOCKED_EMAIL_DOMAINS.has(domain)) return false;
  return UNIVERSITY_EMAIL_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}
