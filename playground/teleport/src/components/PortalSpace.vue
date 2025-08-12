<script lang="ts">
import { ref, reactive, h, provide, Teleport, nextTick } from 'vue';
import { PortalContextKey } from '@/types';

const buildStyle = (el: HTMLElement) => {
  const style = getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  return {
    position: 'absolute',
    display: 'block',
    overflow: 'hidden',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: style.borderRadius,
  }
}

export default {
  name: 'PortalSpace',
  setup(props, context) {
    const tunnelMap = reactive<Record<string, any>>({})
    const leapRefMap: Record<string, HTMLElement> = {}

    provide(PortalContextKey, {
      register(id: string, portal: any) {
        let tunnel = tunnelMap[id]
        if (!tunnel) {
          tunnel = {
            leaping: false,
            portals: [],
            animate: null,
          }
          tunnelMap[id] = tunnel
        }

        tunnel.portals.push(portal)

        nextTick(() => { // wait for leapingEl render
          if (tunnel.portals.length > 1) {
            const prevPortal = tunnel.portals[tunnel.portals.length - 2]
            const leapingEl = leapRefMap[id]
            Object.assign(leapingEl.style, buildStyle(tunnel.leaping ? leapingEl : prevPortal.el))
            tunnel.leaping = true
            const animate = leapingEl.animate({
              ...buildStyle(portal.el),
            }, {
              duration: 300,
              easing: 'ease-in-out'
            })
            animate.onfinish = () => {
              tunnel.leaping = false
            }

            if (tunnel.animate) {
              tunnel.animate.cancel()
            }
            tunnel.animate = animate
          } else {
            portal.el.animate(
              {
                opacity: [0, 1]
              },
              {
                easing: 'ease-in-out',
                duration: 300
              }
            )
          }
        })

        return tunnel.portals.length
      },
      unregister(id: string) {
        const tunnel = tunnelMap[id]
        if (tunnel) {
          if (tunnel.portals.length > 1) {
            const currentPortal = tunnel.portals[tunnel.portals.length - 1]
            const prevPortal = tunnel.portals[tunnel.portals.length - 2]
            const leapingEl = document.getElementById(`portal-${id}-${0}`)
            if (leapingEl) {
              Object.assign(leapingEl.style, buildStyle(tunnel.leaping ? leapingEl : currentPortal.el))

              tunnel.leaping = true
              const animate = leapingEl.animate({
                ...buildStyle(prevPortal.el),
              }, {
                duration: 300,
                easing: 'ease-in-out'
              })
              animate.onfinish = () => {
                if (tunnel) {
                  tunnel.leaping = false
                }
              }
              if (tunnel.animate) {
                tunnel.animate.cancel()
              }
              tunnel.animate = animate
            }
            tunnel.portals.pop()
          } else {
            delete tunnelMap[id]
          }
        }
      }
    })

    return () => h('div', {}, [
      context.slots.default?.(),
      h('div', { class: 'fixed top-0 left-0 w-full h-full pointer-events-none' }, Object.entries(tunnelMap).map(([id]) => h('div', { ref: (el) => leapRefMap[id] = (el as HTMLElement), id: `portal-${id}-${0}` }))),
      h(
        'div',
        {},
        Object.entries(tunnelMap).map(([id, tunnel]) => h(Teleport, { to: tunnel.leaping ? `#portal-${id}-${0}` : `#portal-${id}-${tunnel.portals.length}` }, tunnel.portals[tunnel.portals.length - 1]?.slots.default?.()))
      ),
    ])
  }
}
</script>
