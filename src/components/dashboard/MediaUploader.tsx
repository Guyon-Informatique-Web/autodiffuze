"use client"

// Composant d'upload de medias avec drag & drop et previsualisation
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Film, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Types MIME acceptes
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
]

const ACCEPT_STRING = ACCEPTED_TYPES.join(",")

interface MediaFile {
  url: string
  type: string
  name: string
}

interface MediaUploaderProps {
  value: Array<MediaFile>
  onChange: (files: Array<MediaFile>) => void
  maxFiles?: number
  maxSizeMB?: number
  disabled?: boolean
}

// Reponse de l'API d'upload
interface UploadResponse {
  url: string
  type: string
  name: string
  size: number
}

// Reponse d'erreur de l'API
interface UploadErrorResponse {
  error: string
}

// Verifie si le type MIME correspond a une image
function isImageType(type: string): boolean {
  return type.startsWith("image/")
}

export function MediaUploader({
  value,
  onChange,
  maxFiles = 1,
  maxSizeMB = 5,
  disabled = false,
}: MediaUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<
    Array<{ name: string; progress: number }>
  >([])
  const inputRef = useRef<HTMLInputElement>(null)

  const isMaxReached = value.length >= maxFiles
  const isDisabled = disabled || isMaxReached
  const remainingSlots = maxFiles - value.length

  // Upload d'un fichier vers l'API
  const uploadFile = useCallback(
    async (file: File): Promise<MediaFile | null> => {
      // Verification du type MIME cote client
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(
          `Type de fichier non supporte : ${file.type}. Formats acceptes : JPEG, PNG, GIF, WebP, MP4`
        )
        return null
      }

      // Verification de la taille cote client
      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB > maxSizeMB) {
        toast.error(
          `Fichier "${file.name}" trop volumineux (${fileSizeMB.toFixed(1)} Mo). Maximum : ${maxSizeMB} Mo`
        )
        return null
      }

      // Ajout du fichier a la liste des uploads en cours
      const uploadEntry = { name: file.name, progress: 0 }
      setUploadingFiles((prev) => [...prev, uploadEntry])

      try {
        const formData = new FormData()
        formData.append("file", file)

        // Simulation de la progression (pas de support natif avec fetch)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            )
          )
        }, 200)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          const errorData: UploadErrorResponse = await response.json()
          toast.error(errorData.error || "Erreur lors de l'upload")
          return null
        }

        // Progression a 100% avant de retirer le fichier de la liste
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, progress: 100 } : f
          )
        )

        const data: UploadResponse = await response.json()
        return {
          url: data.url,
          type: data.type,
          name: data.name,
        }
      } catch {
        toast.error(`Erreur lors de l'upload de "${file.name}"`)
        return null
      } finally {
        // Retirer le fichier de la liste des uploads apres un court delai
        setTimeout(() => {
          setUploadingFiles((prev) =>
            prev.filter((f) => f.name !== file.name)
          )
        }, 500)
      }
    },
    [maxSizeMB]
  )

  // Traitement des fichiers selectionnes ou deposes
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)

      // Verifier le nombre de fichiers restants
      if (fileArray.length > remainingSlots) {
        toast.error(
          `Vous ne pouvez ajouter que ${remainingSlots} fichier(s) supplementaire(s). Maximum : ${maxFiles}`
        )
        return
      }

      // Upload de chaque fichier sequentiellement
      const newFiles: Array<MediaFile> = []
      for (const file of fileArray) {
        const result = await uploadFile(file)
        if (result) {
          newFiles.push(result)
        }
      }

      if (newFiles.length > 0) {
        onChange([...value, ...newFiles])
      }
    },
    [value, onChange, remainingSlots, maxFiles, uploadFile]
  )

  // Retirer un fichier de la liste
  const handleRemove = useCallback(
    (index: number) => {
      const updated = value.filter((_, i) => i !== index)
      onChange(updated)
    },
    [value, onChange]
  )

  // Gestion du clic sur la zone de drop
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      inputRef.current?.click()
    }
  }, [isDisabled])

  // Gestion du changement de l'input file
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void handleFiles(e.target.files)
        // Reinitialiser l'input pour permettre de re-selectionner le meme fichier
        e.target.value = ""
      }
    },
    [handleFiles]
  )

  // Gestion du drag & drop
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDisabled) {
        setIsDragOver(true)
      }
    },
    [isDisabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (isDisabled) return

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        void handleFiles(e.dataTransfer.files)
      }
    },
    [isDisabled, handleFiles]
  )

  const isUploading = uploadingFiles.length > 0

  return (
    <div className="space-y-4">
      {/* Zone de drag & drop */}
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragOver && "border-primary bg-primary/5",
          isDisabled
            ? "cursor-not-allowed opacity-50 border-muted"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Glissez vos fichiers ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-muted-foreground">
            Images (JPEG, PNG, GIF, WebP) et videos (MP4) - Max {maxSizeMB} Mo
            par fichier
          </p>
        </div>

        {/* Input file cache */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={isDisabled}
        />
      </div>

      {/* Compteur de fichiers */}
      <p className="text-xs text-muted-foreground">
        {value.length} / {maxFiles} fichier(s)
      </p>

      {/* Barres de progression des uploads en cours */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div key={file.name} className="space-y-1">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">
                  {file.name}
                </span>
              </div>
              <Progress value={file.progress} />
            </div>
          ))}
        </div>
      )}

      {/* Previsualisation des fichiers uploades */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((file, index) => (
            <div
              key={file.url}
              className="group relative overflow-hidden rounded-lg border bg-muted/30"
            >
              {isImageType(file.type) ? (
                // Miniature pour les images
                <div className="aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                // Icone et nom pour les videos
                <div className="flex aspect-square flex-col items-center justify-center gap-2 p-3">
                  <Film className="h-8 w-8 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center truncate w-full">
                    {file.name}
                  </span>
                </div>
              )}

              {/* Bouton de suppression */}
              {!disabled && !isUploading && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
