# Вставить в Cursor в корне E:\vue-projects\rs-saas
Собери работающий MVP Nuxt 4 + Vue 3 + TypeScript + Tailwind CSS 4 + daisyUI 5 + Pinia (@pinia/nuxt). Сначала прочитай README.md, docs/*, demo/*, templates/* и просмотри references/01-guest-mobile.png и 02-host-mobile.png. Если репозиторий уже существует — изучи структуру и сохрани рабочий код. Не перезаписывай package.json вслепую. Создай приложение, а не новые макеты или план.

Следуй PRODUCT.md и DESIGN.md. Тёмный графит/лайм и крупная типографика обязательны; не превращай в типовой белый dashboard. Рамки устройств и Telegram chrome не верстать. Общие компоненты: Button, Chip, Sheet, DateRangePicker, GuestPicker, PropertyCard, PricePin, VerificationBadge, StatusBadge, BottomNav, BookingSummary, UnitRow, CalendarGrid. Раздели layouts guest/host. На desktop поиск с картой справа, на мобильном карта/список и карточка снизу.

Скопируй demo seed в typed domain с проверкой ссылок. Подключи единый DemoRepository с localStorage/schemaVersion/reset, demo clock, error/latency controls. Используй domain.mjs как проверенный контракт логики или перенеси в TS с сохранением тестов. UI не должен расходиться с его доступностью и расчётами. Действия действительно меняют состояние; никаких пустых кнопок.

Реализуй весь путь: поиск и фильтры → объект → выбор конкретной unit → расчёт → демо-бронь → список броней; избранное. Хозяин: свои объекты → номера/календарь/настройки → блокировка дат, подтверждение и отмена брони, редактирование объекта. Добавление объекта через форму создаёт apartment с одной unit или hotel/hostel с явным добавлением unit. Кнопка публикации проверяет обязательные поля. Все изменения сохраняются.

Реальные сервисы не подключать. DemoMapAdapter локальный, с подписью демо, пинами по координатам и общей выборкой; предусмотри замену adapter. Изображения public/demo — честные временные заглушки; не извлекай фото из картинок телефонов. Telegram adapter optional, приложение работает обычным браузером. Симуляция оплаты явно подписана, без сбора платёжных данных.

Vitest обязателен: тесты demo/domain.test.mjs сохранить, добавить содержательные component-тесты через Vue Test Utils. Установи зависимости, запусти тесты и build, исправь ошибки. Покажи команды запуска и ограничения. Не останавливайся на каркасе: закончи UI и пройди docs/QA.md по доступным проверкам. Реальные подключения остаются вне MVP.


Обязательные архитектурные требования:
- Следуй docs/ARCHITECTURE.md и STACK.md. Структура Nuxt 4: app/pages, app/layouts, app/components, app/composables, app/plugins, app/stores; универсальная логика в shared/. Сборку и роутер предоставляет Nuxt.
- Публичные /, /locations/:slug, /search, /stays/:propertyId имеют SSR. Приватные /host/**, /checkout/**, /bookings, /favorites, /profile и /tg/** клиентские через routeRules. /tg — собственная точка входа с общими компонентами, не iframe публичного сайта.
- Никакого localStorage/window/Telegram на сервере. SSR и первая клиентская отрисовка читают один неизменяемый seed и одинаковые фильтры из query; затем .client plugin восстанавливает личное демо-состояние и передаёт ready. Не показывать кнопку бронирования до готовности repository. Без mutable singleton между SSR-запросами. См. hydration protocol в ARCHITECTURE.md.
- useAsyncData/useFetch для публичных данных без дубля запроса при гидратации; ключи зависят от id/query, обработать 404. Демо seed можно читать универсальным repository без фиктивного HTTP API. После client restore явно обновить текущую выборку.
- daisyUI только для базовых primitives с custom theme mesto. Календарь, карточки, карта и sheets — собственные компоненты. Не подключать Nuxt UI или вторую библиотеку тем. Tailwind через @tailwindcss/vite, CSS @import и @plugin, не смешивать с конфигом Tailwind 3.
- Использовать templates как стартовую точку. Vitest projects: node для domain, nuxt+happy-dom для компонентов с Nuxt composables. npm run test, npm run typecheck, npm run build. Проверить SSR HTML и отсутствие hydration warnings при прямом заходе и переходах.
