import { createApp } from 'vue';
import { setupChartDefaults } from '@/shared/charts/setup';
import PilotApp from '@/features/sku-pilot/PilotApp.vue';
import '@/assets/styles/main.css';

setupChartDefaults();
createApp(PilotApp).mount('#app');
