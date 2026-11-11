<script setup>
defineProps({
  lines: { type: Array, required: true },
});
</script>

<template>
  <div class="debug">
    <div v-for="(line, i) in lines" :key="i">{{ line }}</div>
  </div>
</template>
