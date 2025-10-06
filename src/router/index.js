import { createRouter, createWebHistory } from 'vue-router';
import StartMenu from '../components/StartMenu.vue';
import GlobeVisualization from '../components/GlobeVisualization.vue';

const routes = [
  {
    path: '/',
    name: 'StartMenu',
    component: StartMenu
  },
  {
    path: '/globe',
    name: 'GlobeVisualization',
    component: GlobeVisualization,
    props: route => ({ dataset: route.query.dataset ? JSON.parse(route.query.dataset) : null })
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
