import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import All from '../views/All.vue';
import DetailVue from '../views/Detail.vue';
import Favorite from '../views/Favorite.vue';
import Home from '../views/Home.vue';
import Unread from '../views/Unread.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: Home,
    children: [
      {
        path: '/unread',
        component: Unread,
      },
      {
        path: '/all',
        component: All,
      },
      {
        path: '/favorite',
        component: Favorite,
      },
      {
        path: '',
        redirect: '/unread',
      },
    ],
  },
  {
    path: '/detail/:id',
    component: DetailVue,
    props(route) {
      const { id } = route.params;
      return { id: Number(id) };
    },
  },
];

// https://vitejs.dev/guide/env-and-mode.html
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
