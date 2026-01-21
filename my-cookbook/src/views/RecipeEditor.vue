<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../supabase'
import { v4 as uuidv4 } from 'uuid'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { TrashIcon, PlusIcon, PhotoIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const isEditMode = route.params.id ? true : false
const cropperRef = ref(null)

// Výchozí stav se 3 prázdnými řádky
const form = ref({
  title: '',
  description: '',
  duration: 30,
  ingredients: [
    { amount: '', unit: 'g', name: '' },
    { amount: '', unit: 'g', name: '' },
    { amount: '', unit: 'g', name: '' }
  ],
  steps: ['', '', ''],
  image_url: null
})

// Logika pro obrázek
const imageSrc = ref(null)
const showCropper = ref(false)
const croppedBlob = ref(null) // Tady držíme data pro upload
const previewUrl = ref(null) // Tady držíme náhled pro uživatele

const onFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    imageSrc.value = URL.createObjectURL(file)
    showCropper.value = true
    // Reset předchozího ořezu, pokud nahrávám nový
    croppedBlob.value = null
    previewUrl.value = null
  }
}

const performCrop = () => {
  const { canvas } = cropperRef.value.getResult()
  if (canvas) {
    canvas.toBlob((blob) => {
      croppedBlob.value = blob
      previewUrl.value = URL.createObjectURL(blob)
      showCropper.value = false
    }, 'image/jpeg', 0.8)
  }
}

const uploadImage = async () => {
  // Pokud máme nový ořez, nahrajeme ho
  if (croppedBlob.value) {
    const fileName = `${uuidv4()}.jpg`
    const { error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, croppedBlob.value)

    if (error) throw error

    const { data } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName)

    return data.publicUrl
  }
  // Pokud se nic neměnilo, vrátíme původní URL (nebo null)
  return form.value.image_url
}

// Logika řádků
const addIngredient = () => form.value.ingredients.push({ amount: '', unit: 'g', name: '' })
const removeIngredient = (index) => form.value.ingredients.splice(index, 1)

const addStep = () => form.value.steps.push('')
const removeStep = (index) => form.value.steps.splice(index, 1)

const units = ['g', 'ml', 'PL', 'ČL', 'ks', '-']

const submit = async () => {
  try {
    // 1. Filtrace prázdných řádků
    const cleanIngredients = form.value.ingredients.filter(i => i.name && i.name.trim() !== '')
    const cleanSteps = form.value.steps.filter(s => s && s.trim() !== '')

    // Validace
    if (!form.value.title) {
      alert('Vyplň prosím název receptu.')
      return
    }
    if (cleanIngredients.length === 0) {
      alert('Musíš zadat alespoň jednu surovinu.')
      return
    }

    // 2. Upload obrázku
    const finalImageUrl = await uploadImage()

    // 3. Příprava dat
    const recipeData = {
      title: form.value.title,
      description: form.value.description,
      duration: form.value.duration,
      ingredients: cleanIngredients, // Ukládáme jen čisté
      steps: cleanSteps,             // Ukládáme jen čisté
      image_url: finalImageUrl
    }

    // 4. Uložení do DB
    let error
    if (isEditMode) {
      const res = await supabase.from('recipes').update(recipeData).eq('id', route.params.id)
      error = res.error
    } else {
      const res = await supabase.from('recipes').insert([recipeData])
      error = res.error
    }

    if (error) throw error
    router.push('/')
  } catch (e) {
    console.error(e)
    alert('Chyba: ' + e.message)
  }
}

onMounted(async () => {
  if (isEditMode) {
    const { data } = await supabase.from('recipes').select('*').eq('id', route.params.id).single()
    if (data) {
      form.value = data
      // Pokud editujeme, ujistíme se, že tam jsou aspoň 3 řádky (i když jsou třeba prázdné pro editaci)
      while (form.value.ingredients.length < 3) form.value.ingredients.push({ amount: '', unit: 'g', name: '' })
      while (form.value.steps.length < 3) form.value.steps.push('')
    }
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto pb-20">
    <h1 class="text-3xl font-bold text-slate-900 mb-8">{{ isEditMode ? 'Upravit recept' : 'Nový recept' }}</h1>

    <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-8">

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Název receptu</label>
          <input v-model="form.title" class="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition" type="text" placeholder="Např. Svíčková na smetaně" />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Krátký popis</label>
          <textarea v-model="form.description" rows="2" class="w-full border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Lákavý popisek..."></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Doba přípravy (min)</label>
            <input v-model="form.duration" class="w-full border-slate-200 rounded-xl p-3" type="number" />
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Fotka jídla</label>
            <div class="flex gap-4 items-center">
              <div class="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 relative group cursor-pointer" @click="$refs.fileInput.click()">
                <img v-if="previewUrl || form.image_url" :src="previewUrl || form.image_url" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                  <PhotoIcon class="w-8 h-8" />
                </div>
                <div class="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center text-white">
                  <PencilIcon class="w-6 h-6" />
                </div>
              </div>

              <div class="flex-1">
                <input ref="fileInput" @change="onFileChange" type="file" accept="image/*" class="hidden" />
                <button @click="$refs.fileInput.click()" class="text-sm font-semibold text-blue-600 hover:text-blue-700 py-2 px-4 bg-blue-50 rounded-lg cursor-pointer">
                  Vybrat fotku
                </button>
                <p class="text-xs text-slate-400 mt-1">Automaticky nabídne ořez</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr class="border-slate-100" />

      <div>
        <label class="block text-lg font-bold text-slate-900 mb-4">Suroviny</label>
        <div class="space-y-3">
          <div v-for="(ing, i) in form.ingredients" :key="i" class="flex flex-col sm:flex-row gap-2 sm:items-center bg-slate-50 p-3 rounded-xl sm:bg-transparent sm:p-0">
            <div class="flex gap-2 w-full sm:w-auto">
              <input v-model="ing.amount" placeholder="Mn." class="w-1/2 sm:w-20 border-slate-200 rounded-lg p-2 text-center" type="number" />
              <select v-model="ing.unit" class="w-1/2 sm:w-24 border-slate-200 rounded-lg p-2 bg-white cursor-pointer">
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>

            <div class="flex gap-2 w-full items-center">
              <input v-model="ing.name" placeholder="Název suroviny (např. Mouka)" class="flex-1 border-slate-200 rounded-lg p-2" type="text" />
              <button @click="removeIngredient(i)" class="text-slate-400 hover:text-red-500 p-2 cursor-pointer" title="Odebrat řádek">
                <TrashIcon class="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
        <button @click="addIngredient" class="mt-4 text-sm font-semibold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition cursor-pointer">
          <PlusIcon class="w-4 h-4" /> Přidat další surovinu
        </button>
      </div>

      <hr class="border-slate-100" />

      <div>
        <label class="block text-lg font-bold text-slate-900 mb-4">Postup</label>
        <div class="space-y-3">
          <div v-for="(step, i) in form.steps" :key="i" class="flex gap-3 items-start">
            <span class="mt-2.5 text-slate-400 text-sm font-mono font-bold w-6 text-right select-none">{{ i + 1 }}.</span>
            <textarea v-model="form.steps[i]" rows="2" class="flex-1 border-slate-200 rounded-xl p-3 text-slate-700 leading-relaxed" placeholder="Popiš krok postupu..."></textarea>
            <button @click="removeStep(i)" class="mt-2 text-slate-400 hover:text-red-500 p-2 cursor-pointer">
              <TrashIcon class="w-5 h-5"/>
            </button>
          </div>
        </div>
        <button @click="addStep" class="mt-4 text-sm font-semibold text-blue-600 flex items-center gap-1 hover:bg-blue-50 px-3 py-2 rounded-lg transition cursor-pointer">
          <PlusIcon class="w-4 h-4" /> Přidat další krok
        </button>
      </div>

      <div class="pt-4">
        <button @click="submit" class="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition font-bold text-lg cursor-pointer">
          {{ isEditMode ? 'Uložit změny' : 'Zveřejnit recept' }}
        </button>
      </div>
    </div>

    <div v-if="showCropper" class="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="font-bold text-lg">Oříznout obrázek</h3>
          <button @click="showCropper = false" class="text-slate-400 hover:text-slate-800 cursor-pointer">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="flex-1 bg-slate-900 relative overflow-hidden">
          <Cropper
              ref="cropperRef"
              class="h-[50vh] sm:h-[400px] w-full"
              :src="imageSrc"
              :stencil-props="{ aspectRatio: 1/1 }"
          />
        </div>

        <div class="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button @click="showCropper = false" class="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer">Zrušit</button>
          <button @click="performCrop" class="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
            <CheckIcon class="w-5 h-5" />
            Oříznout a použít
          </button>
        </div>
      </div>
    </div>
  </div>
</template>