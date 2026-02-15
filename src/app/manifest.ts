// Manifest PWA -- configuration de l'application web progressive
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Autodiffuze",
    short_name: "Autodiffuze",
    description: "Diffusez vos annonces sur tous vos reseaux sociaux automatiquement",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7C3AED",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  }
}
