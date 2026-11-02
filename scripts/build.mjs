// Monta o site em dist/ e gera firebase-config.js a partir das variáveis de ambiente.
// Na Vercel as variáveis vêm do painel do projeto; localmente, do arquivo .env.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

try {
  process.loadEnvFile();
} catch {
  // sem .env: usa só as variáveis já definidas no ambiente
}

const VARS = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  storageBucket: "FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "FIREBASE_MESSAGING_SENDER_ID",
  appId: "FIREBASE_APP_ID",
};

const config = Object.fromEntries(
  Object.entries(VARS).map(([key, env]) => [key, process.env[env] ?? ""])
);

const missing = Object.entries(VARS).filter(([key]) => !config[key]).map(([, env]) => env);
if (missing.length) console.warn(`Aviso: variáveis não definidas: ${missing.join(", ")}`);

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
for (const file of ["index.html", "style.css", "app.js", "assets"]) {
  cpSync(file, `dist/${file}`, { recursive: true });
}

writeFileSync(
  "dist/firebase-config.js",
  `// Gerado por scripts/build.mjs — não edite.\nexport const firebaseConfig = ${JSON.stringify(config, null, 2)};\n`
);

console.log("Site gerado em dist/");
