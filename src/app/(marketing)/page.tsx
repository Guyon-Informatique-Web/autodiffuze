// Landing page -- page d'accueil marketing
import type { Metadata } from "next"
import Link from "next/link"
import { Hero } from "@/components/marketing/Hero"
import { PlatformLogos } from "@/components/marketing/PlatformLogos"
import { FeatureGrid } from "@/components/marketing/FeatureGrid"
import { PricingCards } from "@/components/marketing/PricingCards"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PenSquare, Sparkles, Rocket, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Accueil - Vos annonces, partout, automatiquement",
  description:
    "Autodiffuze adapte et publie automatiquement vos annonces sur Facebook, Instagram, LinkedIn, TikTok et plus. Essayez gratuitement.",
}

// Donnees de la section "Comment ca marche"
const steps = [
  {
    icon: PenSquare,
    title: "Redigez",
    description: "Creez votre contenu ou laissez l'IA le generer pour vous a partir d'une simple description.",
    number: "01",
  },
  {
    icon: Sparkles,
    title: "Adaptez",
    description: "L'IA ajuste automatiquement le ton, la longueur et les hashtags pour chaque plateforme cible.",
    number: "02",
  },
  {
    icon: Rocket,
    title: "Diffusez",
    description: "Publiez en un clic sur tous vos reseaux ou planifiez la diffusion pour plus tard.",
    number: "03",
  },
]

// Donnees FAQ
const faqItems = [
  {
    question: "Quelles plateformes sont supportees ?",
    answer:
      "Autodiffuze supporte actuellement Facebook, Instagram, LinkedIn, X (Twitter) et TikTok. D'autres plateformes seront ajoutees progressivement.",
  },
  {
    question: "Comment fonctionne l'adaptation IA ?",
    answer:
      "Notre IA analyse votre contenu de base et l'adapte pour chaque plateforme : elle ajuste la longueur, le ton, ajoute les hashtags pertinents et respecte les contraintes techniques de chaque reseau (280 caracteres pour X, format visuel pour Instagram, etc.).",
  },
  {
    question: "Le plan gratuit est-il vraiment gratuit ?",
    answer:
      "Oui, le plan gratuit est utilisable sans limite de temps et sans carte bancaire. Il inclut 10 publications par mois, 2 plateformes et 5 generations IA. Parfait pour tester le service.",
  },
  {
    question: "Puis-je gerer plusieurs clients ou marques ?",
    answer:
      "Oui, les plans Pro et Agence permettent de gerer respectivement 5 et 25 clients. Chaque client dispose de ses propres connexions aux plateformes et de son propre contenu.",
  },
  {
    question: "Mes donnees sont-elles securisees ?",
    answer:
      "Absolument. Les tokens d'acces aux plateformes sont chiffres en base de donnees. Nous utilisons Supabase pour l'authentification et le stockage, avec des mesures de securite de niveau entreprise.",
  },
  {
    question: "Puis-je annuler mon abonnement a tout moment ?",
    answer:
      "Oui, vous pouvez annuler votre abonnement a tout moment depuis vos parametres. L'acces aux fonctionnalites premium restera actif jusqu'a la fin de votre periode de facturation.",
  },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Plateformes supportees */}
      <PlatformLogos />

      {/* Comment ca marche */}
      <section className="py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Simple et rapide
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Comment ca{" "}
              <span className="text-gradient">marche</span> ?
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {/* Ligne de connexion entre les etapes (desktop) */}
                {i < steps.length - 1 && (
                  <div className="absolute top-10 left-[calc(50%+3rem)] hidden h-px w-[calc(100%-6rem)] bg-gradient-to-r from-violet-300 to-blue-300 dark:from-violet-700 dark:to-blue-700 sm:block" />
                )}

                {/* Numero et icone */}
                <div className="relative mx-auto mb-6">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/20">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalites */}
      <FeatureGrid />

      {/* Pricing */}
      <div className="bg-muted/30">
        <PricingCards />
      </div>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-violet-600 dark:text-violet-400">
              FAQ
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Questions frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border bg-card px-6 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        {/* Fond degrade */}
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
            Pret a automatiser vos publications ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/80">
            Rejoignez Autodiffuze et gagnez du temps sur la gestion de vos reseaux sociaux.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
