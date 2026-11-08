# Presentation walkthrough

All listings, people, bookings, prices and images are fictional. Use the profile action “Сбросить демо” to load the complete showcase catalog. Reset removes current demo edits and both migration backups; it leaves other applications' browser storage intact.

## Catalog coverage

The seed contains 60 properties in 27 cities across Crimea, Kuban and southern Russia: 40 apartments (12 monthly rentals), 9 hostels, 9 hotels and 2 houses. There are 112 physical units, 47 bookings, two saved favorites and one maintenance block. The first owner has 21 properties, including the original draft studio. City coordinates are approximate and are not navigation advice. Images repeat across fictional listings.

New searches start without a budget, sea view, city, region, property type or video restriction. Dates, guest count and rental mode remain the basic search parameters. Previously saved custom filters and explicit URL filters are retained. City entry pages apply their city; explicit filters can return no matches in inland cities.

Switching rental modes clears the price, amenities, property type and video filter. If a saved catalog contains no published monthly listings, the search links to the profile reset and explains that reset removes current demo edits. The interactive map initially has no selected property and fits all results. Nearby markers form a group; select the group and then an object, or select an individual marker. Close the card with its close button or a click on the map background. The two original showcase properties include photo galleries; room thumbnails are illustrative.

| Show | Steps and expected result |
| --- | --- |
| Reference search | Reset, open search, then explicitly select a 6,000 ₽ budget and sea view. June 12–16, 2027 and two guests returns only “Терраса над Ялтой”: 4,200 ₽ per night, 16,800 ₽ total. |
| Broad search | Clear filters. Select Crimea, Kuban or South Russia, then a city. Map and list share the same results; the map fits the current selection. |
| Hostels | Set one guest, select hostel. Each bed is one physical unit; two guests cannot book a single bed. |
| Monthly rentals | Choose “Долгосрок”. Dates expand to 30 nights; prices and budget become monthly. A month means 30 days; longer stays are prorated, with the accommodation subtotal rounded once to whole rubles. |
| Monthly quote | Open “Двушка с рабочим местом · Симферополь” (`p35`). June 12–July 12 costs 38,000 ₽; June 12–July 13 costs 39,267 ₽. |
| Guest booking states | Guest bookings include checked-in `b1`, confirmed `b9`, pending-host `b10`, paid `b11`, completed manual booking `b12`, and cancelled `b13`; a monthly booking is also included. Active trips appear before history. |
| Shared lifecycle | As owner confirm `b10`; return to guest bookings to simulate its payment, then use owner check-in and completion. Changes appear in both contexts. |
| Owner inventory | Open the draft `p3`, edit the property/unit, and publish. Other owner examples cover hotels, beds, ordinary apartments and monthly rentals. |
| Calendar and direct use | Switch between a Monday–Sunday week and a calendar month. Multi-unit properties start collapsed and show unavailable / total counts for each day; expand “Кипарис” to see its rooms. Room `p2-102` is free June 12–16. Add a manual booking there, select its bar to inspect the guest, dates and price, then cancel. Select a free day to prefill the blocking form. Room `p2-202` is under maintenance until June 20; blocking occupied dates is rejected. |
| Nested owner views | On the hotel page, open “Календарь”: the property summary shows free, occupied and blocked units for the chosen day and expands to its rooms. In owner “Брони”, expand the property and then a room or bed to inspect and manage its bookings; empty units remain visible. |
| Personal bot concept | Open “Мой бот”, create a simulated bot, stop it, and regenerate its demo token. This does not connect a Telegram account. |
| Edge states | Profile can show loading and error/retry; a 500 ₽ nightly budget gives an empty result. Favorites, edited inventory and bookings survive reload. |

## Storage upgrade and rollback

Schema v2 adds the expanded presentation data and optional monthly rental fields. Valid v1 browser state is upgraded in memory without replacing personal demo edits or adding conflicting sample reservations. Before the first v1 upgrade, the exact original JSON is copied once to `rs-saas-demo:v1-backup`; the main key is saved only on an explicit mutation. Reset is required to replace old examples with the new complete seed.

For rollback to a v1 application, restore the exact backup JSON to `rs-saas-demo` before loading that application. Keep an exported copy before resetting. [Migration helpers](../shared/domain/migrations.ts) support version rollback for states without monthly rentals; a v2 state containing monthly units requires the original backup because v1 cannot represent monthly prices. No production database migration is involved.

The historical June 12–16 / two guests / 6,000 ₽ / sea-view default is normalized in memory to unrestricted search only when the saved filters exactly match that preset. Custom filters, bookings and inventory stay intact. Before normalization, v2 state is backed up once to `rs-saas-demo:defaults-backup` (v1 uses its existing backup). Restore its exact JSON to the main key and the previous app version to roll back. Reset clears both project backups. Asset replacements keep existing image URLs, so saved listings also receive the new photographs; Git contains the previous assets for rollback.

## Verification boundaries

The app uses browser-local demo data. Another browser starts from the seed. The shared grammY bot has isolated command tests; a real conversation requires a dedicated token if the configured bot already has a webhook. Yandex Maps requires a valid JavaScript API key and allowed domain for interactive markers.

## Image direction and provenance

The raster assets were generated with the built-in imagegen tool, then inspected and copied to the existing paths below. They illustrate fictional accommodation, including repeated photographs; they are not evidence of real listings. Prompt direction: natural real-estate photographs, ordinary clean furnishings, realistic room proportions, subdued daylight and restrained colors, without luxury staging, dramatic landscapes, text or people.

| Asset | Scene prompt |
| --- | --- |
| [Terrace](../public/demo/photo-p1.png) | Modest tiled Yalta apartment terrace, plain metal railing, folding chairs and a small table; neighboring buildings and a distant sea glimpse, overcast daylight. |
| [Seaside interior](../public/demo/photo-p1-interior.png) | Small simple balcony and living room, practical furnishings and a quiet sea glimpse between neighboring buildings. |
| [Guesthouse](../public/demo/photo-p2.png) | Modest three-story guesthouse, a few balconies, simple courtyard and entrance, practical landscaping and overcast daylight. |
| [Room](../public/demo/photo-p2-room.png) | Small guesthouse room, plain double bed, neutral linen, bedside table, curtains and soft ordinary daylight. |
| [Studio](../public/demo/photo-p3.png), [catalog studio](../public/demo/ordinary-apartment-1.png) | Compact white kitchen, muted blue sofa, simple dining table, laminate floor and natural window daylight in an ordinary Krasnodar studio. |
| [Hostel](../public/demo/photo-p4.png) | Compact room with two metal bunks (four beds), white bedding, lockers, reading lights and natural window light. |
| [House](../public/demo/photo-p5.png), [second house](../public/demo/photo-p8.png) | Small plaster detached rental house, ordinary garden, simple terrace and practical chairs in a believable neighborhood. |
| [Simple flat](../public/demo/photo-p6.png) | Affordable apartment with an olive sofa, plain wardrobe, small dining table, warm wood floor and soft window daylight. |
| [Apartment](../public/demo/photo-p7.png), [catalog apartment](../public/demo/ordinary-apartment-2.png) | Comfortable ordinary apartment, light walls, simple oak furniture, sofa and dining table, modest balcony and diffuse daylight. |

## Preview publication

Public URLs: [web preview](https://app.weblaba.ru), [Telegram Mini App](https://app.weblaba.ru/tg). The menu button of [the shared demo bot](https://t.me/UBK_Real_Estate_bot) opens the Mini App; its existing webhook runtime is managed separately from this static publication.

The shared REG.RU host serves Apache files and has Node 10, so this demo uses `npm run generate` built locally with Node 22. Public property and city routes are prerendered; private and Telegram routes use the client application with the Apache fallback to `200.html`. Apache can append a trailing slash when a prerendered directory is opened; platform routing normalizes it before matching screens. There is no server API in the preview. The SSR build remains available with `npm run build` on a Node 22 host.

Static HTML reflects the build-time seed; query filters and saved state are applied in the browser. Unknown routes use the client 404 screen and may have HTTP status 200 through the fallback. Apache responses set `X-Robots-Tag: noindex, nofollow`; HTML, JSON and PNG files use `Cache-Control: no-cache` where the included header rules apply.

Run tests, typecheck and generation before upload. Inspect `.output/public` for the expected routes and ensure no bot token or `.env` is included. The public Yandex JavaScript key is intentionally included at build time and must allow the preview domain. Upload only `.output/public`, with `.htaccess`, to the dedicated preview directory `/var/www/u1396397/data/www/app.weblaba.ru` on `server199.hosting.reg.ru` as `u1396397`, using the local `weblaba_deploy` SSH key. Never publish the project root or overwrite `weblaba.ru`.

Before replacing an existing preview, retain its complete directory in a sibling release backup. Record the source commit, whether the tree had changes, and the uploaded archive SHA-256 outside the public directory. To roll back, move the failed preview aside and restore that directory. Browser-local demo data remains independent of deployed files. Verify HTTPS, `/tg/search`, a property page, a private calendar route, images and the Yandex map after publication. Bot credentials stay outside the public directory; updating its menu URL does not require changing an existing webhook.
