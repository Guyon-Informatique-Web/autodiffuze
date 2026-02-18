// Callback OAuth Meta (Facebook + Instagram)
// Echange le code contre des tokens et cree les connexions Facebook + Instagram
import { NextResponse } from "next/server"
import { verifyOAuthState } from "@/lib/oauth/state"
import { encryptToken } from "@/lib/crypto"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"

// Types pour les reponses API Meta
interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

interface MetaPage {
  id: string
  name: string
  access_token: string
  category?: string
}

interface MetaPagesResponse {
  data: MetaPage[]
}

interface MetaInstagramResponse {
  instagram_business_account?: {
    id: string
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  // Si l'utilisateur a refuse l'autorisation
  if (errorParam) {
    console.error("Erreur OAuth Meta retournee par Facebook :", errorParam)
    return NextResponse.redirect(
      new URL("/dashboard?error=oauth_denied&platform=meta", origin)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    )
  }

  // Verifier le state CSRF
  const stateData = verifyOAuthState(state)
  if (!stateData) {
    return NextResponse.redirect(
      new URL("/dashboard?error=invalid_state", origin)
    )
  }

  const { userId, clientId } = stateData

  try {
    // Etape 1 : Echanger le code contre un token court terme
    const tokenParams = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: process.env.META_REDIRECT_URI!,
      code,
    })

    const shortTokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`
    )

    if (!shortTokenResponse.ok) {
      const errorBody = await shortTokenResponse.text()
      console.error("Erreur echange code Meta :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=meta`,
          origin
        )
      )
    }

    const shortTokenData: MetaTokenResponse = await shortTokenResponse.json()

    // Etape 2 : Echanger le token court terme contre un token longue duree (60 jours)
    const longTokenParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: shortTokenData.access_token,
    })

    const longTokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${longTokenParams.toString()}`
    )

    if (!longTokenResponse.ok) {
      const errorBody = await longTokenResponse.text()
      console.error(
        "Erreur echange token longue duree Meta :",
        errorBody
      )
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=meta`,
          origin
        )
      )
    }

    const longTokenData: MetaTokenResponse = await longTokenResponse.json()
    const userAccessToken = longTokenData.access_token

    // Etape 3 : Recuperer les pages de l'utilisateur
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`
    )

    if (!pagesResponse.ok) {
      const errorBody = await pagesResponse.text()
      console.error("Erreur recuperation pages Meta :", errorBody)
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=meta`,
          origin
        )
      )
    }

    const pagesData: MetaPagesResponse = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=no_pages&platform=meta`,
          origin
        )
      )
    }

    // Utiliser la premiere page trouvee
    const page = pagesData.data[0]
    const pageAccessToken = page.access_token

    // Calculer la date d'expiration du token (60 jours pour les tokens longue duree)
    const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    // Etape 4 : Verification de la limite de plateformes du plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, isAdmin: true },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/clients/${clientId}?error=oauth_failed&platform=meta`,
          origin
        )
      )
    }

    const planLimits = getPlanLimits(user.plan as PlanType, user.isAdmin)

    // Verifier si la connexion Facebook existe deja (mise a jour vs nouvelle)
    const existingFbConnection = await prisma.platformConnection.findUnique({
      where: {
        clientId_platform_platformAccountId: {
          clientId,
          platform: "FACEBOOK",
          platformAccountId: page.id,
        },
      },
    })

    if (!existingFbConnection) {
      const activeConnections = await prisma.platformConnection.count({
        where: { clientId, isActive: true },
      })

      if (activeConnections >= planLimits.maxPlatforms) {
        return NextResponse.redirect(
          new URL(
            `/dashboard/clients/${clientId}?error=platform_limit`,
            origin
          )
        )
      }
    }

    // Etape 5 : Creer/mettre a jour la connexion Facebook avec le page access token
    await prisma.platformConnection.upsert({
      where: {
        clientId_platform_platformAccountId: {
          clientId,
          platform: "FACEBOOK",
          platformAccountId: page.id,
        },
      },
      update: {
        accessToken: encryptToken(pageAccessToken),
        refreshToken: null,
        tokenExpiresAt,
        platformAccountName: page.name,
        platformPageId: page.id,
        isActive: true,
        errorMessage: null,
      },
      create: {
        userId,
        clientId,
        platform: "FACEBOOK",
        platformAccountId: page.id,
        platformAccountName: page.name,
        platformPageId: page.id,
        accessToken: encryptToken(pageAccessToken),
        tokenExpiresAt,
        isActive: true,
      },
    })

    // Etape 5 : Verifier si un compte Instagram Business est lie a la page
    try {
      const igResponse = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
      )

      if (igResponse.ok) {
        const igData: MetaInstagramResponse = await igResponse.json()

        if (igData.instagram_business_account) {
          const igAccountId = igData.instagram_business_account.id

          // Recuperer le nom du compte Instagram
          const igProfileResponse = await fetch(
            `https://graph.facebook.com/v21.0/${igAccountId}?fields=username,name&access_token=${pageAccessToken}`
          )

          let igAccountName = `Instagram (${page.name})`
          if (igProfileResponse.ok) {
            const igProfile = (await igProfileResponse.json()) as {
              username?: string
              name?: string
            }
            igAccountName = igProfile.username ?? igProfile.name ?? igAccountName
          }

          // Verifier la limite de plateformes avant de creer la connexion Instagram
          const existingIgConnection = await prisma.platformConnection.findUnique({
            where: {
              clientId_platform_platformAccountId: {
                clientId,
                platform: "INSTAGRAM",
                platformAccountId: igAccountId,
              },
            },
          })

          if (!existingIgConnection) {
            const activeConnectionsForIg = await prisma.platformConnection.count({
              where: { clientId, isActive: true },
            })

            if (activeConnectionsForIg >= planLimits.maxPlatforms) {
              // La limite est atteinte, on ne cree pas la connexion Instagram
              // mais la connexion Facebook a deja ete creee/mise a jour
              console.warn(
                "Limite de plateformes atteinte pour Instagram, seul Facebook a ete connecte"
              )
              return NextResponse.redirect(
                new URL(
                  `/dashboard/clients/${clientId}?connected=meta`,
                  origin
                )
              )
            }
          }

          // Creer/mettre a jour la connexion Instagram
          await prisma.platformConnection.upsert({
            where: {
              clientId_platform_platformAccountId: {
                clientId,
                platform: "INSTAGRAM",
                platformAccountId: igAccountId,
              },
            },
            update: {
              accessToken: encryptToken(pageAccessToken),
              refreshToken: null,
              tokenExpiresAt,
              platformAccountName: igAccountName,
              platformPageId: page.id,
              isActive: true,
              errorMessage: null,
            },
            create: {
              userId,
              clientId,
              platform: "INSTAGRAM",
              platformAccountId: igAccountId,
              platformAccountName: igAccountName,
              platformPageId: page.id,
              accessToken: encryptToken(pageAccessToken),
              tokenExpiresAt,
              isActive: true,
            },
          })
        }
      }
    } catch (igError) {
      // L'echec de la connexion Instagram n'est pas bloquant
      console.error(
        "Erreur recuperation compte Instagram :",
        igError
      )
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?connected=meta`,
        origin
      )
    )
  } catch (error) {
    console.error("Erreur callback OAuth Meta :", error)
    return NextResponse.redirect(
      new URL(
        `/dashboard/clients/${clientId}?error=oauth_failed&platform=meta`,
        origin
      )
    )
  }
}
