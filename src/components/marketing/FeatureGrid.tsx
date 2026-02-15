// Grille des fonctionnalites principales
import {
  Users,
  Sparkles,
  CalendarClock,
  LayoutTemplate,
  Share2,
  Activity,
} from "lucide-react"

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Multi-clients",
    description:
      "Gerez plusieurs marques et clients depuis un seul tableau de bord. Chaque client a ses propres connexions et contenus.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Sparkles,
    title: "Adaptation IA",
    description:
      "Notre IA adapte automatiquement le ton, la longueur et le format de votre contenu pour chaque reseau social.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: CalendarClock,
    title: "Planification",
    description:
      "Programmez vos publications a l'avance et laissez Autodiffuze les publier au moment ideal.",
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    icon: LayoutTemplate,
    title: "Templates",
    description:
      "Creez des modeles de publication reutilisables pour gagner du temps sur vos contenus recurrents.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Share2,
    title: "5 plateformes",
    description:
      "Facebook, Instagram, LinkedIn, X et TikTok. Connectez tous vos comptes et publiez partout en un clic.",
    gradient: "from-violet-600 to-indigo-500",
  },
  {
    icon: Activity,
    title: "Suivi en temps reel",
    description:
      "Suivez le statut de chaque publication par plateforme. Retentez automatiquement en cas d'echec.",
    gradient: "from-blue-600 to-violet-500",
  },
]

export function FeatureGrid() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* En-tete de section */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Fonctionnalites
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Tout ce qu'il faut pour{" "}
            <span className="text-gradient">automatiser</span>{" "}
            vos publications
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Un seul outil pour rediger, adapter et diffuser votre contenu
            sur toutes les plateformes.
          </p>
        </div>

        {/* Grille de fonctionnalites */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-1"
            >
              {/* Icone avec fond degrade */}
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} text-white shadow-sm`}
              >
                <feature.icon className="h-5 w-5" />
              </div>

              <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Accent degrade au survol */}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r ${feature.gradient} transition-all duration-500 group-hover:w-full`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
