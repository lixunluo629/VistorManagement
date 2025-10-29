import { MainPage } from './pages/MainPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DataCenterPage } from './pages/DataCenterPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;
const zhCn = ElementPlusLocaleZhCn;

// 路由配置
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', component: MainPage },
        { path: '/register', component: RegisterPage },
        { path: '/data-center', component: DataCenterPage },
        { path: '/settings', component: SettingsPage }
    ]
});

// 创建应用
const app = createApp({
    template: `<router-view />`
});

// 全局注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.use(router);
app.use(ElementPlus, {
    locale: zhCn
});
app.mount('#app');