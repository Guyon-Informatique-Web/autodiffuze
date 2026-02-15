// Section hero de la landing page
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Orbes decoratives en arriere-plan */}
      <div className="pointer-events-none absolute inset-0">
        {/* Orbe violet -- haut gauche */}
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full opacity-20 blur-[100px] animate-float-slow dark:opacity-15"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }}
        />
        {/* Orbe bleu -- bas droite */}
        <div
          className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px] animate-float-slower dark:opacity-10"
          style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
        />
        {/* Anneau concentrique -- centre */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full border border-violet-500/10 animate-pulse-ring" />
          <div className="absolute inset-8 rounded-full border border-blue-500/10 animate-pulse-ring delay-500" />
          <div className="absolute inset-16 rounded-full border border-violet-500/5 animate-pulse-ring delay-300" />
        </div>
        {/* Grille de points -- texture subtile */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1.5 text-xs font-medium backdrop-blur-sm animate-slide-up">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Nouveau -- Adaptation automatique par plateforme
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-slide-up delay-100">
            Vos annonces,{" "}
            <span className="text-gradient">partout</span>,{" "}
            <br className="hidden sm:block" />
            automatiquement
          </h1>

          {/* Sous-titre */}
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed animate-slide-up delay-200">
            Redigez une seule fois, laissez notre IA adapter le contenu a chaque
            reseau social, et publiez sur toutes vos plateformes en un clic.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-slide-up delay-300">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-violet-600 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-blue-600 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 h-12 px-8 text-base"
            >
              <Link href="/register">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-12 px-8 text-base"
            >
              <Link href="/features">Decouvrir les fonctionnalites</Link>
            </Button>
          </div>

          {/* Indicateur de confiance */}
          <p className="mt-6 text-xs text-muted-foreground animate-slide-up delay-400">
            Gratuit pour demarrer -- aucune carte bancaire requise
          </p>
        </div>

        {/* Illustration abstraite -- maquette du dashboard */}
        <div className="relative mx-auto mt-16 max-w-4xl animate-slide-up delay-500">
          <div className="relative overflow-hidden rounded-xl border bg-card/80 shadow-2xl shadow-violet-500/10 backdrop-blur-sm">
            {/* Barre de titre */}
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto rounded-md bg-muted px-16 py-1 text-xs text-muted-foreground">
                autodiffuze.com/dashboard
              </div>
            </div>
            {/* Contenu simule */}
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-4">
                {/* Cartes de stats simulees */}
                {[
                  { label: "Publications", value: "47", color: "from-violet-500 to-violet-600" },
                  { label: "Planifiees", value: "12", color: "from-blue-500 to-blue-600" },
                  { label: "Plateformes", value: "5", color: "from-indigo-500 to-indigo-600" },
                  { label: "Credits IA", value: "38", color: "from-purple-500 to-purple-600" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border bg-card p-4"
                  >
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                    <div className={`mt-2 h-1 w-12 rounded-full bg-gradient-to-r ${stat.color}`} />
                  </div>
                ))}
              </div>
              {/* Lignes simulees */}
              <div className="mt-6 space-y-3">
                {[0.85, 0.7, 0.55].map((opacity, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="h-3 rounded bg-muted" style={{ width: `${opacity * 100}%` }} />
                      <div className="mt-1.5 h-2 w-24 rounded bg-muted" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-5 w-5 rounded bg-muted" />
                      <div className="h-5 w-5 rounded bg-muted" />
                      <div className="h-5 w-5 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Reflet degrade sous la maquette */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 h-16 w-3/4 rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 blur-2xl" />
        </div>
      </div>
    </section>
  )
}
