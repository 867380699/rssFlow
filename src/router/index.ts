import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Home from "../views/Home.vue"
import All from "../views/All.vue"
import Unread from "../views/Unread.vue"
import Favorite from "../views/Favorite.vue"
import DetailVue from '../views/Detail.vue';


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
      }
    ]
  },
  {
    path: '/detail/:id',
    component: DetailVue,
    props: true
  }
]

// https://vitejs.dev/guide/env-and-mode.html
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router