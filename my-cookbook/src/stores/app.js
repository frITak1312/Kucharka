import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
    const isLoggedIn = ref(false)
    const searchQuery = ref('')

    function login(password) {
        if (password === import.meta.env.VITE_APP_PASSWORD) {
            isLoggedIn.value = true
            sessionStorage.setItem('auth', 'true')
            return true
        }
        return false
    }

    function checkSession() {
        if (sessionStorage.getItem('auth') === 'true') {
            isLoggedIn.value = true
        }
    }

    function logout() {
        isLoggedIn.value = false
        sessionStorage.removeItem('auth')
    }

    return { isLoggedIn, searchQuery, login, logout, checkSession }
})