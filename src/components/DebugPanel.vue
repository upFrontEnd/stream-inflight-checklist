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

<style scoped lang="scss">
.debug {
  position: fixed;
  left: 8px;
  right: 8px;
  bottom: 8px;
  padding: 8px 10px;
  font: 13px/1.4 system-ui, sans-serif;
  color: #fff;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 6px;
}
</style>
