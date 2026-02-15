// Client Anthropic pour les appels IA -- initialisation lazy
import Anthropic from "@anthropic-ai/sdk"

let instance: Anthropic | undefined

function getAnthropicClient(): Anthropic {
  if (!instance) {
    instance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return instance
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getAnthropicClient(), prop)
  },
})
