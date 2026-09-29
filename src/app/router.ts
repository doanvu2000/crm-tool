import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'sku-analysis', component: () => import('@/pages/SkuAnalysisPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  // Link có hash (#actions...) mở thẳng tới section; top bù chiều cao header sticky.
  scrollBehavior: (to, _from, saved) => saved ?? (to.hash ? { el: to.hash, top: 88 } : { top: 0 })
});
