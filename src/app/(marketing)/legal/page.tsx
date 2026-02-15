// Mentions legales -- informations sur l'editeur du site
import type { Metadata } from "next"
import { APP_CONFIG } from "@/config/app"

export const metadata: Metadata = {
  title: "Mentions legales",
  description: `Mentions legales du site ${APP_CONFIG.name} - ${APP_CONFIG.company.name}`,
}

// Date de derniere mise a jour des mentions legales
const LAST_UPDATED = "15 fevrier 2026"

export default function LegalPage() {
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
            Mentions{" "}
            <span className="text-gradient">legales</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Derniere mise a jour : {LAST_UPDATED}
          </p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-12">

            {/* Editeur du site */}
            <div>
              <h2 className="text-2xl font-bold">Editeur du site</h2>
              <div className="mt-4 space-y-2 text-muted-foreground leading-relaxed">
                <p>
                  Le site <strong className="text-foreground">{APP_CONFIG.name}</strong> est edite par :
                </p>
                <ul className="mt-3 space-y-1.5 list-none">
                  <li><strong className="text-foreground">Raison sociale :</strong> {APP_CONFIG.company.name}</li>
                  <li><strong className="text-foreground">Statut juridique :</strong> {APP_CONFIG.company.status}</li>
                  <li><strong className="text-foreground">Directeur de la publication :</strong> Valentin Guyon</li>
                  <li>
                    <strong className="text-foreground">Email :</strong>{" "}
                    <a href={`mailto:${APP_CONFIG.company.email}`} className="text-violet-600 hover:underline dark:text-violet-400">
                      {APP_CONFIG.company.email}
                    </a>
                  </li>
                  <li>
                    <strong className="text-foreground">Site principal :</strong>{" "}
                    <a href={APP_CONFIG.company.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline dark:text-violet-400">
                      {APP_CONFIG.company.website}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Nature du site */}
            <div>
              <h2 className="text-2xl font-bold">Nature du site</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {APP_CONFIG.name} est un outil SaaS (Software as a Service) de diffusion automatique
                de contenu sur les reseaux sociaux. Il permet aux utilisateurs de creer, adapter
                et publier du contenu simultanement sur plusieurs plateformes (Facebook, Instagram,
                LinkedIn, X, TikTok) grace a une intelligence artificielle.
              </p>
            </div>

            {/* Hebergement */}
            <div>
              <h2 className="text-2xl font-bold">Hebergement</h2>
              <div className="mt-4 space-y-1.5 text-muted-foreground leading-relaxed">
                <p>Le site est heberge par :</p>
                <ul className="mt-3 space-y-1.5 list-none">
                  <li><strong className="text-foreground">Societe :</strong> Vercel Inc.</li>
                  <li><strong className="text-foreground">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
                  <li>
                    <strong className="text-foreground">Site web :</strong>{" "}
                    <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline dark:text-violet-400">
                      https://vercel.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Propriete intellectuelle */}
            <div>
              <h2 className="text-2xl font-bold">Propriete intellectuelle</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                L'ensemble du contenu du site {APP_CONFIG.name} (textes, images, logos, icones,
                code source, design) est la propriete exclusive de {APP_CONFIG.company.name},
                sauf mention contraire. Toute reproduction, distribution, modification ou
                utilisation de ces elements sans autorisation prealable ecrite est strictement
                interdite.
              </p>
            </div>

            {/* Responsabilite */}
            <div>
              <h2 className="text-2xl font-bold">Limitation de responsabilite</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {APP_CONFIG.company.name} s'efforce de fournir des informations aussi
                precises que possible sur le site {APP_CONFIG.name}. Toutefois, l'editeur
                ne saurait etre tenu responsable des omissions, des inexactitudes ou des
                carences dans la mise a jour des informations, qu'elles soient de son fait
                ou du fait des tiers partenaires qui lui fournissent ces informations.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Le service s'appuie sur des API tierces (Meta, LinkedIn, X, TikTok) dont
                la disponibilite et le fonctionnement ne dependent pas de {APP_CONFIG.company.name}.
                L'editeur ne peut etre tenu responsable des dysfonctionnements lies a ces services externes.
              </p>
            </div>

            {/* Donnees personnelles */}
            <div>
              <h2 className="text-2xl font-bold">Donnees personnelles</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pour en savoir plus sur la collecte et le traitement de vos donnees personnelles,
                veuillez consulter notre{" "}
                <a href="/privacy" className="text-violet-600 hover:underline dark:text-violet-400">
                  politique de confidentialite
                </a>.
              </p>
            </div>

            {/* Droit applicable */}
            <div>
              <h2 className="text-2xl font-bold">Droit applicable</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Les presentes mentions legales sont soumises au droit francais.
                En cas de litige, et apres tentative de resolution amiable, competence
                est attribuee aux tribunaux francais competents.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
