// Configuration generale de l'application Autodiffuze

export const APP_CONFIG = {
  name: "Autodiffuze",
  tagline: "Vos annonces, partout, automatiquement",
  taglineAlt: "Diffusez une fois, publiez partout",
  description: "Outil de diffusion automatique d'annonces multi-plateformes avec adaptation IA",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  email: {
    from: process.env.EMAIL_FROM || "noreply@autodiffuze.com",
    support: "support@autodiffuze.com",
  },
  company: {
    name: "Guyon Informatique & Web",
    status: "Micro-entreprise",
    email: "contact@guyoninformatique.fr",
    website: "https://guyon-informatique-web.fr",
  },
  social: {
    twitter: "",
    linkedin: "",
    github: "",
  },
} as const
