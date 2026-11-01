<script setup lang="ts">
import NotesList from '../components/NotesList.vue'
import NoteEditorDrawer from '../components/NoteEditorDrawer.vue'
</script>

<template>
  <div class="notes-page">
    <NotesList />
    <NoteEditorDrawer />
  </div>
</template>

<style scoped>
.notes-page {
  width: 100%;
}
</style>
