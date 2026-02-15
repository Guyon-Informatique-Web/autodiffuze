// Chiffrement et dechiffrement des tokens OAuth
// Utilise AES-256-GCM pour stocker les tokens en base de donnees
import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY manquant dans les variables d'environnement")
  }
  // La cle doit faire 32 bytes (256 bits) en hex = 64 caracteres
  return Buffer.from(key, "hex")
}

// Chiffre un token. Retourne une string au format iv:encrypted:tag en hex.
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, "utf8", "hex")
  encrypted += cipher.final("hex")

  const tag = cipher.getAuthTag()

  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`
}

// Dechiffre un token chiffre au format iv:encrypted:tag
export function decryptToken(ciphertext: string): string {
  const key = getEncryptionKey()
  const parts = ciphertext.split(":")

  if (parts.length !== 3) {
    throw new Error("Format de token chiffre invalide")
  }

  const iv = Buffer.from(parts[0], "hex")
  const encrypted = parts[1]
  const tag = Buffer.from(parts[2], "hex")

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}
