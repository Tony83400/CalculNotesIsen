const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
module.exports = function setupSession() {
  if (process.env.SESSION_ENCRYPTION_KEY) return;
  const file = path.resolve(".env.local");
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (!/^SESSION_ENCRYPTION_KEY\s*=/m.test(existing)) {
    fs.appendFileSync(
      file,
      `\n# Server only. Never prefix with EXPO_PUBLIC_.\nSESSION_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}\n`,
      { mode: 0o600 },
    );
    fs.chmodSync(file, 0o600);
  }
  process.loadEnvFile(file);
};
if (require.main === module) {
  module.exports();
  console.log(
    "Clé de session locale prête dans .env.local (fichier ignoré par Git).",
  );
}
