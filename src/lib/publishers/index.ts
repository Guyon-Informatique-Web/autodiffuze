// Registre des services de publication par plateforme
import type { PlatformType } from "@prisma/client"
import type { PublishPayload, PublishResult } from "./types"
import { publishToFacebook } from "./facebook"
import { publishToInstagram } from "./instagram"
import { publishToLinkedin } from "./linkedin"
import { publishToX } from "./x"
import { publishToTiktok } from "./tiktok"

export const publishers: Record<PlatformType, (payload: PublishPayload) => Promise<PublishResult>> = {
  FACEBOOK: publishToFacebook,
  INSTAGRAM: publishToInstagram,
  LINKEDIN: publishToLinkedin,
  X: publishToX,
  TIKTOK: publishToTiktok,
}

export type { PublishPayload, PublishResult } from "./types"
