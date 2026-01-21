<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'
import { useAppStore } from '../stores/app'
import { useRouter } from 'vue-router'
import { ClockIcon, PhotoIcon, PencilIcon, TrashIcon, ShareIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'

const recipes = ref([])
const store = useAppStore()
const router = useRouter()
const loading = ref(true)

const fetchRecipes = async () => {
  const { data, error } = await supabase
      .from('recipes')
      .select('id, title, description, duration, image_url')
      .order('created_at', { ascending: false })

  if (!error) recipes.value = data
  loading.value = false
}

const deleteRecipe = async (id, event) => {
  event.stopPropagation() // Aby se neotevřel detail receptu při kliknutí na koš
  if (!confirm('Opravdu smazat recept?')) return
  await supabase.from('recipes').delete().eq('id', id)
  fetchRecipes() // Obnovit seznam
}

const shareRecipe = (id, event) => {
  event.stopPropagation()
  const url = `${window.location.origin}/recept/${id}`
  navigator.clipboard.writeText(url)
  alert('Odkaz zkopírován!')
}

const editRecipe = (id, event) => {
  event.stopPropagation()
  router.push(`/upravit/${id}`)
}

const filteredRecipes = computed(() => {
  if (!store.searchQuery) return recipes.value
  const query = store.searchQuery.toLowerCase()
  return recipes.value.filter(r => r.title.toLowerCase().includes(query))
})

onMounted(fetchRecipes)
</script>

<template>
  <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p>Načítám dobroty...</p>
  </div>

  <div v-else>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <div
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          @click="router.push(`/recept/${recipe.id}`)"
          class="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
      >
        <div class="aspect-square relative overflow-hidden bg-slate-100">
          <img
              v-if="recipe.image_url"
              :src="recipe.image_url"
              class="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-in-out"
              loading="lazy"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
            <PhotoIcon class="w-12 h-12 mb-2" />
            <span class="text-sm font-medium">Bez fotky</span>
          </div>

          <div v-if="store.isLoggedIn" class="hidden md:flex absolute top-0 left-0 right-0 p-3 justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-b from-black/50 to-transparent">
            <button @click="(e) => shareRecipe(recipe.id, e)" class="p-2 bg-white/90 rounded-full text-slate-700 hover:text-blue-600 hover:bg-white cursor-pointer shadow-sm" title="Sdílet">
              <ShareIcon class="w-4 h-4" />
            </button>
            <button @click="(e) => editRecipe(recipe.id, e)" class="p-2 bg-white/90 rounded-full text-slate-700 hover:text-yellow-600 hover:bg-white cursor-pointer shadow-sm" title="Upravit">
              <PencilIcon class="w-4 h-4" />
            </button>
            <button @click="(e) => deleteRecipe(recipe.id, e)" class="p-2 bg-white/90 rounded-full text-slate-700 hover:text-red-600 hover:bg-white cursor-pointer shadow-sm" title="Smazat">
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>

          <div class="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
            <ClockIcon class="w-3.5 h-3.5" />
            {{ recipe.duration }} min
          </div>
        </div>

        <div class="p-6 flex flex-col flex-1">
          <h3 class="font-bold text-xl mb-2 text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
            {{ recipe.title }}
          </h3>
          <p class="text-slate-500 text-sm line-clamp-2 flex-1">
            {{ recipe.description || '' }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="filteredRecipes.length === 0" class="text-center py-20">
      <p class="text-xl text-slate-400 font-medium">Žádný recept se nenašel 😔</p>
      <button @click="store.searchQuery = ''" class="mt-4 text-blue-600 font-medium hover:underline cursor-pointer">Zobrazit vše</button>
    </div>
  </div>
</template>