import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './app/router';
import { setupChartDefaults } from './shared/charts/setup';
import { useAnalysisStore } from './features/analysis';
import './assets/styles/main.css';

setupChartDefaults();

const pinia = createPinia();
const analysisStore = useAnalysisStore(pinia);

void analysisStore.restoreSavedData().catch(() => undefined).finally(() => {
  createApp(App).use(pinia).use(router).mount('#app');
});
