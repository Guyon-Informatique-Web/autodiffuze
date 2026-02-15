// Page parametres du compte
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "@/components/settings/ProfileForm"
import { PasswordForm } from "@/components/settings/PasswordForm"
import { NotificationsForm } from "@/components/settings/NotificationsForm"
import { DeleteAccountSection } from "@/components/settings/DeleteAccountSection"

export const metadata = {
  title: "Parametres",
}

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div>
        <h1 className="text-2xl font-bold">Parametres</h1>
        <p className="text-muted-foreground">
          Gerez votre compte et vos preferences
        </p>
      </div>

      {/* Profil */}
      <ProfileForm
        initialName={user.name || ""}
        email={user.email}
      />

      <Separator />

      {/* Mot de passe */}
      <PasswordForm />

      <Separator />

      {/* Notifications */}
      <NotificationsForm
        initialNotifyEmail={user.notifyEmail}
        initialNotifyDiscord={user.notifyDiscord}
        initialDiscordWebhookUrl={user.discordWebhookUrl}
      />

      <Separator />

      {/* Zone de danger */}
      <DeleteAccountSection />
    </div>
  )
}
