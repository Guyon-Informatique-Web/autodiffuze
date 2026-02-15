// Page d'ajout d'un nouveau client
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AddClientForm } from "./AddClientForm"

export const metadata = {
  title: "Ajouter un client",
}

export default function AddClientPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* En-tete */}
      <div>
        <h1 className="text-2xl font-bold">Ajouter un client</h1>
        <p className="text-muted-foreground">
          Renseignez les informations de votre nouveau client
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>
            Ces informations seront utilisees pour personnaliser les publications
            et adapter le contenu a la marque.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddClientForm />
        </CardContent>
      </Card>
    </div>
  )
}
