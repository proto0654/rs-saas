<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''
let locked = false

function release() {
  if (!locked || typeof document === 'undefined') return
  document.body.style.overflow = previousOverflow
  locked = false
  if (previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
}
watch(() => props.open, async open => {
  if (typeof document === 'undefined') return
  if (!open) { release(); return }
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  locked = true
  await nextTick()
  if (props.open) panel.value?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')?.focus()
}, { immediate: true })

function handleKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); emit('close'); return }
  if (event.key !== 'Tab') return
  const elements = Array.from(panel.value?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') ?? [])
  const first = elements[0], last = elements.at(-1)
  if (!first || !last) { event.preventDefault(); panel.value?.focus(); return }
  if (!panel.value?.contains(document.activeElement)) { event.preventDefault(); first.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
onBeforeUnmount(release)
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <section ref="panel" class="sheet" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1" @keydown="handleKey">
      <div class="sheet-handle"></div>
      <div class="sheet-title"><h2 id="dialog-title">{{ title }}</h2><button class="close" aria-label="Закрыть" @click="emit('close')">×</button></div>
      <slot />
    </section>
  </div>
</template>
