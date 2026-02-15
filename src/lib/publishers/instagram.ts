// Service de publication sur Instagram via l'API Instagram Graph (Meta)
import type { PublishPayload, PublishResult } from "./types"

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

// Types pour les reponses de l'API Instagram Graph
interface InstagramMediaContainerResponse {
  id: string
}

interface InstagramPublishResponse {
  id: string
}

interface InstagramMediaInfoResponse {
  id: string
  shortcode?: string
  permalink?: string
}

// Construit la legende complete avec contenu et hashtags
function buildCaption(content: string, hashtags: string[]): string {
  if (hashtags.length === 0) return content
  return `${content}\n\n${hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")}`
}

// Verifie si une URL pointe vers une video
function isVideoUrl(url: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".wmv", ".webm"]
  const lowered = url.toLowerCase().split("?")[0]
  return videoExtensions.some((ext) => lowered.endsWith(ext))
}

// Attend que le container media soit pret (Instagram traite les medias de facon asynchrone)
async function waitForMediaContainer(
  containerId: string,
  accessToken: string,
  maxAttempts: number = 30,
  delayMs: number = 2000
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    )

    if (response.ok) {
      const data = (await response.json()) as { status_code: string }
      if (data.status_code === "FINISHED") return
      if (data.status_code === "ERROR") {
        throw new Error("Instagram a signale une erreur lors du traitement du media")
      }
    }

    // Attendre avant de reverifier
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  throw new Error("Delai d'attente depasse pour le traitement du media Instagram")
}

// Cree un container media simple (image ou video)
async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  mediaUrl: string,
  caption: string
): Promise<string> {
  const isVideo = isVideoUrl(mediaUrl)

  const body: Record<string, string> = {
    caption,
    access_token: accessToken,
  }

  if (isVideo) {
    body.media_type = "VIDEO"
    body.video_url = mediaUrl
  } else {
    body.image_url = mediaUrl
  }

  const response = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec creation container Instagram : ${errorText}`)
  }

  const data = (await response.json()) as InstagramMediaContainerResponse
  return data.id
}

// Cree un container enfant pour un carrousel (sans caption)
async function createCarouselItemContainer(
  igUserId: string,
  accessToken: string,
  mediaUrl: string
): Promise<string> {
  const isVideo = isVideoUrl(mediaUrl)

  const body: Record<string, string> = {
    access_token: accessToken,
    is_carousel_item: "true",
  }

  if (isVideo) {
    body.media_type = "VIDEO"
    body.video_url = mediaUrl
  } else {
    body.image_url = mediaUrl
  }

  const response = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec creation item carrousel Instagram : ${errorText}`)
  }

  const data = (await response.json()) as InstagramMediaContainerResponse
  return data.id
}

// Publie un container media sur Instagram
async function publishContainer(
  igUserId: string,
  accessToken: string,
  containerId: string
): Promise<string> {
  const response = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec publication container Instagram : ${errorText}`)
  }

  const data = (await response.json()) as InstagramPublishResponse
  return data.id
}

// Recupere les informations du post publie (shortcode, permalink)
async function getMediaInfo(
  mediaId: string,
  accessToken: string
): Promise<{ shortcode: string; permalink: string }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${mediaId}?fields=shortcode,permalink&access_token=${accessToken}`
  )

  if (!response.ok) {
    // Retourner des valeurs par defaut si la requete echoue
    return {
      shortcode: mediaId,
      permalink: `https://www.instagram.com/p/${mediaId}/`,
    }
  }

  const data = (await response.json()) as InstagramMediaInfoResponse
  return {
    shortcode: data.shortcode ?? mediaId,
    permalink: data.permalink ?? `https://www.instagram.com/p/${data.shortcode ?? mediaId}/`,
  }
}

// Publie du contenu sur Instagram
export async function publishToInstagram(payload: PublishPayload): Promise<PublishResult> {
  const { content, hashtags, mediaUrls, accessToken, platformAccountId } = payload
  const igUserId = platformAccountId

  // Instagram exige au moins un media pour publier
  if (mediaUrls.length === 0) {
    return {
      success: false,
      error: "Instagram necessite au moins une image ou video pour publier",
    }
  }

  const caption = buildCaption(content, hashtags)

  try {
    let publishedMediaId: string

    if (mediaUrls.length === 1) {
      // Publication simple (une image ou une video)
      const containerId = await createMediaContainer(igUserId, accessToken, mediaUrls[0], caption)

      // Attendre que le media soit traite (surtout pour les videos)
      if (isVideoUrl(mediaUrls[0])) {
        await waitForMediaContainer(containerId, accessToken)
      }

      publishedMediaId = await publishContainer(igUserId, accessToken, containerId)
    } else {
      // Publication carrousel (plusieurs medias)
      const childContainerIds: string[] = []

      for (const mediaUrl of mediaUrls) {
        const childId = await createCarouselItemContainer(igUserId, accessToken, mediaUrl)

        // Attendre le traitement des videos
        if (isVideoUrl(mediaUrl)) {
          await waitForMediaContainer(childId, accessToken)
        }

        childContainerIds.push(childId)
      }

      // Creer le container carrousel parent
      const carouselResponse = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "CAROUSEL",
          caption,
          children: childContainerIds,
          access_token: accessToken,
        }),
      })

      if (!carouselResponse.ok) {
        const errorText = await carouselResponse.text()
        return {
          success: false,
          error: `Erreur creation carrousel Instagram : ${errorText}`,
        }
      }

      const carouselData = (await carouselResponse.json()) as InstagramMediaContainerResponse
      publishedMediaId = await publishContainer(igUserId, accessToken, carouselData.id)
    }

    // Recuperer le shortcode et le permalink du post publie
    const mediaInfo = await getMediaInfo(publishedMediaId, accessToken)

    return {
      success: true,
      platformPostId: publishedMediaId,
      platformPostUrl: mediaInfo.permalink,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la publication Instagram"
    console.error("Erreur publication Instagram :", error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
