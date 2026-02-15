// Types pour les services de publication sur les plateformes sociales

export interface PublishResult {
  success: boolean
  platformPostId?: string
  platformPostUrl?: string
  error?: string
}

export interface PublishPayload {
  content: string
  hashtags: string[]
  mediaUrls: string[]
  accessToken: string // Deja dechiffre
  platformAccountId: string
  platformPageId?: string | null
}
