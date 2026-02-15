"use client"

// Formulaire reutilisable pour la creation et l'edition d'un client
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import {
  INDUSTRIES,
  TONES,
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validations/client"

interface ClientFormProps {
  initialData?: Partial<CreateClientInput>
  onSubmit: (data: CreateClientInput) => Promise<void>
  isLoading: boolean
}

export function ClientForm({ initialData, onSubmit, isLoading }: ClientFormProps) {
  const [name, setName] = useState(initialData?.name ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [website, setWebsite] = useState(initialData?.website ?? "")
  const [industry, setIndustry] = useState(initialData?.industry ?? "")
  const [tone, setTone] = useState(initialData?.tone ?? "")
  const [targetAudience, setTargetAudience] = useState(
    initialData?.targetAudience ?? ""
  )
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const formData: CreateClientInput = {
      name,
      description,
      website,
      industry,
      tone,
      targetAudience,
    }

    const validation = createClientSchema.safeParse(formData)

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors
      const mapped: Record<string, string[]> = {}
      for (const [key, value] of Object.entries(fieldErrors)) {
        if (value) {
          mapped[key] = value
        }
      }
      setErrors(mapped)
      return
    }

    await onSubmit(validation.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom du client */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du client <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex : Ma Boutique"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        {errors.name && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.name[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Decrivez brievement l'activite de votre client..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
        {errors.description && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.description[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Site web */}
      <div className="space-y-2">
        <Label htmlFor="website">Site web</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://www.exemple.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={isLoading}
        />
        {errors.website && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.website[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Secteur et Ton sur la meme ligne */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Secteur d'activite */}
        <div className="space-y-2">
          <Label htmlFor="industry">Secteur d&apos;activite</Label>
          <Select
            value={industry}
            onValueChange={setIndustry}
            disabled={isLoading}
          >
            <SelectTrigger id="industry">
              <SelectValue placeholder="Selectionner un secteur" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ton de communication */}
        <div className="space-y-2">
          <Label htmlFor="tone">Ton de communication</Label>
          <Select value={tone} onValueChange={setTone} disabled={isLoading}>
            <SelectTrigger id="tone">
              <SelectValue placeholder="Selectionner un ton" />
            </SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audience cible */}
      <div className="space-y-2">
        <Label htmlFor="targetAudience">Audience cible</Label>
        <Textarea
          id="targetAudience"
          placeholder="Ex : Femmes 25-45 ans, passionnees de mode durable..."
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          disabled={isLoading}
          rows={2}
        />
        {errors.targetAudience && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">
              {errors.targetAudience[0]}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Bouton de soumission */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-violet-600 to-blue-500 hover:from-violet-700 hover:to-blue-600">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Enregistrer les modifications" : "Creer le client"}
        </Button>
      </div>
    </form>
  )
}
