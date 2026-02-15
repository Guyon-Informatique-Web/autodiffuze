// Service de publication sur X (Twitter) via l'API v2
import type { PublishPayload, PublishResult } from "./types"

const X_API_BASE = "https://api.x.com/2"
const X_UPLOAD_BASE = "https://upload.twitter.com/1.1"

// Types pour les reponses de l'API X
interface XTweetResponse {
  data: {
    id: string
    text: string
  }
}

interface XMediaUploadInitResponse {
  media_id_string: string
}

interface XMediaUploadFinalizeResponse {
  media_id_string: string
  processing_info?: {
    state: string
    check_after_secs: number
  }
}

interface XMediaUploadStatusResponse {
  processing_info?: {
    state: string
    check_after_secs?: number
    error?: {
      message: string
    }
  }
}

// Construit le texte du tweet avec contenu et hashtags
function buildTweetText(content: string, hashtags: string[]): string {
  if (hashtags.length === 0) return content
  const hashtagText = hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")
  // Verifier que le tweet complet ne depasse pas 280 caracteres
  const fullText = `${content}\n\n${hashtagText}`
  if (fullText.length <= 280) return fullText
  // Si trop long, tronquer les hashtags
  return content
}

// Upload un media vers X en utilisant le processus en 3 etapes (INIT, APPEND, FINALIZE)
async function uploadMediaToX(
  accessToken: string,
  mediaUrl: string
): Promise<string> {
  // Telecharger le media depuis l'URL source
  const mediaResponse = await fetch(mediaUrl)
  if (!mediaResponse.ok) {
    throw new Error(`Impossible de telecharger le media depuis : ${mediaUrl}`)
  }

  const mediaBuffer = await mediaResponse.arrayBuffer()
  const mediaBytes = new Uint8Array(mediaBuffer)
  const contentType = mediaResponse.headers.get("content-type") ?? "application/octet-stream"

  // Determiner le type de media pour X
  const isVideo = contentType.startsWith("video/")
  const mediaCategory = isVideo ? "tweet_video" : "tweet_image"

  // Etape 1 : INIT - Initialiser l'upload
  const initParams = new URLSearchParams({
    command: "INIT",
    total_bytes: mediaBytes.length.toString(),
    media_type: contentType,
    media_category: mediaCategory,
  })

  const initResponse = await fetch(`${X_UPLOAD_BASE}/media/upload.json?${initParams.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!initResponse.ok) {
    const errorText = await initResponse.text()
    throw new Error(`Echec INIT upload media X : ${errorText}`)
  }

  const initData = (await initResponse.json()) as XMediaUploadInitResponse
  const mediaId = initData.media_id_string

  // Etape 2 : APPEND - Envoyer les donnees du media par morceaux
  const chunkSize = 5 * 1024 * 1024 // 5 Mo par chunk
  let segmentIndex = 0

  for (let offset = 0; offset < mediaBytes.length; offset += chunkSize) {
    const chunk = mediaBytes.slice(offset, Math.min(offset + chunkSize, mediaBytes.length))
    const formData = new FormData()
    formData.append("command", "APPEND")
    formData.append("media_id", mediaId)
    formData.append("segment_index", segmentIndex.toString())
    formData.append("media_data", Buffer.from(chunk).toString("base64"))

    const appendResponse = await fetch(`${X_UPLOAD_BASE}/media/upload.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!appendResponse.ok) {
      const errorText = await appendResponse.text()
      throw new Error(`Echec APPEND upload media X (segment ${segmentIndex}) : ${errorText}`)
    }

    segmentIndex++
  }

  // Etape 3 : FINALIZE - Terminer l'upload
  const finalizeParams = new URLSearchParams({
    command: "FINALIZE",
    media_id: mediaId,
  })

  const finalizeResponse = await fetch(
    `${X_UPLOAD_BASE}/media/upload.json?${finalizeParams.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!finalizeResponse.ok) {
    const errorText = await finalizeResponse.text()
    throw new Error(`Echec FINALIZE upload media X : ${errorText}`)
  }

  const finalizeData = (await finalizeResponse.json()) as XMediaUploadFinalizeResponse

  // Si le media necessite un traitement asynchrone (videos), attendre la fin
  if (finalizeData.processing_info) {
    await waitForMediaProcessing(accessToken, mediaId)
  }

  return mediaId
}

// Attend la fin du traitement asynchrone d'un media (videos)
async function waitForMediaProcessing(
  accessToken: string,
  mediaId: string,
  maxAttempts: number = 30
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusParams = new URLSearchParams({
      command: "STATUS",
      media_id: mediaId,
    })

    const statusResponse = await fetch(
      `${X_UPLOAD_BASE}/media/upload.json?${statusParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!statusResponse.ok) {
      throw new Error("Echec verification statut media X")
    }

    const statusData = (await statusResponse.json()) as XMediaUploadStatusResponse

    if (!statusData.processing_info) return // Traitement termine

    const { state, check_after_secs, error } = statusData.processing_info

    if (state === "succeeded") return
    if (state === "failed") {
      throw new Error(`Traitement media X echoue : ${error?.message ?? "erreur inconnue"}`)
    }

    // Attendre le delai recommande par l'API
    const waitMs = (check_after_secs ?? 5) * 1000
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }

  throw new Error("Delai d'attente depasse pour le traitement du media X")
}

// Publie un tweet sur X
export async function publishToX(payload: PublishPayload): Promise<PublishResult> {
  const { content, hashtags, mediaUrls, accessToken, platformAccountId } = payload

  const tweetText = buildTweetText(content, hashtags)

  try {
    // Uploader les medias si presents
    const mediaIds: string[] = []
    for (const mediaUrl of mediaUrls) {
      const mediaId = await uploadMediaToX(accessToken, mediaUrl)
      mediaIds.push(mediaId)
    }

    // Construire le body du tweet
    const tweetBody: Record<string, unknown> = {
      text: tweetText,
    }

    if (mediaIds.length > 0) {
      tweetBody.media = {
        media_ids: mediaIds,
      }
    }

    // Publier le tweet
    const response = await fetch(`${X_API_BASE}/tweets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tweetBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Erreur API X : ${errorText}`,
      }
    }

    const data = (await response.json()) as XTweetResponse
    const tweetId = data.data.id
    const tweetUrl = `https://x.com/${platformAccountId}/status/${tweetId}`

    return {
      success: true,
      platformPostId: tweetId,
      platformPostUrl: tweetUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la publication sur X"
    console.error("Erreur publication X :", error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
