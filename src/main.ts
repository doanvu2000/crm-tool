import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './app/router';
import { setupChartDefaults } from './shared/charts/setup';
import './assets/styles/main.css';

setupChartDefaults();

createApp(App).use(createPinia()).use(router).mount('#app');
