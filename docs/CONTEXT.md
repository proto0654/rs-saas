# Project context

Lokal (Локаль) is a Nuxt demonstration of a guest accommodation marketplace and an owner workspace. See the [documentation hub](README.md) for product, design and acceptance requirements.

The browser-local Pinia store starts from the [demo seed](../demo/seed.json); it is not a shared database, authentication, or a production audit trail. Public pages render with the seed through SSR or static prerendering; private state is restored after mount. The published preview uses static hosting; see [publication and rollback](DEMO.md#preview-publication). The [grammY bot](../bot/index.mjs) is a separate optional process; personal bot tokens shown in the owner workspace are simulated.

The primary project language is English for new documentation and code, while existing Russian product documents and customer-facing UI remain in Russian. Project instructions override global agent rules. See [run instructions](../README.md) and [architecture](ARCHITECTURE.md).

Routes are explicit Nuxt pages. Guest, host and Telegram layouts share [AppShell](../app/components/AppShell.vue) and [platform navigation](../app/composables/usePlatform.ts); [MestoApp](../app/components/MestoApp.vue) composes the shared screens. Transient map selection and demo network scenarios live in the request-scoped Pinia store and survive client navigation; only the demo data namespace is persisted to browser storage.

The landing-page animation is implemented by [HomeIntro](../app/components/HomeIntro.vue). Guest search uses [SearchMapLayout](../app/components/SearchMapLayout.vue) for a persistent full-viewport map with measured overlay panels; its behavior and keyless-widget limitations are described in the [showcase walkthrough](DEMO.md). Owner inventory views share the [calendar](../app/components/HostCalendar.vue) and [booking groups](../app/components/HostBookings.vue).

The public product name comes from [brand configuration](../shared/brand.ts). Legacy component and theme identifiers remain internal; the browser-storage namespace stays unchanged to preserve demo data.

The [showcase catalog](DEMO.md) covers Crimea, Kuban and southern Russia, with nightly and monthly rental modes. Monthly rentals require at least 30 nights and use a fixed 30-day pricing month.
