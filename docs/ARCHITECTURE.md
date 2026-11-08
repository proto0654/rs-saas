# Nuxt 4 · архитектура MVP
Один Nuxt-проект: web и Telegram используют общие Vue-компоненты, composables и domain. Разница в layout и platform adapter.

## Структура
- app/pages/index.vue, locations/[slug].vue, search.vue, stays/[propertyId].vue — публичные SSR страницы.
- app/pages/host/properties/index.vue, host/properties/[id].vue, host/calendar.vue, host/bookings.vue — кабинет.
- app/pages/checkout/[unitId].vue, bookings.vue, favorites.vue, profile.vue — личные клиентские страницы.
- app/pages/tg/ — клиентские маршруты Mini App для гостя и хозяина, использующие общие компоненты.
- app/components/MestoApp.vue — композиция экранов; HostCalendar.vue, HostBookings.vue, HomeIntro.vue и другие компоненты содержат отдельные части интерфейса.
- app/layouts/default.vue, host.vue, telegram.vue; app/plugins/demo.client.js, telegram.client.js.
- app/stores/demo.js — Pinia и browser-local repository; app/composables/usePlatform.ts — платформенная навигация.
- shared/types/ и shared/domain/ — типизированная модель и правила; demo/seed.json — источник демо-данных.
- public/demo/ — ассеты; tests/unit/, tests/nuxt/ — тесты.
server/ пока не нужен; добавлять только при реальной серверной интеграции.

## Рендеринг
SSR по умолчанию. /locations/:slug — городская посадочная с выдачей; slug allowlist из `shared/locations.ts` для 27 городов Крыма, Кубани и юга России. /search читает сериализуемые фильтры query и отдаёт карточки в HTML. Карту подключать клиентским компонентом с SSR placeholder одинакового размера. Страница жилья отдаёт в HTML название, описание, фото и базовую цену, useSeoMeta и canonical path без tracking query. Не обещать поисковику актуальность localStorage-доступности.

## Протокол демо-гидратации
1. На сервере создать request-scoped repository из глубокой копии seed. Без записи и глобального mutable cache. Поиск и объект SSR используют только опубликованные данные; не сериализовать профили и брони в payload. Для публичного ответа вернуть только DTO карточек/объекта.
2. На клиенте начальная render state и payload совпадают с SSR seed. ready=false сериализуется одинаково. Начальный UI не читает localStorage.
3. После app mounted плагин demo.client.ts валидирует schemaVersion и восстанавливает namespace rs-saas-demo либо клонирует seed. Ошибку storage обработать in-memory fallback. Только затем ready=true и явное обновление фильтрованной выдачи/цен, сохранённых фильтров и личных экранов. Это штатное обновление после mount, не mismatch.
4. На приватных CSR-страницах до ready — skeleton. Все мутации через единый client repository; пересчёт публичной выдачи после мутаций. Изменения видно только в этом браузере; другой браузер и SSR видят исходный seed. Это осознанное ограничение демо, описать в README приложения.
5. reset очищает только namespace проекта. Не сохранять Pinia автоматически до окончания восстановления; не затереть сохранённые данные пустым начальным store.

## Telegram
SDK доступен только клиенту; adapter проверяет наличие Telegram.WebApp и работает без него в браузере. Safe areas и viewport — через adapter/CSS. Browser back и Telegram BackButton имеют общий navigation contract; убрать обработчики при unmount. initData не считать авторизацией: реальная проверка позже на сервере.

## Production позже
Read/write API заменяет DemoRepository. Реальная доступность и цена проверяются сервером на submit, конфликт защищён транзакцией. SSR использует публичное API, приватные данные — только после настоящей авторизации. Не кешировать персональные страницы общим SWR. SSR deployment требует Nuxt server runtime; статический generate годится только для отдельного демо с ограничениями.

## Текущее демо

Маршруты представлены отдельными страницами Nuxt в `app/pages`; layout’ы `default`, `host` и `telegram` используют общий `AppShell`. Общая логика экранов находится в `app/components/MestoApp.vue`, правила платформенных ссылок — в `app/composables/usePlatform.ts`, клиентское демо-состояние — в Pinia store. Дальнейшее разделение экранов на предметные компоненты остаётся направлением развития. Шахматка показывает календарную неделю с понедельника или календарный месяц, содержащие выбранную дату; журнал и симуляция персонального бота хранятся только в браузере. Отдельный процесс `bot/index.mjs` запускает общего бота на grammY с HTTPS-ссылкой на Mini App. Он не создаёт и не подключает персональных ботов.

Telegram-адаптер `app/utils/telegram.ts` обновляет безопасные отступы и высоту экрана через CSS-переменные, подключает BackButton в маршрутах Mini App и удаляет подписки при выходе в web или размонтировании приложения. Обработчики команд grammY вынесены в `bot/create-bot.mjs`; их тесты перехватывают API-вызовы и не отправляют сообщения в Telegram.
