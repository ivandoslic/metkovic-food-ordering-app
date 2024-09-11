import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
  type NavigationGuardNext
} from 'vue-router';
import { useUserStore } from './store';

import HomePage from './views/HomePage.vue';
import LoginPage from './views/LoginPage.vue';
import AdminPage from './views/AdminPage.vue';

const requireAuth = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const userStore = useUserStore();

  if (!userStore.userData) {
    next({ name: 'Login' });
  } else next();
};

const requireAdmin = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const userStore = useUserStore();

  if (!userStore.userData) {
    next({ name: 'Login' });
  } else if (userStore.userData.username !== import.meta.env.VITE_ADMIN_USERNAME) {
    next({ name: 'Home' });
  } else {
    next();
  }
};

const router = createRouter({
  routes: [
    { path: '/', component: HomePage, name: 'Home', beforeEnter: requireAuth },
    { path: '/login', component: LoginPage, name: 'Login' },
    { path: '/admin', component: AdminPage, name: 'Admin', beforeEnter: requireAdmin }
  ],
  history: createWebHistory()
});

export default router;
