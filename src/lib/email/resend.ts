// Client Resend pour l'envoi d'emails transactionnels -- initialisation lazy
import { Resend } from "resend"

let instance: Resend | undefined

function getResendClient(): Resend {
  if (!instance) {
    instance = new Resend(process.env.RESEND_API_KEY)
  }
  return instance
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getResendClient(), prop)
  },
})
