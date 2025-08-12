import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/animation',
      name: 'animation',
      component: () => import('../views/Animation.vue'),
    },
    {
      path: '/teleport',
      name: 'teleport',
      component: () => import('../views/Teleport.vue'),
    },
    {
      path: '/teleport2',
      name: 'teleport2',
      component: () => import('../views/Teleport2.vue'),
    },
  ],
})

export default router
