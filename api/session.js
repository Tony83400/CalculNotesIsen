const {
  randomBytes,
  createCipheriv,
  createDecipheriv,
} = require("node:crypto");
const { Buffer } = require("node:buffer");
const TTL = 7 * 24 * 60 * 60;
const PURPOSE = Buffer.from("CalculNotesISEN/remember/v1");
const fail = (status, message) => Object.assign(new Error(message), { status });

// Only the server has the encryption key. No plaintext credential, encryption
// key or persistent upstream token is exposed to client JavaScript.
function encryptionKey() {
  const key = process.env.SESSION_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(key))
    throw fail(
      503,
      "La connexion mémorisée n’est pas configurée sur le serveur.",
    );
  return Buffer.from(key, "hex");
}
function seal(data, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(PURPOSE);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}
function unseal(value, key) {
  if (!/^[A-Za-z0-9_-]{40,3500}$/.test(value))
    throw new Error("Invalid cookie");
  const bytes = Buffer.from(value, "base64url");
  const cipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  cipher.setAAD(PURPOSE);
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString(
      "utf8",
    ),
  );
}
const validCredentials = (data) =>
  data &&
  typeof data.username === "string" &&
  data.username.trim().length > 0 &&
  data.username.length <= 254 &&
  !/[\r\n\0]/.test(data.username) &&
  typeof data.password === "string" &&
  data.password.length > 0 &&
  Buffer.byteLength(data.password) <= 1024;
function cookieOptions(req) {
  const local =
    !process.env.VERCEL &&
    /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || "");
  return {
    name: local ? "cnisen_remember" : "__Secure-cnisen_remember",
    // Scope the cookie to this function: the external /api-proxy rewrite must
    // never receive or forward the encrypted remembered credentials.
    flags: `; Path=/api/session; HttpOnly; SameSite=Strict${local ? "" : "; Secure"}`,
  };
}
function cookie(req, res, value, seconds) {
  const { name, flags } = cookieOptions(req);
  const expires = new Date(Date.now() + seconds * 1000).toUTCString();
  res.setHeader(
    "Set-Cookie",
    `${name}=${value}; Max-Age=${seconds}; Expires=${expires}${flags}`,
  );
}
function readCookie(req) {
  const { name } = cookieOptions(req);
  return (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(name + "="))
    ?.slice(name.length + 1);
}
async function body(req) {
  if (
    !String(req.headers["content-type"] || "")
      .toLowerCase()
      .startsWith("application/json")
  )
    throw fail(415, "Un contenu JSON est attendu.");
  if (req.body !== undefined) {
    const text =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(text) > 8192)
      throw fail(413, "Requête trop volumineuse.");
    try {
      return JSON.parse(text);
    } catch {
      throw fail(400, "Requête invalide.");
    }
  }
  const chunks = [];
  let size = 0;
  const deadline = setTimeout(() => req.destroy(), 15000);
  try {
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 8192) throw fail(413, "Requête trop volumineuse.");
      chunks.push(Buffer.from(chunk));
    }
    try {
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw fail(400, "Requête invalide.");
    }
  } finally {
    clearTimeout(deadline);
  }
}
async function authenticate(data) {
  const abort = new AbortController();
  const deadline = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(
      "https://api-ent.isenengineering.fr/v1/token",
      {
        method: "POST",
        redirect: "error",
        cache: "no-store",
        signal: abort.signal,
        headers: { Accept: "*/*", "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      },
    );
    if (!response.ok) {
      await response.body?.cancel();
      throw [400, 401].includes(response.status)
        ? fail(401, "Identifiant ou mot de passe incorrect.")
        : fail(502, "Le service de connexion ISEN est indisponible.");
    }
    if (Number(response.headers.get("content-length")) > 16000)
      throw fail(502, "Réponse de connexion invalide.");
    const reader = response.body?.getReader();
    if (!reader) throw fail(502, "Réponse de connexion invalide.");
    const chunks = [];
    let size = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16000) throw fail(502, "Réponse de connexion invalide.");
        chunks.push(Buffer.from(value));
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    const token = Buffer.concat(chunks).toString("utf8").trim();
    if (!token || token.startsWith("<"))
      throw fail(502, "Réponse de connexion invalide.");
    return token;
  } catch (error) {
    if (error.status) throw error;
    throw fail(
      abort.signal.aborted ? 504 : 502,
      "Le service de connexion ISEN ne répond pas.",
    );
  } finally {
    clearTimeout(deadline);
    abort.abort();
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Vary", "Cookie");
  const send = (status, data) => {
    res.statusCode = status;
    res.end(data ? JSON.stringify(data) : undefined);
  };
  if (!["POST", "GET", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST, DELETE");
    return send(405, { error: "Méthode non autorisée." });
  }
  // A custom header plus no CORS prevents cross-origin form submissions; also
  // reject cross-site fetches and mismatched Origin explicitly, including login.
  let badOrigin = false;
  if (req.headers.origin) {
    try {
      const origin = new URL(req.headers.origin);
      const protocol = cookieOptions(req).flags.includes("; Secure")
        ? "https:"
        : "http:";
      badOrigin =
        origin.host !== req.headers.host || origin.protocol !== protocol;
    } catch {
      badOrigin = true;
    }
  }
  if (
    req.headers["x-cnisen-session"] !== "1" ||
    req.headers["sec-fetch-site"] === "cross-site" ||
    badOrigin
  )
    return send(403, { error: "Origine de la requête refusée." });
  try {
    if (req.method === "DELETE") {
      cookie(req, res, "", 0);
      return send(204);
    }
    if (req.method === "POST") {
      // Switching accounts or opting out must remove an earlier remembered login.
      cookie(req, res, "", 0);
      const data = await body(req);
      if (!validCredentials(data) || typeof data.remember !== "boolean")
        return send(400, {
          error: "Renseignez un identifiant et un mot de passe valides.",
        });
      const key = data.remember ? encryptionKey() : null;
      data.username = data.username.trim().toLowerCase();
      const token = await authenticate(data);
      if (key) {
        const exp = Date.now() + TTL * 1000;
        cookie(
          req,
          res,
          seal(
            { v: 1, username: data.username, password: data.password, exp },
            key,
          ),
          TTL,
        );
      }
      return send(200, { username: data.username, token });
    }
    const value = readCookie(req);
    if (!value) return send(204);
    const key = encryptionKey();
    let data;
    try {
      data = unseal(value, key);
      if (
        !validCredentials(data) ||
        data.v !== 1 ||
        !Number.isFinite(data.exp) ||
        data.exp <= Date.now() ||
        data.exp > Date.now() + TTL * 1000
      )
        throw new Error("Expired cookie");
    } catch {
      cookie(req, res, "", 0);
      return send(401, { error: "Session expirée. Reconnectez-vous." });
    }
    try {
      const token = await authenticate(data);
      return send(200, { username: data.username, token });
    } catch (error) {
      if (error.status === 401) cookie(req, res, "", 0);
      throw error;
    }
  } catch (error) {
    return send(error.status || 500, {
      error: error.status
        ? error.message
        : "Connexion temporairement indisponible.",
    });
  }
};
