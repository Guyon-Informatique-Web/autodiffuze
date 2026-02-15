// Page d'ajout d'un nouveau template
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { AddTemplateForm } from "./AddTemplateForm"

export const metadata = {
  title: "Creer un template",
}

export default function AddTemplatePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* En-tete */}
      <div>
        <h1 className="text-2xl font-bold">Creer un template</h1>
        <p className="text-muted-foreground">
          Configurez votre modele de publication reutilisable
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouveau template</CardTitle>
          <CardDescription>
            Les templates permettent de preparer des modeles de contenu que vous
            pourrez reutiliser et personnaliser grace aux variables dynamiques.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddTemplateForm />
        </CardContent>
      </Card>
    </div>
  )
}
