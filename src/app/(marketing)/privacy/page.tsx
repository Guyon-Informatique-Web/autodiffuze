// Politique de confidentialite -- RGPD et protection des donnees
import type { Metadata } from "next"
import { APP_CONFIG } from "@/config/app"

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  description: `Politique de confidentialite et protection des donnees personnelles du service ${APP_CONFIG.name} - RGPD.`,
}

// Date de derniere mise a jour de la politique
const LAST_UPDATED = "15 fevrier 2026"

// Liste des sous-traitants avec leurs informations
interface SubProcessor {
  name: string
  role: string
  location: string
  guarantee: string
}

const subProcessors: SubProcessor[] = [
  {
    name: "Supabase",
    role: "Base de donnees, authentification et stockage de fichiers",
    location: "Union europeenne (region EU)",
    guarantee: "Donnees hebergees en EU",
  },
  {
    name: "Stripe",
    role: "Traitement des paiements et facturation",
    location: "Etats-Unis",
    guarantee: "Clauses contractuelles types (SCC)",
  },
  {
    name: "Anthropic",
    role: "Intelligence artificielle (adaptation de contenu)",
    location: "Etats-Unis",
    guarantee: "Clauses contractuelles types (SCC)",
  },
  {
    name: "Resend",
    role: "Envoi d'emails transactionnels",
    location: "Etats-Unis",
    guarantee: "Clauses contractuelles types (SCC)",
  },
  {
    name: "Meta (Facebook / Instagram)",
    role: "Publication de contenu sur Facebook et Instagram",
    location: "Etats-Unis",
    guarantee: "Clauses contractuelles types (SCC)",
  },
  {
    name: "LinkedIn",
    role: "Publication de contenu sur LinkedIn",
    location: "Etats-Unis",
    guarantee: "Clauses contractuelles types (SCC)",
  },
  {
    name: "X (anciennement Twitter)",
    role: "Publication de contenu sur X",
    location: "Etats-Unis",
    guarantee: "Clauses contractuelles types (SCC)",
  },
  {
    name: "TikTok",
    role: "Publication de contenu sur TikTok",
    location: "Etats-Unis / Singapour",
    guarantee: "Clauses contractuelles types (SCC)",
  },
]

export default function PrivacyPage() {
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
            Politique de{" "}
            <span className="text-gradient">confidentialite</span>
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

            {/* Introduction */}
            <div>
              <p className="text-muted-foreground leading-relaxed">
                La presente politique de confidentialite decrit comment{" "}
                <strong className="text-foreground">{APP_CONFIG.company.name}</strong> collecte,
                utilise et protege vos donnees personnelles dans le cadre de l'utilisation
                du service <strong className="text-foreground">{APP_CONFIG.name}</strong>.
                Elle est etablie conformement au Reglement General sur la Protection des
                Donnees (RGPD - Reglement UE 2016/679) et a la loi Informatique et Libertes.
              </p>
            </div>

            {/* Responsable du traitement */}
            <div>
              <h2 className="text-2xl font-bold">1. Responsable du traitement</h2>
              <div className="mt-4 space-y-1.5 text-muted-foreground leading-relaxed">
                <p>Le responsable du traitement des donnees personnelles est :</p>
                <ul className="mt-3 space-y-1.5 list-none">
                  <li><strong className="text-foreground">Nom :</strong> Valentin Guyon</li>
                  <li><strong className="text-foreground">Entreprise :</strong> {APP_CONFIG.company.name} ({APP_CONFIG.company.status})</li>
                  <li>
                    <strong className="text-foreground">Email :</strong>{" "}
                    <a href={`mailto:${APP_CONFIG.company.email}`} className="text-violet-600 hover:underline dark:text-violet-400">
                      {APP_CONFIG.company.email}
                    </a>
                  </li>
                  <li>
                    <strong className="text-foreground">Site web :</strong>{" "}
                    <a href={APP_CONFIG.company.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline dark:text-violet-400">
                      {APP_CONFIG.company.website}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Donnees collectees */}
            <div>
              <h2 className="text-2xl font-bold">2. Donnees collectees</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Dans le cadre de l'utilisation du service {APP_CONFIG.name}, nous collectons
                les categories de donnees suivantes :
              </p>

              <h3 className="mt-6 text-lg font-semibold">2.1 Donnees d'identification</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Adresse email</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Nom et prenom (si fournis via OAuth ou le profil)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Photo de profil (si fournie via OAuth)</span>
                </li>
              </ul>

              <h3 className="mt-6 text-lg font-semibold">2.2 Donnees d'authentification aux plateformes</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>
                    Tokens OAuth des plateformes connectees (Facebook, Instagram, LinkedIn, X, TikTok),{" "}
                    <strong className="text-foreground">chiffres en AES-256-GCM</strong> en base de donnees
                  </span>
                </li>
              </ul>

              <h3 className="mt-6 text-lg font-semibold">2.3 Donnees de contenu</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Contenu des publications (texte, images, videos) crees via le service</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Historique des publications et de leur statut</span>
                </li>
              </ul>

              <h3 className="mt-6 text-lg font-semibold">2.4 Donnees de facturation</h3>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>
                    Informations de paiement traitees exclusivement par Stripe
                    (nous ne stockons pas vos numeros de carte bancaire)
                  </span>
                </li>
              </ul>
            </div>

            {/* Finalites */}
            <div>
              <h2 className="text-2xl font-bold">3. Finalites du traitement</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Vos donnees personnelles sont collectees et traitees pour les finalites suivantes :
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Fourniture du service :</strong> creation de compte, publication de contenu, adaptation IA, connexion aux plateformes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Facturation :</strong> gestion des abonnements et des paiements</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Communication :</strong> envoi d'emails transactionnels (confirmation, notifications, factures)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Amelioration du service :</strong> analyse d'usage anonymisee pour ameliorer les fonctionnalites</span>
                </li>
              </ul>
            </div>

            {/* Bases legales */}
            <div>
              <h2 className="text-2xl font-bold">4. Bases legales du traitement</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Les traitements de donnees sont fondes sur les bases legales suivantes :
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Execution du contrat :</strong> les donnees necessaires a la fourniture du service (compte, publications, connexions aux plateformes)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Consentement :</strong> pour les communications non essentielles et la connexion aux plateformes tierces</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Interet legitime :</strong> amelioration du service, securite et prevention des abus</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Obligation legale :</strong> conservation des donnees de facturation conformement a la legislation fiscale</span>
                </li>
              </ul>
            </div>

            {/* Sous-traitants */}
            <div>
              <h2 className="text-2xl font-bold">5. Sous-traitants et destinataires des donnees</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pour assurer le fonctionnement du service, vos donnees peuvent etre
                transmises aux sous-traitants suivants :
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-left font-semibold">Sous-traitant</th>
                      <th className="py-3 px-4 text-left font-semibold">Role</th>
                      <th className="py-3 px-4 text-left font-semibold">Localisation</th>
                      <th className="py-3 pl-4 text-left font-semibold">Garantie</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {subProcessors.map((processor) => (
                      <tr key={processor.name} className="border-b">
                        <td className="py-3 pr-4 font-medium text-foreground">{processor.name}</td>
                        <td className="py-3 px-4">{processor.role}</td>
                        <td className="py-3 px-4">{processor.location}</td>
                        <td className="py-3 pl-4">{processor.guarantee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transferts hors UE */}
            <div>
              <h2 className="text-2xl font-bold">6. Transferts de donnees hors Union europeenne</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Certains de nos sous-traitants sont situes en dehors de l'Union europeenne,
                principalement aux Etats-Unis. Pour ces transferts, nous nous assurons que
                des garanties appropriees sont en place :
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Clauses contractuelles types (SCC) :</strong> adoptees par la Commission europeenne, integrees dans nos contrats avec les sous-traitants concernes (Stripe, Anthropic, Resend, Meta, LinkedIn, X, TikTok)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">EU Data Processing Framework :</strong> lorsque le sous-traitant est certifie sous le cadre de protection des donnees UE-US</span>
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Supabase heberge les donnees dans la region EU, ce qui garantit que les
                donnees principales (base de donnees, authentification, fichiers) restent
                au sein de l'Union europeenne.
              </p>
            </div>

            {/* Duree de conservation */}
            <div>
              <h2 className="text-2xl font-bold">7. Duree de conservation des donnees</h2>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Donnees du compte :</strong> conservees tant que le compte est actif</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Apres suppression du compte :</strong> toutes les donnees personnelles sont supprimees dans un delai de 30 jours</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Donnees de facturation :</strong> conservees pendant la duree legale requise (10 ans conformement au Code de commerce)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Tokens OAuth :</strong> supprimes immediatement lors de la deconnexion d'une plateforme ou de la suppression du compte</span>
                </li>
              </ul>
            </div>

            {/* Droits des utilisateurs */}
            <div>
              <h2 className="text-2xl font-bold">8. Vos droits</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Conformement au RGPD, vous disposez des droits suivants sur vos donnees personnelles :
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Droit d'acces :</strong> obtenir une copie de vos donnees personnelles</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Droit de rectification :</strong> corriger des donnees inexactes ou incompletes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Droit a l'effacement :</strong> demander la suppression de vos donnees</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Droit a la portabilite :</strong> recevoir vos donnees dans un format structure et lisible par machine</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Droit d'opposition :</strong> vous opposer au traitement de vos donnees pour des motifs legitimes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Droit a la limitation :</strong> demander la limitation du traitement de vos donnees</span>
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pour exercer l'un de ces droits, contactez-nous par email a{" "}
                <a href={`mailto:${APP_CONFIG.company.email}`} className="text-violet-600 hover:underline dark:text-violet-400">
                  {APP_CONFIG.company.email}
                </a>.
                Nous nous engageons a repondre a votre demande dans un delai de 30 jours.
              </p>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Vous disposez egalement du droit d'introduire une reclamation aupres de la
                Commission Nationale de l'Informatique et des Libertes (CNIL) :{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 hover:underline dark:text-violet-400"
                >
                  www.cnil.fr
                </a>.
              </p>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-2xl font-bold">9. Cookies</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Le site {APP_CONFIG.name} utilise uniquement des <strong className="text-foreground">cookies
                strictement necessaires</strong> au fonctionnement du service :
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Cookie de session :</strong> maintenir votre connexion au service</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span><strong className="text-foreground">Preferences de theme :</strong> memoriser votre choix de theme clair ou sombre</span>
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Aucun cookie de tracking, de publicite ou d'analyse comportementale n'est
                utilise. Etant donnes leur caractere strictement technique et necessaire,
                ces cookies ne necessitent pas de consentement prealable conformement a
                la directive ePrivacy.
              </p>
            </div>

            {/* Securite */}
            <div>
              <h2 className="text-2xl font-bold">10. Securite des donnees</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees
                pour proteger vos donnees personnelles :
              </p>
              <ul className="mt-4 space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Chiffrement des tokens OAuth en AES-256-GCM</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Communications chiffrees en HTTPS (TLS)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Authentification securisee via Supabase (hachage bcrypt des mots de passe)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Protection CSRF et validation des entrees</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                  <span>Acces aux donnees limite au strict necessaire (principe du moindre privilege)</span>
                </li>
              </ul>
            </div>

            {/* Modification de la politique */}
            <div>
              <h2 className="text-2xl font-bold">11. Modification de la politique</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Nous nous reservons le droit de modifier la presente politique de confidentialite
                a tout moment. En cas de modification substantielle, les utilisateurs seront
                informes par email au moins 30 jours avant l'entree en vigueur des modifications.
                La date de derniere mise a jour est indiquee en haut de cette page.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold">12. Contact</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pour toute question relative a la protection de vos donnees personnelles
                ou pour exercer vos droits, vous pouvez nous contacter :
              </p>
              <ul className="mt-4 space-y-1.5 text-muted-foreground list-none">
                <li>
                  <strong className="text-foreground">Email :</strong>{" "}
                  <a href={`mailto:${APP_CONFIG.company.email}`} className="text-violet-600 hover:underline dark:text-violet-400">
                    {APP_CONFIG.company.email}
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">Responsable :</strong> Valentin Guyon, {APP_CONFIG.company.name}
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
