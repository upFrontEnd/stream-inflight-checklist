<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { formatSize } from '../../lib/image.js';

const props = defineProps({
  // Image actuelle (URL), affichée tant qu'aucun nouveau fichier n'est choisi.
  current: { type: String, default: null },
});
const file = defineModel({ type: [File, null], default: null });

const dragging = ref(false);
const input = ref(null);
const preview = ref(null);

watch(file, (f) => {
  if (preview.value) URL.revokeObjectURL(preview.value);
  preview.value = f ? URL.createObjectURL(f) : null;
});
onUnmounted(() => preview.value && URL.revokeObjectURL(preview.value));

const shown = computed(() => preview.value ?? props.current);

function pick(files) {
  const f = [...files].find((x) => x.type.startsWith('image/'));
  if (f) file.value = f;
}

function onDrop(e) {
  dragging.value = false;
  pick(e.dataTransfer.files);
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ 'is-dragging': dragging, 'has-image': shown }"
    role="button"
    tabindex="0"
    @click="input.click()"
    @keydown.enter.prevent="input.click()"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <img v-if="shown" class="dropzone__preview" :src="shown" alt="">
    <div class="dropzone__text">
      <template v-if="file">{{ file.name }} · {{ formatSize(file.size) }} (compressée à l'envoi)</template>
      <template v-else-if="current">Glisser une image pour la remplacer, ou cliquer</template>
      <template v-else>Glisser l'image de la checklist ici, ou cliquer pour parcourir</template>
    </div>
    <input ref="input" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="pick($event.target.files)">
  </div>
</template>
