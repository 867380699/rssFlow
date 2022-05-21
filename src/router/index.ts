import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

import DetailVue from '@/views/Detail.vue';
import Home from '@/views/Home.vue';

const routes: Array<RouteRecordRaw> = [
  {
    name: 'home',
    path: '/home/:type/:id?',
    component: Home,
  },
  {
    path: '/detail/:id',
    component: DetailVue,
    props(route) {
      const { id } = route.params;
      return { id: Number(id) };
    },
  },
  {
    path: '/:path(.*)*',
    redirect: '/home/unread/0',
  },
];

// https://vitejs.dev/guide/env-and-mode.html
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
