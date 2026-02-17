// Service de publication sur LinkedIn via l'API v2
import type { PublishPayload, PublishResult } from "./types"

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2"

// Types pour les reponses de l'API LinkedIn
interface LinkedInUgcPostResponse {
  id: string
}

interface LinkedInRegisterUploadResponse {
  value: {
    uploadMechanism: {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
        uploadUrl: string
      }
    }
    asset: string
  }
}

// Construit le texte complet avec contenu et hashtags
function buildShareText(content: string, hashtags: string[]): string {
  if (hashtags.length === 0) return content
  return `${content}\n\n${hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ")}`
}

// Enregistre un upload de media aupres de LinkedIn et retourne l'URL d'upload et l'asset URN
async function registerMediaUpload(
  accessToken: string,
  ownerUrn: string
): Promise<{ uploadUrl: string; assetUrn: string }> {
  const response = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: ownerUrn,
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        serviceRelationships: [
          {
            identifier: "urn:li:userGeneratedContent",
            relationshipType: "OWNER",
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Echec enregistrement upload LinkedIn : ${errorText}`)
  }

  const data = (await response.json()) as LinkedInRegisterUploadResponse
  const uploadUrl =
    data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl
  const assetUrn = data.value.asset

  return { uploadUrl, assetUrn }
}

// Telecharge le binaire d'une image depuis une URL et l'uploade vers LinkedIn
async function uploadMediaToLinkedIn(
  accessToken: string,
  uploadUrl: string,
  mediaUrl: string
): Promise<void> {
  // Telecharger le media depuis l'URL source
  const mediaResponse = await fetch(mediaUrl)
  if (!mediaResponse.ok) {
    throw new Error(`Impossible de telecharger le media depuis : ${mediaUrl}`)
  }

  const mediaBuffer = await mediaResponse.arrayBuffer()

  // Uploader vers LinkedIn
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: mediaBuffer,
  })

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text()
    throw new Error(`Echec upload media LinkedIn : ${errorText}`)
  }
}

// Publie un post sur LinkedIn (profil personnel ou page entreprise)
export async function publishToLinkedin(payload: PublishPayload): Promise<PublishResult> {
  const { content, hashtags, mediaUrls, accessToken, platformAccountId, platformPageId } = payload

  // Si platformPageId est renseigne, publier sur la page entreprise
  // Sinon, publier sur le profil personnel
  const authorUrn = platformPageId
    ? `urn:li:organization:${platformPageId}`
    : `urn:li:person:${platformAccountId}`
  const shareText = buildShareText(content, hashtags)

  try {
    // Preparer les medias si presents
    const mediaAssets: string[] = []

    if (mediaUrls.length > 0) {
      for (const mediaUrl of mediaUrls) {
        const { uploadUrl, assetUrn } = await registerMediaUpload(accessToken, authorUrn)
        await uploadMediaToLinkedIn(accessToken, uploadUrl, mediaUrl)
        mediaAssets.push(assetUrn)
      }
    }

    // Construire le body du post UGC
    const shareMediaCategory = mediaAssets.length > 0 ? "IMAGE" : "NONE"
    const mediaContent =
      mediaAssets.length > 0
        ? mediaAssets.map((asset) => ({
            status: "READY",
            media: asset,
          }))
        : []

    const ugcPostBody = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: shareText,
          },
          shareMediaCategory,
          ...(mediaContent.length > 0 ? { media: mediaContent } : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcPostBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Erreur API LinkedIn : ${errorText}`,
      }
    }

    const data = (await response.json()) as LinkedInUgcPostResponse

    // L'ID LinkedIn est au format "urn:li:share:xxx" ou "urn:li:ugcPost:xxx"
    // Extraire l'identifiant numerique pour construire l'URL
    const postId = data.id
    const numericId = postId.split(":").pop() ?? postId
    const postUrl = `https://www.linkedin.com/feed/update/${postId}/`

    return {
      success: true,
      platformPostId: numericId,
      platformPostUrl: postUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la publication LinkedIn"
    console.error("Erreur publication LinkedIn :", error)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
