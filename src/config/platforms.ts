// Configuration des plateformes sociales

export type PlatformKey = "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "X" | "TIKTOK"

export interface PlatformLimits {
  maxChars: number
  maxHashtags: number
  maxImages: number
  maxVideoSizeMB: number
  maxVideoDurationSeconds: number
  supportedMediaTypes: string[]
}

export interface PlatformConfig {
  name: string
  icon: string
  color: string
  limits: PlatformLimits
  contentTypes: string[]
  oauthScopes: string[]
  toneGuidance: string
}

export const PLATFORM_CONFIG: Record<PlatformKey, PlatformConfig> = {
  FACEBOOK: {
    name: "Facebook",
    icon: "/platforms/facebook.svg",
    color: "#1877F2",
    limits: {
      maxChars: 63206,
      maxHashtags: 30,
      maxImages: 10,
      maxVideoSizeMB: 1024,
      maxVideoDurationSeconds: 240 * 60,
      supportedMediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    },
    contentTypes: ["POST", "STORY", "REEL"],
    oauthScopes: [
      "pages_manage_posts",
      "pages_read_engagement",
      "pages_show_list",
    ],
    toneGuidance: "Ton conversationnel, emojis acceptes, appel a l'action en fin de post. Les posts avec images ont plus de portee.",
  },
  INSTAGRAM: {
    name: "Instagram",
    icon: "/platforms/instagram.svg",
    color: "#E4405F",
    limits: {
      maxChars: 2200,
      maxHashtags: 30,
      maxImages: 10,
      maxVideoSizeMB: 650,
      maxVideoDurationSeconds: 90,
      supportedMediaTypes: ["image/jpeg", "image/png", "video/mp4"],
    },
    contentTypes: ["POST", "STORY", "REEL"],
    oauthScopes: [
      "instagram_basic",
      "instagram_content_publish",
    ],
    toneGuidance: "Visuel avant tout. Legende engageante, hashtags strategiques (15-20 max recommandes), emojis pour structurer le texte.",
  },
  LINKEDIN: {
    name: "LinkedIn",
    icon: "/platforms/linkedin.svg",
    color: "#0A66C2",
    limits: {
      maxChars: 3000,
      maxHashtags: 5,
      maxImages: 20,
      maxVideoSizeMB: 200,
      maxVideoDurationSeconds: 600,
      supportedMediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    },
    contentTypes: ["POST", "ARTICLE"],
    oauthScopes: [
      "w_member_social",
      "r_liteprofile",
    ],
    toneGuidance: "Ton professionnel mais accessible. Storytelling apprecie. Commencer par une accroche forte. Pas trop d'emojis. Hashtags en fin de post.",
  },
  X: {
    name: "X",
    icon: "/platforms/x.svg",
    color: "#000000",
    limits: {
      maxChars: 280,
      maxHashtags: 3,
      maxImages: 4,
      maxVideoSizeMB: 512,
      maxVideoDurationSeconds: 140,
      supportedMediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    },
    contentTypes: ["POST", "THREAD"],
    oauthScopes: [
      "tweet.read",
      "tweet.write",
      "users.read",
    ],
    toneGuidance: "Court et percutant. Une idee par tweet. Hashtags integres naturellement dans le texte (pas a la fin). Ton direct.",
  },
  TIKTOK: {
    name: "TikTok",
    icon: "/platforms/tiktok.svg",
    color: "#000000",
    limits: {
      maxChars: 2200,
      maxHashtags: 10,
      maxImages: 0,
      maxVideoSizeMB: 287,
      maxVideoDurationSeconds: 600,
      supportedMediaTypes: ["video/mp4", "image/jpeg"],
    },
    contentTypes: ["POST", "REEL"],
    oauthScopes: [
      "video.publish",
      "video.upload",
    ],
    toneGuidance: "Ton authentique et dynamique. Hashtags tendance. Legende courte et accrocheuse. Le contenu video est roi.",
  },
} as const
