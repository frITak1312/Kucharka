<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'
import { useAppStore } from '../stores/app'
import { PencilIcon, TrashIcon, ShareIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const recipe = ref(null)

const fetchRecipe = async () => {
  const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', route.params.id)
      .single()

  if (data) recipe.value = data
}

const deleteRecipe = async () => {
  if (!confirm('Opravdu smazat tento recept?')) return
  await supabase.from('recipes').delete().eq('id', recipe.value.id)
  router.push('/')
}

const copyLink = () => {
  navigator.clipboard.writeText(window.location.href)
  alert('Odkaz zkopírován!')
}

onMounted(fetchRecipe)
</script>

<template>
  <div v-if="recipe" class="max-w-4xl mx-auto bg-white sm:rounded-2xl sm:shadow-lg sm:p-8 p-4 print:shadow-none print:p-0">

    <div class="flex justify-between items-center mb-6 print:hidden">
      <button @click="router.push('/')" class="text-gray-500 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeftIcon class="w-4 h-4" /> Zpět
      </button>

      <div class="flex gap-2">
        <button @click="copyLink" class="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Sdílet">
          <ShareIcon class="w-5 h-5" />
        </button>

        <template v-if="store.isLoggedIn">
          <button @click="router.push(`/upravit/${recipe.id}`)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Upravit">
            <PencilIcon class="w-5 h-5" />
          </button>
          <button @click="deleteRecipe" class="p-2 text-red-500 hover:bg-red-50 rounded-full" title="Smazat">
            <TrashIcon class="w-5 h-5" />
          </button>
        </template>
      </div>
    </div>

    <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ recipe.title }}</h1>
    <div class="text-gray-600 mb-6 flex items-center gap-4">
      <span>⏱ {{ recipe.duration }} minut</span>
    </div>

    <div class="grid md:grid-cols-2 gap-8 mb-8">
      <div>
        <h2 class="text-xl font-bold text-blue-600 mb-4 border-b pb-2">Suroviny</h2>
        <ul class="space-y-2 text-gray-800">
          <li v-for="(ing, i) in recipe.ingredients" :key="i" class="flex gap-2 items-baseline">
            <span class="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0 self-center"></span>
            <span class="font-semibold" v-if="ing.amount">{{ ing.amount }}</span>
            <span class="text-sm text-gray-500" v-if="ing.unit && ing.unit !== '-'">{{ ing.unit }}</span>
            <span>{{ ing.name }}</span>
          </li>
        </ul>
      </div>

      <div class="order-first md:order-last">
        <div class="aspect-square rounded-xl overflow-hidden shadow-sm print:shadow-none print:rounded-none">
          <img :src="recipe.image_url" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>

    <div>
      <h2 class="text-xl font-bold text-blue-600 mb-4 border-b pb-2">Postup</h2>
      <ol class="space-y-4 text-gray-800">
        <li v-for="(step, i) in recipe.steps" :key="i" class="flex gap-4">
          <span class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold shrink-0 text-sm">
            {{ i + 1 }}
          </span>
          <p class="leading-relaxed mt-1">{{ step }}</p>
        </li>
      </ol>
    </div>

  </div>
</template>