# Presentation walkthrough

All listings, people, bookings, prices and images are fictional. Use the profile action “Сбросить демо” to load the complete showcase catalog. Reset removes current demo edits and the migration backup; it leaves other applications' browser storage intact.

## Catalog coverage

The seed contains 60 properties in 27 cities across Crimea, Kuban and southern Russia: 40 apartments (12 monthly rentals), 9 hostels, 9 hotels and 2 houses. There are 112 physical units, 47 bookings, two saved favorites and one maintenance block. The first owner has 21 properties, including the original draft studio. City coordinates are approximate and are not navigation advice. Images repeat across fictional listings.

City entry pages start without the reference sea-view and price restrictions. Explicit URL filters still apply, including filters that return no matches in inland cities.

Switching rental modes clears the price, amenities, property type and video filter. If a saved catalog contains no published monthly listings, the search links to the profile reset and explains that reset removes current demo edits. The interactive map initially has no selected property and fits all results. Nearby markers form a group; select the group and then an object, or select an individual marker. Close the card with its close button or a click on the map background. The two original showcase properties include photo galleries; room thumbnails are illustrative.

| Show | Steps and expected result |
| --- | --- |
| Reference search | Reset, open search. June 12–16, 2027, two guests, up to 6,000 ₽ and sea view returns only “Терраса над Ялтой”: 4,200 ₽ per night, 16,800 ₽ total. |
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

## Verification boundaries

The app uses browser-local demo data. Another browser starts from the seed. The shared grammY bot has isolated command tests; a real conversation requires a dedicated token if the configured bot already has a webhook. Yandex Maps requires a valid JavaScript API key and allowed domain for interactive markers.
