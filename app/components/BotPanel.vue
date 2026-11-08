<script setup>
defineProps({ bot: { type: Object, default: null } })
defineEmits(['create', 'toggle'])
</script>
<template>
  <div class="panel bot-panel"><div class="eyebrow">ДЛЯ ВАШИХ ГОСТЕЙ</div><h2>Персональный бот</h2><p class="muted">Концепт прямых заявок без участия в общей выдаче. Сейчас это визуальная симуляция, к Telegram она не подключается.</p><div v-if="bot" class="bot-status"><div class="line"><span>Статус симуляции</span><b>{{ bot.active ? 'Включён' : 'Остановлен' }}</b></div><div class="line"><span>Демо-токен</span><code>{{ bot.token }}</code></div><p class="muted">Это вымышленный токен; подключение к Telegram не выполняется.</p><div class="actions"><button class="btn outline" @click="$emit('toggle')">{{ bot.active ? 'Остановить' : 'Включить' }}</button><button class="btn outline" @click="$emit('create')">Перевыпустить демо-токен</button></div></div><button v-else class="btn primary" @click="$emit('create')">Создать демо-бота</button></div>
</template>
