// Gestion du state OAuth pour la protection CSRF
// Genere et verifie un state signe avec HMAC SHA-256
import { createHmac, randomBytes } from "crypto"

interface OAuthStateData {
  userId: string
  clientId: string
  platform: string
}

interface OAuthStatePayload extends OAuthStateData {
  nonce: string
  timestamp: number
}

// Duree de validite du state : 10 minutes
const STATE_TTL_MS = 10 * 60 * 1000

function getSigningKey(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY manquant dans les variables d'environnement"
    )
  }
  return key
}

// Signe un payload avec HMAC SHA-256
function sign(payload: string): string {
  const hmac = createHmac("sha256", getSigningKey())
  hmac.update(payload)
  return hmac.digest("hex")
}

// Genere un state OAuth signe contenant les donnees utilisateur + nonce + timestamp
export function generateOAuthState(data: OAuthStateData): string {
  const payload: OAuthStatePayload = {
    ...data,
    nonce: randomBytes(16).toString("hex"),
    timestamp: Date.now(),
  }

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )
  const signature = sign(payloadBase64)

  return `${payloadBase64}.${signature}`
}

// Verifie et decode un state OAuth. Retourne les donnees ou null si invalide.
export function verifyOAuthState(state: string): OAuthStateData | null {
  try {
    const parts = state.split(".")
    if (parts.length !== 2) {
      return null
    }

    const [payloadBase64, signature] = parts

    // Verifier la signature HMAC
    const expectedSignature = sign(payloadBase64)
    if (signature !== expectedSignature) {
      return null
    }

    // Decoder le payload
    const payload: OAuthStatePayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    )

    // Verifier que le state n'a pas expire
    if (Date.now() - payload.timestamp > STATE_TTL_MS) {
      return null
    }

    return {
      userId: payload.userId,
      clientId: payload.clientId,
      platform: payload.platform,
    }
  } catch {
    return null
  }
}

// Genere un state OAuth pour X (Twitter) qui inclut aussi le code_verifier PKCE
interface XOAuthStateData extends OAuthStateData {
  codeVerifier: string
}

// Genere un state OAuth signe contenant aussi le code_verifier pour PKCE (X/Twitter)
export function generateOAuthStateWithPKCE(
  data: OAuthStateData
): { state: string; codeVerifier: string } {
  const codeVerifier = randomBytes(32).toString("base64url")

  const payload: OAuthStatePayload & { codeVerifier: string } = {
    ...data,
    codeVerifier,
    nonce: randomBytes(16).toString("hex"),
    timestamp: Date.now(),
  }

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )
  const signature = sign(payloadBase64)

  return {
    state: `${payloadBase64}.${signature}`,
    codeVerifier,
  }
}

// Verifie et decode un state OAuth avec code_verifier PKCE
export function verifyOAuthStateWithPKCE(
  state: string
): XOAuthStateData | null {
  try {
    const parts = state.split(".")
    if (parts.length !== 2) {
      return null
    }

    const [payloadBase64, signature] = parts

    // Verifier la signature HMAC
    const expectedSignature = sign(payloadBase64)
    if (signature !== expectedSignature) {
      return null
    }

    // Decoder le payload
    const payload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    ) as OAuthStatePayload & { codeVerifier: string }

    // Verifier que le state n'a pas expire
    if (Date.now() - payload.timestamp > STATE_TTL_MS) {
      return null
    }

    if (!payload.codeVerifier) {
      return null
    }

    return {
      userId: payload.userId,
      clientId: payload.clientId,
      platform: payload.platform,
      codeVerifier: payload.codeVerifier,
    }
  } catch {
    return null
  }
}
