export const regionLabels = { crimea: "Крым", krasnodar: "Кубань", south: "Юг России" } as const
export const locations = [
  {
    "slug": "yalta",
    "city": "Ялта",
    "region": "crimea",
    "lat": 44.5,
    "lon": 34.17
  },
  {
    "slug": "alushta",
    "city": "Алушта",
    "region": "crimea",
    "lat": 44.67,
    "lon": 34.41
  },
  {
    "slug": "gurzuf",
    "city": "Гурзуф",
    "region": "crimea",
    "lat": 44.55,
    "lon": 34.28
  },
  {
    "slug": "alupka",
    "city": "Алупка",
    "region": "crimea",
    "lat": 44.42,
    "lon": 34.05
  },
  {
    "slug": "simeiz",
    "city": "Симеиз",
    "region": "crimea",
    "lat": 44.41,
    "lon": 34.01
  },
  {
    "slug": "livadia",
    "city": "Ливадия",
    "region": "crimea",
    "lat": 44.47,
    "lon": 34.14
  },
  {
    "slug": "sevastopol",
    "city": "Севастополь",
    "region": "crimea",
    "lat": 44.61,
    "lon": 33.52
  },
  {
    "slug": "simferopol",
    "city": "Симферополь",
    "region": "crimea",
    "lat": 44.95,
    "lon": 34.1
  },
  {
    "slug": "evpatoria",
    "city": "Евпатория",
    "region": "crimea",
    "lat": 45.19,
    "lon": 33.36
  },
  {
    "slug": "feodosia",
    "city": "Феодосия",
    "region": "crimea",
    "lat": 45.03,
    "lon": 35.38
  },
  {
    "slug": "sudak",
    "city": "Судак",
    "region": "crimea",
    "lat": 44.85,
    "lon": 34.97
  },
  {
    "slug": "kerch",
    "city": "Керчь",
    "region": "crimea",
    "lat": 45.36,
    "lon": 36.47
  },
  {
    "slug": "krasnodar",
    "city": "Краснодар",
    "region": "krasnodar",
    "lat": 45.04,
    "lon": 38.98
  },
  {
    "slug": "anapa",
    "city": "Анапа",
    "region": "krasnodar",
    "lat": 44.9,
    "lon": 37.32
  },
  {
    "slug": "gelendzhik",
    "city": "Геленджик",
    "region": "krasnodar",
    "lat": 44.56,
    "lon": 38.08
  },
  {
    "slug": "sochi",
    "city": "Сочи",
    "region": "krasnodar",
    "lat": 43.59,
    "lon": 39.72
  },
  {
    "slug": "novorossiysk",
    "city": "Новороссийск",
    "region": "krasnodar",
    "lat": 44.72,
    "lon": 37.77
  },
  {
    "slug": "tuapse",
    "city": "Туапсе",
    "region": "krasnodar",
    "lat": 44.1,
    "lon": 39.07
  },
  {
    "slug": "yeysk",
    "city": "Ейск",
    "region": "krasnodar",
    "lat": 46.71,
    "lon": 38.28
  },
  {
    "slug": "rostov-na-donu",
    "city": "Ростов-на-Дону",
    "region": "south",
    "lat": 47.22,
    "lon": 39.71
  },
  {
    "slug": "taganrog",
    "city": "Таганрог",
    "region": "south",
    "lat": 47.21,
    "lon": 38.93
  },
  {
    "slug": "astrakhan",
    "city": "Астрахань",
    "region": "south",
    "lat": 46.35,
    "lon": 48.04
  },
  {
    "slug": "volgograd",
    "city": "Волгоград",
    "region": "south",
    "lat": 48.71,
    "lon": 44.51
  },
  {
    "slug": "kislovodsk",
    "city": "Кисловодск",
    "region": "south",
    "lat": 43.91,
    "lon": 42.72
  },
  {
    "slug": "pyatigorsk",
    "city": "Пятигорск",
    "region": "south",
    "lat": 44.04,
    "lon": 43.06
  },
  {
    "slug": "makhachkala",
    "city": "Махачкала",
    "region": "south",
    "lat": 42.98,
    "lon": 47.5
  },
  {
    "slug": "derbent",
    "city": "Дербент",
    "region": "south",
    "lat": 42.06,
    "lon": 48.29
  }
] as const

export function propertyRegion(property: { region?: string; city: string }) {
  return property.region || locations.find(location => location.city === property.city)?.region
}
