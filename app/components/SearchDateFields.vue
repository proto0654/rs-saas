<script setup>
const model = defineModel({ required: true })
defineProps({ invalidField: { type: String, default: '' } })
</script>

<template>
  <div class="form-grid search-date-fields">
    <label>Заезд<input v-model="model.checkIn" name="checkIn" type="date" :aria-invalid="invalidField === 'checkIn'" :aria-describedby="invalidField === 'checkIn' ? 'search-error' : undefined"></label>
    <label>Выезд<input v-model="model.checkOut" name="checkOut" type="date" :aria-invalid="invalidField === 'checkOut'" :aria-describedby="invalidField === 'checkOut' ? 'search-error' : undefined"></label>
    <label>Гостей<input v-model.number="model.guests" name="guests" type="number" min="1" max="20" :aria-invalid="invalidField === 'guests'" :aria-describedby="invalidField === 'guests' ? 'search-error' : undefined"></label>
  </div>
  <p v-if="model.rentalMode === 'long_term'" class="muted">Минимум 30 ночей. Цена за месяц из 30 дней.</p>
</template>
