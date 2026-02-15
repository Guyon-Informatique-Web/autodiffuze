// Service de publication sur TikTok via l'API Content Posting
import type { PublishPayload, PublishResult } from "./types"

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2"

// Types pour les reponses de l'API TikTok
interface TikTokVideoPublishResponse {
  data: {
    publish_id: string
  }
  error: {
    code: string
    message: string
    log_id: string
  }
}

interface TikTokPhotoPublishResponse {
  data: {
    publish_id: string
  }
  error: {
    code: string
    message: string
    log_id: string
  }
}

// Construit le titre avec contenu et hashtags
function buildTitle(content: string, hashtags: string[]): string {
  if (hashtags.length === 0) return content
  const hashtagText = hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")
  const fullText = `${content} ${hashtagText}`
  // TikTok limite le titre a 2200 caracteres
  if (fullText.length <= 2200) return fullText
  return content
}

// Verifie si une URL pointe vers une video
function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".wmv", ".webm"]
  const lowered = url.toLowerCase().split("?")[0]
  return videoExtensions.some((ext) => lowered.endsWith(ext))
}

// Publie une video sur TikTok via l'API Content Posting
async function publishVideo(
  accessToken: string,
  title: string,
  videoUrl: string
): Promise<PublishResult> {
  const response = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: "SELF_ONLY", // Par defaut en prive, l'utilisateur peut changer
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return {
      success: false,
      error: `Erreur API TikTok (video) : ${errorText}`,
    }
  }

  const data = (await response.json()) as TikTokVideoPublishResponse

  if (data.error?.code && data.error.code !== "ok") {
    return {
      success: false,
      error: `Erreur TikTok : ${data.error.message} (${data.error.code})`,
    }
  }

  return {
    success: true,
    platformPostId: data.data.publish_id,
    // TikTok ne fournit pas d'URL directe dans la reponse de publication
    // Le contenu est traite de facon asynchrone
  }
}

// Publie des photos sur TikTok via l'API Content Posting
async function publishPhotos(
  accessToken: string,
  title: string,
  imageUrls: string[]
): Promise<PublishResult> {
  const response = await fetch(`${TIKTOK_API_BASE}/post/publish/content/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: "SELF_ONLY",
        disable_comment: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        media_type: "PHOTO",
        photo_images: imageUrls,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return {
      success: false,
      error: `Erreur API TikTok (photo) : ${errorText}`,
    }
  }

  const data = (await response.json()) as TikTokPhotoPublishResponse

  if (data.error?.code && data.error.code !== "ok") {
    return {
      success: false,
      error: `Erreur TikTok : ${data.error.message} (${data.error.code})`,
    }
  }

  return {
    success: true,
    platformPostId: data.data.publish_id,
  }
}

// Publie du contenu sur TikTok
export async function publishToTiktok(payload: PublishPayload): Promise<PublishResult> {
  const { content, hashtags, mediaUrls, accessToken } = payload

  const title = buildTitle(content, hashtags)

  // TikTok est une plateforme principalement video
  // Sans media, on ne peut pas publier
  if (mediaUrls.length === 0) {
    return {
      success: false,
      error: "TikTok necessite au moins un media (video ou image) pour publier. Publication ignoree.",
    }
  }

  try {
    // Determiner si on a des videos ou des images
    const videoUrls = mediaUrls.filter(isVideoUrl)
    const imageUrls = mediaUrls.filter((url) => !isVideoUrl(url))

    // Priorite aux videos sur TikTok
    if (videoUrls.length > 0) {
      // Publier la premiere video (TikTok ne supporte qu'une video par post)
      return await publishVideo(accessToken, title, videoUrls[0])
    }

    // Si pas de video mais des images, publier comme diaporama photo
    if (imageUrls.length > 0) {
      return await publishPhotos(accessToken, title, imageUrls)
    }

    // Aucun media utilisable
    return {
      success: false,
      error: "Aucun media compatible TikTok trouve. Publication ignoree.",
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la publication TikTok"
    console.error("Erreur publication TikTok :", error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
