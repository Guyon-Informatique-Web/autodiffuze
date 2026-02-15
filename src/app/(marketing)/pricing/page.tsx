// Page Tarifs -- comparatif detaille des plans
import type { Metadata } from "next"
import { PricingCards } from "@/components/marketing/PricingCards"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Decouvrez nos plans tarifaires : Gratuit, Pro et Agence. Commencez gratuitement sans carte bancaire.",
}

// FAQ specifique au pricing
const pricingFaq = [
  {
    question: "Puis-je changer de plan a tout moment ?",
    answer:
      "Oui, vous pouvez passer a un plan superieur ou inferieur a tout moment. La difference sera calculee au prorata pour le mois en cours.",
  },
  {
    question: "Y a-t-il un engagement minimum ?",
    answer:
      "Non, aucun engagement. Les abonnements sont renouvelables mensuellement ou annuellement et vous pouvez annuler quand vous voulez.",
  },
  {
    question: "Que se passe-t-il si je depasse mes limites ?",
    answer:
      "Vous recevrez une notification lorsque vous approchez de vos limites. Au-dela, les publications supplementaires seront mises en attente jusqu'au renouvellement de votre compteur mensuel.",
  },
  {
    question: "Le plan annuel est-il vraiment avantageux ?",
    answer:
      "Oui, le plan annuel vous fait economiser l'equivalent de 2 mois de facturation par rapport au tarif mensuel.",
  },
  {
    question: "Proposez-vous des tarifs speciaux pour les grandes agences ?",
    answer:
      "Oui, contactez-nous pour un devis personnalise si vous avez besoin de plus de 25 clients ou de limites plus elevees.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires Visa, Mastercard et American Express via notre partenaire de paiement securise Stripe.",
  },
]

export default function PricingPage() {
  return (
    <>
      {/* En-tete de page */}
      <section className="relative overflow-hidden pt-28 pb-8 sm:pt-36">
        {/* Fond decoratif */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-15 blur-[120px]"
            style={{ background: "radial-gradient(circle, #7C3AED 0%, #3B82F6 50%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Des tarifs{" "}
            <span className="text-gradient">simples et transparents</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choisissez le plan adapte a vos besoins. Evolutif a tout moment.
          </p>
        </div>
      </section>

      {/* Cartes de pricing */}
      <PricingCards />

      {/* FAQ pricing */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Questions sur les tarifs
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {pricingFaq.map((item, i) => (
              <AccordionItem
                key={i}
                value={`pricing-faq-${i}`}
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
    </>
  )
}
