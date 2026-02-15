// Page Fonctionnalites -- detail des fonctionnalites
import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Users,
  Sparkles,
  CalendarClock,
  LayoutTemplate,
  Share2,
  Activity,
  Shield,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Fonctionnalites",
  description: "Decouvrez toutes les fonctionnalites d'Autodiffuze : adaptation IA, multi-plateformes, planification et plus.",
}

interface FeatureDetail {
  icon: React.ElementType
  title: string
  description: string
  details: string[]
  gradient: string
}

const featureDetails: FeatureDetail[] = [
  {
    icon: Sparkles,
    title: "Adaptation IA intelligente",
    description:
      "Notre IA analyse votre contenu de base et le transforme pour chaque plateforme. Le ton, la longueur, les hashtags et le format sont ajustes automatiquement.",
    details: [
      "Ajustement automatique du ton (professionnel pour LinkedIn, decontracte pour Facebook...)",
      "Respect des limites de caracteres de chaque plateforme",
      "Generation de hashtags pertinents et strategiques",
      "Possibilite de modifier le contenu adapte avant publication",
    ],
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Share2,
    title: "Multi-plateformes",
    description:
      "Connectez tous vos comptes en un clic. Facebook, Instagram, LinkedIn, X et TikTok sont supportes nativement.",
    details: [
      "Connexion OAuth securisee a chaque plateforme",
      "Publication simultanee sur toutes les plateformes selectionnees",
      "Rafraichissement automatique des tokens d'acces",
      "Gestion des erreurs et retry automatique",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Gestion multi-clients",
    description:
      "Ideal pour les agences et freelances. Chaque client dispose de son propre espace avec ses connexions et son contenu.",
    details: [
      "Tableau de bord par client ou vue globale",
      "Connexions aux plateformes independantes par client",
      "Historique des publications par client",
      "Jusqu'a 25 clients avec le plan Agence",
    ],
    gradient: "from-indigo-500 to-blue-600",
  },
  {
    icon: CalendarClock,
    title: "Planification avancee",
    description:
      "Programmez vos publications a l'avance et laissez Autodiffuze gerer la diffusion au moment prevu.",
    details: [
      "Calendrier visuel de vos publications",
      "Choix precis de la date et de l'heure",
      "Execution automatique via notre systeme de jobs",
      "Notifications en cas de succes ou d'erreur",
    ],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: LayoutTemplate,
    title: "Templates reutilisables",
    description:
      "Creez des modeles de publication pour vos contenus recurrents. Gagnez du temps en reutilisant vos structures preferees.",
    details: [
      "Modeles avec contenu pre-rempli",
      "Association a des plateformes specifiques",
      "Categories et hashtags pre-configures",
      "Duplication rapide pour chaque nouveau post",
    ],
    gradient: "from-violet-600 to-indigo-500",
  },
  {
    icon: Activity,
    title: "Suivi en temps reel",
    description:
      "Visualisez le statut de chaque publication sur chaque plateforme. Identifiez rapidement les erreurs et relancez en un clic.",
    details: [
      "Statut en temps reel par plateforme (publie, en cours, echoue)",
      "Lien direct vers le post sur chaque reseau",
      "Retry automatique ou manuel en cas d'echec",
      "Historique complet des publications",
    ],
    gradient: "from-blue-600 to-violet-500",
  },
  {
    icon: Shield,
    title: "Securite renforcee",
    description:
      "Vos donnees et tokens d'acces sont proteges par des mesures de securite avancees.",
    details: [
      "Chiffrement des tokens d'acces aux plateformes",
      "Authentification securisee via Supabase",
      "Connexion OAuth (Google, GitHub)",
      "Protection CSRF et validation des entrees",
    ],
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Zap,
    title: "Performance optimale",
    description:
      "Publication asynchrone et file d'attente intelligente pour gerer de gros volumes sans ralentissement.",
    details: [
      "Publication asynchrone via systeme de jobs",
      "Retry intelligent avec backoff exponentiel",
      "Traitement en parallele des plateformes",
      "Interface reactive et rapide",
    ],
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "Pret pour l'international",
    description:
      "Architecture concue pour le multilingue. Interface en francais au lancement, avec support anglais a venir.",
    details: [
      "Architecture i18n integree (next-intl)",
      "Interface entierement en francais",
      "Support de l'anglais prevu dans une prochaine version",
      "Adaptation du contenu selon la langue cible",
    ],
    gradient: "from-sky-500 to-blue-600",
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* En-tete de page */}
      <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-15 blur-[120px]"
            style={{ background: "radial-gradient(circle, #7C3AED 0%, #3B82F6 50%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Toutes les fonctionnalites pour{" "}
            <span className="text-gradient">automatiser</span>{" "}
            vos publications
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Decouvrez en detail ce qu'Autodiffuze peut faire pour vous.
          </p>
        </div>
      </section>

      {/* Liste detaillee */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="space-y-16 sm:space-y-24">
            {featureDetails.map((feature, index) => (
              <div
                key={feature.title}
                className={`flex flex-col gap-8 sm:gap-12 ${
                  index % 2 === 1 ? "sm:flex-row-reverse" : "sm:flex-row"
                } items-start`}
              >
                {/* Icone / illustration */}
                <div className="shrink-0">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg sm:h-20 sm:w-20`}
                  >
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{feature.title}</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5">
                        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br ${feature.gradient}`} />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-blue-500" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Convaincu ? Lancez-vous maintenant
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/80">
            Creez votre compte gratuit en quelques secondes et commencez a diffuser.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              asChild
              className="bg-white text-violet-700 hover:bg-white/90 h-12 px-8 text-base font-semibold shadow-lg"
            >
              <Link href="/register">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
