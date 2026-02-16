// Charge les variables d'environnement depuis le fichier commun SaaS/.env.local
// Les variables prefixees AUTODIFFUZE_ sont mappees vers leur nom standard
// Les variables partagees (sans prefixe projet) sont chargees telles quelles
// Les variables deja definies (par le .env local du projet) ne sont PAS ecrasees

import { readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "dotenv";

const PROJECT_PREFIX = "AUTODIFFUZE_";
const ALL_PREFIXES = ["VIGIEWEB_", "AUTODIFFUZE_"];

const publicEnvVars: Record<string, string> = {};

try {
  const commonEnvPath = resolve(process.cwd(), "..", ".env.local");
  const content = readFileSync(commonEnvPath, "utf-8");
  const parsed = parse(content);

  for (const [key, value] of Object.entries(parsed)) {
    let targetKey: string | null = null;

    if (key.startsWith(PROJECT_PREFIX)) {
      // AUTODIFFUZE_DATABASE_URL -> DATABASE_URL
      targetKey = key.slice(PROJECT_PREFIX.length);
    } else if (!ALL_PREFIXES.some((p) => key.startsWith(p))) {
      // Variable partagee (STRIPE_SECRET_KEY, RESEND_API_KEY, etc.)
      targetKey = key;
    }
    // Les variables d'autres projets (VIGIEWEB_*) sont ignorees

    if (targetKey && value) {
      if (!process.env[targetKey]) {
        process.env[targetKey] = value;
      }
      if (targetKey.startsWith("NEXT_PUBLIC_")) {
        publicEnvVars[targetKey] = process.env[targetKey]!;
      }
    }
  }
} catch {
  // Fichier commun introuvable - on continue avec les .env locaux
}

// Export pour next.config.ts (expose les NEXT_PUBLIC_ au client)
export { publicEnvVars };
