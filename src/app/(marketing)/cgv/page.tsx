// Conditions Generales de Vente -- CGV du service Autodiffuze
import type { Metadata } from "next"
import { APP_CONFIG } from "@/config/app"

export const metadata: Metadata = {
  title: "Conditions Generales de Vente",
  description: `Conditions Generales de Vente du service ${APP_CONFIG.name} - abonnements, paiements, resiliation.`,
}

// Date de derniere mise a jour des CGV
const LAST_UPDATED = "15 fevrier 2026"

export default function CgvPage() {
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
            Conditions Generales{" "}
            <span className="text-gradient">de Vente</span>
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

            {/* Article 1 - Objet */}
            <div>
              <h2 className="text-2xl font-bold">Article 1 - Objet</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Les presentes Conditions Generales de Vente (ci-apres "CGV") regissent
                les conditions d'utilisation et de souscription au service{" "}
                <strong className="text-foreground">{APP_CONFIG.name}</strong>, edite par{" "}
                {APP_CONFIG.company.name} ({APP_CONFIG.company.status}).
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {APP_CONFIG.name} est un service en ligne (SaaS) de diffusion automatique
                d'annonces et de contenu sur plusieurs plateformes de reseaux sociaux
                (Facebook, Instagram, LinkedIn, X, TikTok). Le service inclut une fonctionnalite
                d'adaptation intelligente du contenu par intelligence artificielle.
              </p>
            </div>

            {/* Article 2 - Inscription et compte */}
            <div>
              <h2 className="text-2xl font-bold">Article 2 - Inscription et compte utilisateur</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pour utiliser le service, l'utilisateur doit creer un compte en fournissant
                une adresse email valide et un mot de passe, ou en se connectant via un
                service d'authentification tiers (OAuth Google ou GitHub).
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                L'utilisateur s'engage a fournir des informations exactes et a jour.
                Il est responsable de la confidentialite de ses identifiants de connexion
                et de toute activite realisee depuis son compte.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {APP_CONFIG.company.name} se reserve le droit de suspendre ou supprimer
                un compte en cas de non-respect des presentes CGV ou d'utilisation abusive
                du service.
              </p>
            </div>

            {/* Article 3 - Plans et tarifs */}
            <div>
              <h2 className="text-2xl font-bold">Article 3 - Plans et tarifs</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Le service {APP_CONFIG.name} propose trois formules d'abonnement :
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-left font-semibold">Plan</th>
                      <th className="py-3 px-4 text-left font-semibold">Tarif mensuel</th>
                      <th className="py-3 pl-4 text-left font-semibold">Tarif annuel</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="py-3 pr-4 font-medium text-foreground">Gratuit</td>
                      <td className="py-3 px-4">0,00 EUR</td>
                      <td className="py-3 pl-4">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 pr-4 font-medium text-foreground">Pro</td>
                      <td className="py-3 px-4">19,99 EUR / mois</td>
                      <td className="py-3 pl-4">199,99 EUR / an</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 pr-4 font-medium text-foreground">Agence</td>
                      <td className="py-3 px-4">49,99 EUR / mois</td>
                      <td className="py-3 pl-4">499,99 EUR / an</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-muted-foreground leading-relaxed">
                Les tarifs sont indiques en euros (EUR), toutes taxes comprises (TTC).
                {APP_CONFIG.company.name} etant une micro-entreprise, la TVA n'est pas
                applicable (article 293 B du CGI).
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Les fonctionnalites et limites de chaque plan sont detaillees sur la page{" "}
                <a href="/pricing" className="text-violet-600 hover:underline dark:text-violet-400">
                  Tarifs
                </a>.
              </p>
            </div>

            {/* Article 4 - Paiement */}
            <div>
              <h2 className="text-2xl font-bold">Article 4 - Paiement</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Les paiements sont effectues en euros (EUR) par carte bancaire (Visa, Mastercard,
                American Express) via la plateforme de paiement securisee{" "}
                <strong className="text-foreground">Stripe</strong>.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                L'abonnement est renouvele automatiquement a la fin de chaque periode de
                facturation (mensuelle ou annuelle), sauf resiliation prealable par
                l'utilisateur. Le prelevement est effectue au debut de chaque nouvelle
                periode.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                En cas d'echec de paiement, {APP_CONFIG.company.name} se reserve le droit
                de suspendre l'acces aux fonctionnalites premium apres notification par
                email.
              </p>
            </div>

            {/* Article 5 - Droit de retractation */}
            <div>
              <h2 className="text-2xl font-bold">Article 5 - Droit de retractation</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Conformement aux articles L.221-18 et suivants du Code de la consommation,
                l'utilisateur consommateur dispose d'un delai de <strong className="text-foreground">14 jours
                calendaires</strong> a compter de la souscription d'un abonnement payant pour
                exercer son droit de retractation, sans avoir a justifier de motifs ni a
                payer de penalites.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Pour exercer ce droit, l'utilisateur doit adresser sa demande par email a{" "}
                <a href={`mailto:${APP_CONFIG.company.email}`} className="text-violet-600 hover:underline dark:text-violet-400">
                  {APP_CONFIG.company.email}
                </a>{" "}
                en indiquant clairement sa volonte de se retracter. Le remboursement sera
                effectue dans un delai de 14 jours suivant la reception de la demande,
                via le meme moyen de paiement que celui utilise pour la transaction initiale.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Toutefois, si l'utilisateur a expressement demande le debut de l'execution
                du service avant l'expiration du delai de retractation et a reconnu perdre
                son droit de retractation, le remboursement sera calcule au prorata de
                l'utilisation du service.
              </p>
            </div>

            {/* Article 6 - Resiliation */}
            <div>
              <h2 className="text-2xl font-bold">Article 6 - Resiliation et suppression de compte</h2>

              <h3 className="mt-6 text-lg font-semibold">6.1 Resiliation par l'utilisateur</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                L'utilisateur peut resilier son abonnement a tout moment depuis les
                parametres de son compte. La resiliation prend effet a la fin de la
                periode de facturation en cours. L'acces aux fonctionnalites premium
                est maintenu jusqu'a cette date.
              </p>

              <h3 className="mt-6 text-lg font-semibold">6.2 Suppression de compte</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                L'utilisateur peut demander la suppression definitive de son compte
                et de toutes ses donnees associees. Cette suppression est irreversible.
                Les donnees seront supprimees dans un delai de 30 jours suivant la demande,
                conformement a notre politique de confidentialite.
              </p>

              <h3 className="mt-6 text-lg font-semibold">6.3 Resiliation par l'editeur</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {APP_CONFIG.company.name} se reserve le droit de resilier l'acces au
                service en cas de violation des presentes CGV, d'utilisation frauduleuse
                ou abusive du service, ou de non-paiement. L'utilisateur sera notifie
                par email avant toute suspension ou resiliation.
              </p>
            </div>

            {/* Article 7 - Limitations de responsabilite */}
            <div>
              <h2 className="text-2xl font-bold">Article 7 - Limitations de responsabilite</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Le service {APP_CONFIG.name} est fourni "en l'etat".{" "}
                {APP_CONFIG.company.name} s'engage a mettre en oeuvre tous les moyens
                raisonnables pour assurer la disponibilite et le bon fonctionnement du service,
                sans toutefois garantir une disponibilite ininterrompue.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Le service s'appuie sur des API tierces fournies par Meta (Facebook, Instagram),
                LinkedIn, X (anciennement Twitter) et TikTok. {APP_CONFIG.company.name} ne
                peut etre tenu responsable :
              </p>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Des modifications, interruptions ou suppressions des API de ces plateformes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Des changements de politique ou de conditions d'utilisation de ces plateformes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Des refus de publication ou de la suppression de contenu par ces plateformes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Des dommages indirects lies a l'utilisation ou a l'impossibilite d'utiliser le service</span>
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                L'utilisateur est seul responsable du contenu qu'il publie via le service
                et s'engage a respecter les conditions d'utilisation de chaque plateforme
                tierce.
              </p>
            </div>

            {/* Article 8 - Propriete intellectuelle */}
            <div>
              <h2 className="text-2xl font-bold">Article 8 - Propriete intellectuelle</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                L'ensemble des elements composant le service {APP_CONFIG.name} (interface,
                code source, textes, logos, design) est la propriete exclusive de{" "}
                {APP_CONFIG.company.name} et est protege par les lois relatives a la
                propriete intellectuelle.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                L'utilisateur conserve l'integralite des droits de propriete intellectuelle
                sur les contenus qu'il cree et publie via le service. En utilisant{" "}
                {APP_CONFIG.name}, l'utilisateur accorde a {APP_CONFIG.company.name} une
                licence limitee, non exclusive et revocable pour traiter et diffuser
                ces contenus dans le cadre strict de la fourniture du service.
              </p>
            </div>

            {/* Article 9 - Donnees personnelles */}
            <div>
              <h2 className="text-2xl font-bold">Article 9 - Donnees personnelles</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Le traitement des donnees personnelles est regi par notre{" "}
                <a href="/privacy" className="text-violet-600 hover:underline dark:text-violet-400">
                  politique de confidentialite
                </a>,
                accessible a tout moment depuis le site.
              </p>
            </div>

            {/* Article 10 - Modification des CGV */}
            <div>
              <h2 className="text-2xl font-bold">Article 10 - Modification des CGV</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {APP_CONFIG.company.name} se reserve le droit de modifier les presentes
                CGV a tout moment. Les utilisateurs seront informes par email de toute
                modification substantielle au moins 30 jours avant son entree en vigueur.
                La poursuite de l'utilisation du service apres cette date vaut acceptation
                des nouvelles conditions.
              </p>
            </div>

            {/* Article 11 - Droit applicable */}
            <div>
              <h2 className="text-2xl font-bold">Article 11 - Droit applicable et litiges</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Les presentes CGV sont soumises au droit francais.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                En cas de litige relatif a l'interpretation ou a l'execution des presentes
                CGV, les parties s'engagent a rechercher une solution amiable avant toute
                action judiciaire. A defaut d'accord amiable, le litige sera porte devant
                le tribunal competent du domicile du defenseur, conformement aux regles
                de droit commun.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Conformement aux articles L.616-1 et R.616-1 du Code de la consommation,
                le consommateur peut recourir gratuitement au service de mediation propose
                par {APP_CONFIG.company.name}. Le mediateur peut etre saisi via la
                plateforme europeenne de reglement en ligne des litiges :{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 hover:underline dark:text-violet-400"
                >
                  https://ec.europa.eu/consumers/odr
                </a>.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold">Contact</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pour toute question relative aux presentes CGV, vous pouvez nous contacter a
                l'adresse suivante :{" "}
                <a href={`mailto:${APP_CONFIG.company.email}`} className="text-violet-600 hover:underline dark:text-violet-400">
                  {APP_CONFIG.company.email}
                </a>.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
