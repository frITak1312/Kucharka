import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecipeDetail from '../views/RecipeDetail.vue'
import RecipeEditor from '../views/RecipeEditor.vue'
import { useAppStore } from '../stores/app'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', component: HomeView },
        { path: '/recept/:id', component: RecipeDetail },
        {
            path: '/pridat',
            component: RecipeEditor,
            beforeEnter: (to, from, next) => {
                const store = useAppStore()
                store.checkSession()
                if (store.isLoggedIn) next()
                else next('/')
            }
        },
        {
            path: '/upravit/:id',
            component: RecipeEditor,
            beforeEnter: (to, from, next) => {
                const store = useAppStore()
                store.checkSession()
                if (store.isLoggedIn) next()
                else next('/')
            }
        }
    ]
})

export default router