// Service de publication sur Facebook via l'API Graph v21.0
import type { PublishPayload, PublishResult } from "./types"

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

// Types pour les reponses de l'API Graph Facebook
interface FacebookPostResponse {
  id: string
}

interface FacebookPhotoResponse {
  id: string
}

// Construit le message complet avec contenu et hashtags
function buildMessage(content: string, hashtags: string[]): string {
  if (hashtags.length === 0) return content
  return `${content}\n\n${hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")}`
}

// Upload une photo en mode non publie pour l'attacher ensuite au post
async function uploadUnpublishedPhoto(
  pageId: string,
  accessToken: string,
  imageUrl: string
): Promise<string> {
  const response = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      published: false,
      access_token: accessToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec upload photo Facebook : ${errorText}`)
  }

  const data = (await response.json()) as FacebookPhotoResponse
  return data.id
}

// Publie un post sur une page Facebook
export async function publishToFacebook(payload: PublishPayload): Promise<PublishResult> {
  const { content, hashtags, mediaUrls, accessToken, platformPageId } = payload

  // Facebook necessite un pageId pour publier sur une page
  const pageId = platformPageId
  if (!pageId) {
    return {
      success: false,
      error: "Aucun identifiant de page Facebook configure",
    }
  }

  const message = buildMessage(content, hashtags)

  try {
    let postId: string

    if (mediaUrls.length === 0) {
      // Publication texte simple
      const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: accessToken,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Erreur API Facebook : ${errorText}`,
        }
      }

      const data = (await response.json()) as FacebookPostResponse
      postId = data.id
    } else if (mediaUrls.length === 1) {
      // Publication avec une seule image (publication directe via /photos)
      const response = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mediaUrls[0],
          message,
          access_token: accessToken,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Erreur API Facebook (photo) : ${errorText}`,
        }
      }

      const data = (await response.json()) as FacebookPostResponse
      postId = data.id
    } else {
      // Publication avec plusieurs images : upload en non-publie puis post avec attached_media
      const photoIds: string[] = []

      for (const imageUrl of mediaUrls) {
        const photoId = await uploadUnpublishedPhoto(pageId, accessToken, imageUrl)
        photoIds.push(photoId)
      }

      // Creer le post avec les photos attachees
      const attachedMedia = photoIds.reduce<Record<string, { media_fbid: string }>>(
        (acc, photoId, index) => {
          acc[`attached_media[${index}]`] = { media_fbid: photoId }
          return acc
        },
        {}
      )

      const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...attachedMedia,
          access_token: accessToken,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Erreur API Facebook (multi-photos) : ${errorText}`,
        }
      }

      const data = (await response.json()) as FacebookPostResponse
      postId = data.id
    }

    // L'ID retourne par Facebook est au format "pageId_postId"
    const postUrl = `https://www.facebook.com/${postId.replace("_", "/posts/")}`

    return {
      success: true,
      platformPostId: postId,
      platformPostUrl: postUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la publication Facebook"
    console.error("Erreur publication Facebook :", error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
