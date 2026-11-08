# Стек и установка
Nuxt 4, Vue 3, TypeScript; Tailwind CSS 4 через @tailwindcss/vite; daisyUI 5; Pinia через @pinia/nuxt. Vitest, @nuxt/test-utils, @vue/test-utils, happy-dom, vue-tsc. Node выбрать по engines совместимых установленных Nuxt и Vitest, закрепить в .nvmrc и README; не предполагать старую Node 18.

На существующем проекте сначала изучить package.json. На пустом — создать Nuxt 4 проект во временной папке и аккуратно перенести в корень, сохранив комплект материалов. Установить совместимые версии, сохранить package-lock.json. Не запускать init поверх существующих файлов с принудительной заменой.

scripts приложения:
- dev: nuxt dev
- build: nuxt build
- preview: nuxt preview
- postinstall: nuxt prepare
- typecheck: nuxt typecheck
- test: vitest run
- test:watch: vitest
- bot: запуск общего Telegram-бота на grammY с настройками окружения

Tailwind подключать одним способом через Vite plugin из templates/nuxt.config.ts. Не ставить @nuxtjs/tailwindcss параллельно. daisyUI: отключить встроенные темы и объявить mesto; тема закреплена на html через app.head.htmlAttrs. Примеры CSS в templates. Не вводить Nuxt UI.

Vitest node-проект запускает demo/domain.test.mjs и tests/unit/**/*.test.ts. Nuxt-проект запускает tests/nuxt/**/*.nuxt.spec.ts через defineVitestProject и environment nuxt. Для компонентов Nuxt использовать mountSuspended из @nuxt/test-utils/runtime; обычные чистые функции не требуют Nuxt environment. До запуска nuxt-тестов выполнить nuxt prepare. Пример конфигурации — отправная точка, совместимость проверить на установленных версиях.

Проверки: test, typecheck, build; server preview + прямой HTTP запрос на /stays/p1 должен содержать название жилья в HTML. Затем браузер: нет hydration warnings, личное состояние появляется после mount, роли не текут между SSR-запросами. Проверить переходы /search ↔ /tg и back, localStorage restore/reset. Сервер не должен изменять исходный seed.

Официальные источники для сборки:
- https://nuxt.com/docs/4.x/guide/concepts/rendering
- https://nuxt.com/docs/4.x/getting-started/testing
- https://daisyui.com/docs/install/nuxt/
- https://daisyui.com/docs/themes/
- https://tailwindcss.com/docs/installation/using-vite
- https://github.com/nuxt/test-utils/blob/main/examples/app-vitest/vitest.config.ts
