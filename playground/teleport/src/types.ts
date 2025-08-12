import type { InjectionKey } from 'vue'

export interface PortalContext {
  register: (id: string, portal: { slots: any; el: any }) => number
  unregister: (id: string) => void
}

export const PortalContextKey: InjectionKey<PortalContext> = Symbol('PortalContext')
