const API_KEY = 'V7zmYy3HOVY4KFc0bqVT'; 

// Granice obszaru (ok. 25-30 km wokół Bydgoszczy)
const BYDGOSZCZ_BOUNDS = [
    [17.899089, 53.067032], // Lewy dolny róg
    [18.186868, 53.256348]  // Prawy górny róg
];

// Współrzędne dla wyszukiwarki (Nominatim wymaga innego formatu: lewo, góra, prawo, dół)
const VIEWBOX = "17.899089,53.067032,18.186868,53.256348";
const APP_THEME_COLORS = {
    light: '#F4F1E8',
    dark: '#1F2124'
};
const MAX_HISTORY_ITEMS = 5;
const MIN_SEARCH_LENGTH = 3;
const SUGGESTION_DELAY_MS = 800;
const CONSTRUCTION_ROAD_FILTER = [
    "any",
    ["in", "class",
        "motorway_construction",
        "trunk_construction",
        "primary_construction",
        "secondary_construction",
        "tertiary_construction",
        "minor_construction",
        "service_construction"
    ]
];
const LIVE_CONSTRUCTION_SOURCE_ID = 'osm-live-construction-roads';
const EMPTY_FEATURE_COLLECTION = {
    type: 'FeatureCollection',
    features: []
};
const OVERPASS_MOTOR_CONSTRUCTION_TYPES = [
    'motorway',
    'trunk',
    'primary',
    'secondary',
    'tertiary',
    'unclassified',
    'residential',
    'living_street',
    'service',
    'road'
].join('|');
const OVERPASS_CONSTRUCTION_QUERY = `[out:json][timeout:25];
way["highway"="construction"]["construction"~"^(${OVERPASS_MOTOR_CONSTRUCTION_TYPES})$"](${BYDGOSZCZ_BOUNDS[0][1]},${BYDGOSZCZ_BOUNDS[0][0]},${BYDGOSZCZ_BOUNDS[1][1]},${BYDGOSZCZ_BOUNDS[1][0]});
out geom;`;

const minimalistycznyStyl = {
    "version": 8,
    "glyphs": `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${API_KEY}`,
    "sources": {
        "maptiler": {
            "type": "vector",
            "url": `https://api.maptiler.com/tiles/v3/tiles.json?key=${API_KEY}`
        }
    },
    "layers": [
        // 1. Ciepłe, jasne tło w stylu iOS
        {
            "id": "tlo",
            "type": "background",
            "paint": { "background-color": "#F4F1E8" }
        },
        // 2. Zieleń naturalna wyciszona względem dróg
        {
            "id": "zielen-naturalna",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "landcover",
            "filter": ["match", ["get", "class"], ["wood", "grass", "scrub", "farmland"], true, false],
            "paint": { "fill-color": "#DCEBCF" }
        },
        // 3. Parki i cmentarze
        {
            "id": "zielen-miejska",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "landuse",
            "filter": ["match", ["get", "class"], ["park", "pitch", "cemetery", "recreation_ground"], true, false],
            "paint": { "fill-color": "#D6E7C9" }
        },
        // 4. Woda
        {
            "id": "woda",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "water",
            "paint": { "fill-color": "#B8DDF2" }
        },
        // 5. Budynki
        {
            "id": "budynki",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "building",
            "paint": { 
                "fill-color": "#E0DCD3", 
                "fill-opacity": 0.86,
                "fill-outline-color": "#C6C0B7" 
            }
        },
        // 6. Ścieżki i alejki parkowe (przerywana linia)
        {
            "id": "sciezki",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": ["in", "class", "path", "track", "pedestrian"],
            "paint": {
                "line-color": "#D6D7D2",
                "line-width": 1.2,
                "line-opacity": 0.75,
                "line-dasharray": [2, 2]
            }
        },
       // 7. Drogi samochodowe - pierwszy plan dla dostaw
        {
            "id": "drogi",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": ["!in", "class", "path", "track", "pedestrian"],
            "paint": { 
                "line-color": [
                    "match", ["get", "class"],
                    ["motorway", "trunk"], "#F2C45E",   
                    ["primary", "secondary"], "#FFE8A3", 
                    "#FFFFFF"                            
                ],
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, ["match", ["get", "class"], ["motorway", "trunk"], 6, "primary", 5, "secondary", 4.5, 4],
                    16, ["match", ["get", "class"], ["motorway", "trunk"], 11, "primary", 9.5, "secondary", 8, 7],
                    20, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 24, 18]
                ]
            }
        },
        // 8. Obramowanie dróg
        {
            "id": "drogi-obramowanie",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": ["!in", "class", "path", "track", "pedestrian"],
            "paint": { 
                "line-color": "#C8C9C4", 
                "line-width": 1, 
                "line-gap-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, ["match", ["get", "class"], ["motorway", "trunk"], 6, "primary", 5, "secondary", 4.5, 4],
                    16, ["match", ["get", "class"], ["motorway", "trunk"], 11, "primary", 9.5, "secondary", 8, 7],
                    20, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 24, 18]
                ]
            }
        },
        // 9. Ulice w budowie / zamknięte według danych OSM
        {
            "id": "drogi-zamkniete-obramowanie",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": CONSTRUCTION_ROAD_FILTER,
            "paint": {
                "line-color": "#FFFFFF",
                "line-opacity": 0.96,
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, 8,
                    16, 14,
                    20, 26
                ]
            }
        },
        {
            "id": "drogi-zamkniete",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": CONSTRUCTION_ROAD_FILTER,
            "paint": {
                "line-color": "#C86F68",
                "line-opacity": 0.86,
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, 4,
                    16, 8,
                    20, 16
                ],
                "line-dasharray": [1.35, 0.85]
            }
        },
        {
            "id": "drogi-zamkniete-znaki",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation",
            "minzoom": 14,
            "filter": CONSTRUCTION_ROAD_FILTER,
            "layout": {
                "text-field": "×",
                "symbol-placement": "line",
                "symbol-spacing": 80,
                "text-font": ["Noto Sans Regular"],
                "text-size": 18,
                "text-keep-upright": false
            },
            "paint": {
                "text-color": "#C86F68",
                "text-opacity": 0.9,
                "text-halo-color": "#FFFFFF",
                "text-halo-width": 1.4
            }
        },
        // 9. Napisy - Miejscowości
        {
            "id": "miejscowosci",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "place",
            "minzoom": 9,
            "maxzoom": 15,
            "layout": {
                "text-field": ["get", "name"],
                "text-font": ["Noto Sans Regular"],
                "text-size": [
                    "match", ["get", "class"],
                    "city", 22,
                    "town", 16,
                    "village", 14,
                    12
                ]
            },
            "paint": { "text-color": "#3E403E", "text-halo-color": "#F7F5EF", "text-halo-width": 2 }
        },
        // 10. Napisy - Nazwy ulic
        {
            "id": "nazwy-ulic",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation_name",
            "minzoom": 14,
            "layout": {
                "text-field": ["get", "name"],
                "symbol-placement": "line",
                "text-font": ["Noto Sans Regular"],
                "text-size": 13
            },
            "paint": { "text-color": "#2F3133", "text-halo-color": "#F7F5EF", "text-halo-width": 2.2 }
        },
        // 11. Strzałki jednokierunkowe (zgodne)
        {
            "id": "strzalki-kierunek-zgodny",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation",
            "minzoom": 15,
            "filter": ["==", "oneway", 1],
            "layout": {
                "text-field": "→",
                "symbol-placement": "line",
                "symbol-spacing": 100,
                "text-font": ["Noto Sans Regular"],
                "text-size": 14, 
                "text-keep-upright": false
            },
            "paint": { 
                "text-color": "#3F4245", 
                "text-halo-color": "#F7F5EF", 
                "text-halo-width": 1.5 
            }
        },
        // 12. Strzałki jednokierunkowe (przeciwne)
        {
            "id": "strzalki-kierunek-przeciwny",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation",
            "minzoom": 15,
            "filter": ["==", "oneway", -1],
            "layout": {
                "text-field": "←",
                "symbol-placement": "line",
                "symbol-spacing": 100,
                "text-font": ["Noto Sans Regular"],
                "text-size": 14, 
                "text-keep-upright": false
            },
            "paint": { 
                "text-color": "#3F4245", 
                "text-halo-color": "#F7F5EF", 
                "text-halo-width": 1.5 
            }
        },
        // 13. Numery budynków
        {
            "id": "numery-budynkow",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "housenumber",
            "minzoom": 15,
            "layout": {
                "text-field": ["get", "housenumber"],
                "text-font": ["Noto Sans Regular"],
                "text-size": [
                    "interpolate", 
                    ["linear"], 
                    ["zoom"], 
                    16, 10,
                    20, 18
                ]
            },
            "paint": { "text-color": "#2F3133", "text-halo-color": "#F7F5EF", "text-halo-width": 1.25 }
        }
    ]
};

const ciemnyStyl = {
    "version": 8,
    "glyphs": `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${API_KEY}`,
    "sources": {
        "maptiler": {
            "type": "vector",
            "url": `https://api.maptiler.com/tiles/v3/tiles.json?key=${API_KEY}`
        }
    },
    "layers": [
        // 1. Grafitowe tło z czytelnym kontrastem dróg
        {
            "id": "tlo",
            "type": "background",
            "paint": { "background-color": "#1F2124" }
        },
        // 2. Zgaszona, ale widoczna zieleń naturalna
        {
            "id": "zielen-naturalna",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "landcover",
            "filter": ["match", ["get", "class"], ["wood", "grass", "scrub", "farmland"], true, false],
            "paint": { "fill-color": "#173322" }
        },
        // 3. Zieleń miejska
        {
            "id": "zielen-miejska",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "landuse",
            "filter": ["match", ["get", "class"], ["park", "pitch", "cemetery", "recreation_ground"], true, false],
            "paint": { "fill-color": "#183422" }
        },
        // 4. Wyraźniejszy granat dla wody
        {
            "id": "woda",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "water",
            "paint": { "fill-color": "#0F2E43" }
        },
        // 5. Delikatnie wybijające się z tła budynki
        {
            "id": "budynki",
            "type": "fill",
            "source": "maptiler",
            "source-layer": "building",
            "paint": {
                "fill-color": "#2A2D31",
                "fill-opacity": 0.88,
                "fill-outline-color": "#4B5056"
            }
        },
        // 6. Ścieżki
        {
            "id": "sciezki",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": ["in", "class", "path", "track", "pedestrian"],
            "paint": {
                "line-color": "#34383D",
                "line-width": 1.2,
                "line-opacity": 0.7,
                "line-dasharray": [2, 2]
            }
        },
       // 7. Drogi samochodowe - czytelne w nocy, bez neonów
        {
            "id": "drogi",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": ["!in", "class", "path", "track", "pedestrian"],
            "paint": {
                "line-color": [
                    "match", ["get", "class"],
                    ["motorway", "trunk"], "#8A724E",
                    ["primary", "secondary"], "#6C747B",
                    "#4B5157"
                ],
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, ["match", ["get", "class"], ["motorway", "trunk"], 6, "primary", 5, "secondary", 4.5, 4],
                    16, ["match", ["get", "class"], ["motorway", "trunk"], 11, "primary", 9.5, "secondary", 8, 7],
                    20, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 24, 18]
                ]
            }
        },
        // 8. Obramowanie dróg
        {
            "id": "drogi-obramowanie",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": ["!in", "class", "path", "track", "pedestrian"],
            "paint": {
                "line-color": "#17191C",
                "line-width": 1,
                "line-gap-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, ["match", ["get", "class"], ["motorway", "trunk"], 6, "primary", 5, "secondary", 4.5, 4],
                    16, ["match", ["get", "class"], ["motorway", "trunk"], 11, "primary", 9.5, "secondary", 8, 7],
                    20, ["match", ["get", "class"], ["motorway", "trunk", "primary"], 24, 18]
                ]
            }
        },
        // 9. Ulice w budowie / zamknięte według danych OSM
        {
            "id": "drogi-zamkniete-obramowanie",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": CONSTRUCTION_ROAD_FILTER,
            "paint": {
                "line-color": "#1F2124",
                "line-opacity": 0.96,
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, 8,
                    16, 14,
                    20, 26
                ]
            }
        },
        {
            "id": "drogi-zamkniete",
            "type": "line",
            "source": "maptiler",
            "source-layer": "transportation",
            "filter": CONSTRUCTION_ROAD_FILTER,
            "paint": {
                "line-color": "#C9857E",
                "line-opacity": 0.88,
                "line-width": [
                    "interpolate", ["linear"], ["zoom"],
                    12, 4,
                    16, 8,
                    20, 16
                ],
                "line-dasharray": [1.35, 0.85]
            }
        },
        {
            "id": "drogi-zamkniete-znaki",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation",
            "minzoom": 14,
            "filter": CONSTRUCTION_ROAD_FILTER,
            "layout": {
                "text-field": "×",
                "symbol-placement": "line",
                "symbol-spacing": 80,
                "text-font": ["Noto Sans Regular"],
                "text-size": 18,
                "text-keep-upright": false
            },
            "paint": {
                "text-color": "#C9857E",
                "text-opacity": 0.9,
                "text-halo-color": "#1F2124",
                "text-halo-width": 1.4
            }
        },
        // 9. Miejscowości - Kontrastowy, jasny tekst na ciemnym tle
        {
            "id": "miejscowosci",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "place",
            "minzoom": 9,
            "maxzoom": 15,
            "layout": {
                "text-field": ["get", "name"],
                "text-font": ["Noto Sans Regular"],
                "text-size": [
                    "match", ["get", "class"],
                    "city", 22,
                    "town", 16,
                    "village", 14,
                    12
                ]
            },
            "paint": {
                "text-color": "#E6E8EA",
                "text-halo-color": "#1F2124",
                "text-halo-width": 2
            }
        },
        // 10. Nazwy ulic
        {
            "id": "nazwy-ulic",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation_name",
            "minzoom": 14,
            "layout": {
                "text-field": ["get", "name"],
                "symbol-placement": "line",
                "text-font": ["Noto Sans Regular"],
                "text-size": 13
            },
            "paint": {
                "text-color": "#D5D8DC",
                "text-halo-color": "#1F2124",
                "text-halo-width": 2.2
            }
        },
        // 11. Jasnoszare strzałki (kierunek zgodny)
        {
            "id": "strzalki-kierunek-zgodny",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation",
            "minzoom": 15,
            "filter": ["==", "oneway", 1],
            "layout": {
                "text-field": "→",
                "symbol-placement": "line",
                "symbol-spacing": 100,
                "text-font": ["Noto Sans Regular"],
                "text-size": 14,
                "text-keep-upright": false
            },
            "paint": {
                "text-color": "#C8CCD0", 
                "text-halo-color": "#1F2124",
                "text-halo-width": 1.5
            }
        },
        // 12. Jasnoszare strzałki (kierunek przeciwny)
        {
            "id": "strzalki-kierunek-przeciwny",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "transportation",
            "minzoom": 15,
            "filter": ["==", "oneway", -1],
            "layout": {
                "text-field": "←",
                "symbol-placement": "line",
                "symbol-spacing": 100,
                "text-font": ["Noto Sans Regular"],
                "text-size": 14,
                "text-keep-upright": false
            },
            "paint": {
                "text-color": "#C8CCD0",
                "text-halo-color": "#1F2124",
                "text-halo-width": 1.5
            }
        },
        // 13. Numery budynków (dynamiczna wielkość)
        {
            "id": "numery-budynkow",
            "type": "symbol",
            "source": "maptiler",
            "source-layer": "housenumber",
            "minzoom": 15,
            "layout": {
                "text-field": ["get", "housenumber"],
                "text-font": ["Noto Sans Regular"],
                "text-size": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    16, 10,
                    20, 18
                ]
            },
            "paint": {
                "text-color": "#D8DBDE",
                "text-halo-color": "#1F2124",
                "text-halo-width": 1.25
            }
        }
    ]
};

// Odczyt z pamięci przeglądarki
const savedTheme = localStorage.getItem('theme') || 'light';
const isDark = savedTheme === 'dark';

let stableViewportHeight = window.innerHeight;
let liveConstructionRoadsData = EMPTY_FEATURE_COLLECTION;
let liveConstructionRoadsLoaded = false;

function syncAppViewportHeight(options = {}) {
    const safeBottomValue = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
    const safeBottom = parseFloat(safeBottomValue) || 0;
    const activeElement = document.activeElement;
    const keyboardLikelyOpen = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );

    if (options.reset || window.innerHeight > stableViewportHeight || (!keyboardLikelyOpen && window.innerHeight >= stableViewportHeight * 0.9)) {
        stableViewportHeight = window.innerHeight;
    }

    document.documentElement.style.setProperty('--app-height', `${stableViewportHeight + safeBottom}px`);
}

syncAppViewportHeight();

// 1. Tworzymy obiekt mapy z wyłączonym przyciskiem "i"
const map = new maplibregl.Map({
    container: 'map',
    style: isDark ? ciemnyStyl : minimalistycznyStyl,
    bounds: BYDGOSZCZ_BOUNDS,
    maxBounds: BYDGOSZCZ_BOUNDS,
    attributionControl: false // Wyłącza przycisk "i" oraz napisy o prawach autorskich
});

// 2. Dopiero potem wyłączamy na niej rotację
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

function scheduleMapResize() {
    syncAppViewportHeight();
    requestAnimationFrame(() => map.resize());
    setTimeout(() => map.resize(), 250);
}

window.addEventListener('resize', scheduleMapResize);
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        syncAppViewportHeight({ reset: true });
        map.resize();
    }, 300);
});
window.addEventListener('pageshow', scheduleMapResize);

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleMapResize);
}

map.on('load', () => {
    scheduleMapResize();
    initializeLiveConstructionRoads();
});

// 3. Przywrócony przycisk lokalizacji (GPS)
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    }),
    'bottom-right'
);

// Wektorowe ikony w formacie SVG 
const iconMoon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
const iconSun = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

// Ustawienie początkowe przycisku i motywu interfejsu (z poprawkami dla iOS)
const themeToggle = document.getElementById('themeToggle');
const themeMeta = document.getElementById('themeColorMeta');

function updateThemeButton(darkModeEnabled) {
    themeToggle.innerHTML = darkModeEnabled ? iconSun : iconMoon;
    const label = darkModeEnabled ? 'Włącz jasny motyw' : 'Włącz ciemny motyw';
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
}

function syncSystemThemeColor(darkModeEnabled) {
    const color = darkModeEnabled ? APP_THEME_COLORS.dark : APP_THEME_COLORS.light;
    document.documentElement.style.backgroundColor = color;
    if (themeMeta) themeMeta.setAttribute('content', color);
}

if (isDark) {
    document.body.classList.add('dark-theme');
    syncSystemThemeColor(true);
    updateThemeButton(true);
} else {
    syncSystemThemeColor(false);
    updateThemeButton(false);
}

// ==========================================================================
// WYSZUKIWARKA ADRESÓW I HISTORIA
// ==========================================================================
const searchBar = document.getElementById('searchBar');
const clearInputBtn = document.getElementById('clearInputBtn');
const dropdown = document.getElementById('dropdown');
const limitAlert = document.getElementById('limitAlert');

function loadSearchHistory() {
    try {
        const storedHistory = JSON.parse(localStorage.getItem('mapHistory'));
        return Array.isArray(storedHistory) ? storedHistory : [];
    } catch (error) {
        localStorage.removeItem('mapHistory');
        return [];
    }
}

let searchHistory = loadSearchHistory();

function saveToHistory(address) {
    if (!searchHistory.includes(address)) {
        searchHistory.unshift(address);
        if (searchHistory.length > MAX_HISTORY_ITEMS) searchHistory.pop();
        localStorage.setItem('mapHistory', JSON.stringify(searchHistory));
    }
}

function clearHistory() {
    searchHistory = [];
    localStorage.removeItem('mapHistory');
    renderHistory();
}

function setDropdownVisible(visible) {
    dropdown.classList.toggle('hidden', !visible);
}

function createDropdownHeader(title, actionLabel, actionHandler) {
    const header = document.createElement('div');
    header.className = 'dropdown-header';
    header.append(document.createTextNode(title));

    if (actionLabel && actionHandler) {
        const actionButton = document.createElement('button');
        actionButton.className = 'clear-btn';
        actionButton.type = 'button';
        actionButton.textContent = actionLabel;
        actionButton.addEventListener('click', actionHandler);
        header.append(actionButton);
    }

    return header;
}

function createDropdownItem(mainText, city, onSelect) {
    const item = document.createElement('div');
    item.className = 'dropdown-item';

    if (city) {
        item.append(document.createTextNode(`${mainText} `));
        const citySpan = document.createElement('span');
        citySpan.className = 'city';
        citySpan.textContent = city;
        item.append(citySpan);
    } else {
        item.textContent = mainText;
    }

    if (onSelect) item.addEventListener('click', onSelect);
    return item;
}

function getHighlightColors(darkModeEnabled) {
    return {
        outlineColor: darkModeEnabled ? '#ff5252' : '#FF3B30',
        fillColor: darkModeEnabled ? 'rgba(255, 82, 82, 0.3)' : 'rgba(255, 59, 48, 0.3)'
    };
}

function clearBuildingHighlight() {
    if (!map.getSource('highlight-building')) return;
    if (map.getLayer('highlight-building-fill')) map.removeLayer('highlight-building-fill');
    if (map.getLayer('highlight-building-outline')) map.removeLayer('highlight-building-outline');
    map.removeSource('highlight-building');
}

function getRoadClosureTheme() {
    const darkModeEnabled = document.body.classList.contains('dark-theme');
    return {
        casingColor: darkModeEnabled ? '#1F2124' : '#FFFFFF',
        lineColor: darkModeEnabled ? '#C9857E' : '#C86F68'
    };
}

function addLayerBeforeStreetLabels(layerDefinition) {
    const beforeId = map.getLayer('nazwy-ulic') ? 'nazwy-ulic' : undefined;
    map.addLayer(layerDefinition, beforeId);
}

function addLiveConstructionRoadLayers() {
    if (!map.isStyleLoaded()) return;

    const { casingColor, lineColor } = getRoadClosureTheme();

    if (!map.getSource(LIVE_CONSTRUCTION_SOURCE_ID)) {
        map.addSource(LIVE_CONSTRUCTION_SOURCE_ID, {
            type: 'geojson',
            data: liveConstructionRoadsData
        });
    } else {
        map.getSource(LIVE_CONSTRUCTION_SOURCE_ID).setData(liveConstructionRoadsData);
    }

    if (!map.getLayer('osm-live-construction-casing')) {
        addLayerBeforeStreetLabels({
            id: 'osm-live-construction-casing',
            type: 'line',
            source: LIVE_CONSTRUCTION_SOURCE_ID,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': casingColor,
                'line-opacity': 0.98,
                'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    12, 9,
                    16, 15,
                    20, 28
                ]
            }
        });
    }

    if (!map.getLayer('osm-live-construction-line')) {
        addLayerBeforeStreetLabels({
            id: 'osm-live-construction-line',
            type: 'line',
            source: LIVE_CONSTRUCTION_SOURCE_ID,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': lineColor,
                'line-opacity': document.body.classList.contains('dark-theme') ? 0.88 : 0.86,
                'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    12, 5,
                    16, 9,
                    20, 18
                ],
                'line-dasharray': [1.35, 0.85]
            }
        });
    }

    if (!map.getLayer('osm-live-construction-symbols')) {
        addLayerBeforeStreetLabels({
            id: 'osm-live-construction-symbols',
            type: 'symbol',
            source: LIVE_CONSTRUCTION_SOURCE_ID,
            minzoom: 14,
            layout: {
                'text-field': '×',
                'symbol-placement': 'line',
                'symbol-spacing': 76,
                'text-font': ['Noto Sans Regular'],
                'text-size': 18,
                'text-keep-upright': false
            },
            paint: {
                'text-color': lineColor,
                'text-opacity': 0.9,
                'text-halo-color': casingColor,
                'text-halo-width': 1.4
            }
        });
    }
}

function overpassWaysToGeoJson(data) {
    const features = (data.elements || [])
        .filter(element => element.type === 'way' && Array.isArray(element.geometry) && element.geometry.length > 1)
        .map(element => ({
            type: 'Feature',
            properties: {
                id: element.id,
                name: element.tags?.name || '',
                construction: element.tags?.construction || '',
                source: 'OpenStreetMap Overpass'
            },
            geometry: {
                type: 'LineString',
                coordinates: element.geometry.map(point => [point.lon, point.lat])
            }
        }));

    return {
        type: 'FeatureCollection',
        features
    };
}

async function fetchLiveConstructionRoads() {
    if (liveConstructionRoadsLoaded) return liveConstructionRoadsData;

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: OVERPASS_CONSTRUCTION_QUERY,
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8'
            }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        liveConstructionRoadsData = overpassWaysToGeoJson(await response.json());
    } catch (error) {
        console.warn('Nie udało się wczytać aktualnych zamknięć z OSM:', error);
        liveConstructionRoadsData = EMPTY_FEATURE_COLLECTION;
    } finally {
        liveConstructionRoadsLoaded = true;
    }

    return liveConstructionRoadsData;
}

async function initializeLiveConstructionRoads() {
    addLiveConstructionRoadLayers();
    await fetchLiveConstructionRoads();
    addLiveConstructionRoadLayers();
}


async function loadAddressOnMap(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1&countrycodes=pl&viewbox=${VIEWBOX}&bounded=1`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            const result = data[0];
            const lon = parseFloat(result.lon);
            const lat = parseFloat(result.lat);

            map.flyTo({ center: [lon, lat], zoom: 18 });

            // Usuwanie starej pinezki, jeśli istnieje
            if (currentMarker) {
                currentMarker.remove();
            }

            // Dodawanie nowej, czerwonej pinezki w dokładnym punkcie
            currentMarker = new maplibregl.Marker({ color: "#FF3B30" })
                .setLngLat([lon, lat])
                .addTo(map);

            clearBuildingHighlight();

            // Rysowanie nowego kształtu, jeśli Nominatim zwrócił poligon budynku
            if (result.geojson && (result.geojson.type === 'Polygon' || result.geojson.type === 'MultiPolygon')) {
                map.addSource('highlight-building', { type: 'geojson', data: result.geojson });
                
                const { outlineColor, fillColor } = getHighlightColors(document.body.classList.contains('dark-theme'));
                
                // Wypełnienie budynku
                map.addLayer({
                    'id': 'highlight-building-fill',
                    'type': 'fill',
                    'source': 'highlight-building',
                    'paint': { 'fill-color': fillColor }
                });
                
                // Gruba ramka dookoła budynku
                map.addLayer({
                    'id': 'highlight-building-outline',
                    'type': 'line',
                    'source': 'highlight-building',
                    'paint': { 'line-color': outlineColor, 'line-width': 3 }
                });
            }
        } else {
            alert("Nie znaleziono adresu w wyznaczonym obszarze.");
        }
    } catch (error) {
        console.error("Błąd wyszukiwania:", error);
    }
}

function renderHistory() {
    if (searchHistory.length === 0) {
        setDropdownVisible(false);
        return;
    }

    dropdown.replaceChildren(createDropdownHeader('Ostatnio wyszukiwane', 'Wyczyść', clearHistory));
    searchHistory.forEach(item => {
        dropdown.appendChild(createDropdownItem(item, '', () => {
            searchBar.value = item;
            setDropdownVisible(false);
            loadAddressOnMap(item);
        }));
    });
    setDropdownVisible(true);
}

async function fetchSuggestions(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10&countrycodes=pl&viewbox=${VIEWBOX}&bounded=1`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (query !== latestSuggestionQuery || query !== searchBar.value.trim()) return;

        dropdown.replaceChildren(createDropdownHeader('Propozycje'));
        
        if (data.length === 0) {
            dropdown.appendChild(createDropdownItem('Brak wyników'));
        } else {
            const seenAddresses = new Set(); 

            data.forEach(item => {
                const addr = item.address || {};
                const road = addr.road || '';
                const houseNumber = addr.house_number || '';
                const city = addr.city || addr.town || addr.village || addr.county || '';
                
                const mainText = `${road} ${houseNumber}`.trim() || item.name;
                const fullAddressForCheck = `${mainText}, ${city}`; 
                
                // Jeśli tego adresu jeszcze nie było na liście, to go dodajemy
                if (!seenAddresses.has(fullAddressForCheck)) {
                    seenAddresses.add(fullAddressForCheck);

                    dropdown.appendChild(createDropdownItem(mainText, city, () => {
                        const fullAddress = `${mainText}, ${city}`;
                        searchBar.value = fullAddress;
                        setDropdownVisible(false);
                        saveToHistory(fullAddress);
                        loadAddressOnMap(fullAddress);
                    }));
                }
            });
        }
        setDropdownVisible(true);
    } catch (error) {
        console.error("Błąd podpowiedzi:", error);
    }
}

let typingTimer;
let latestSuggestionQuery = '';
let currentMarker = null;

function setClearButtonVisible(visible) {
    clearInputBtn.classList.toggle('hidden', !visible);
}

searchBar.addEventListener('focus', () => {
    if (searchBar.value.trim() === '') renderHistory();
});

searchBar.addEventListener('input', () => {
    clearTimeout(typingTimer);
    const query = searchBar.value.trim();
    latestSuggestionQuery = query;
    
    setClearButtonVisible(searchBar.value.length > 0);
    
    if (query.length === 0) {
        renderHistory();
        return;
    }
    
    if (query.length < MIN_SEARCH_LENGTH) {
        setDropdownVisible(false);
        return;
    }

    typingTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, SUGGESTION_DELAY_MS);
});

// Czyszczenie pola po kliknięciu w X
clearInputBtn.addEventListener('click', () => {
    searchBar.value = '';
    latestSuggestionQuery = '';
    setClearButtonVisible(false);
    searchBar.focus(); 
    renderHistory();   

    if (currentMarker) {
        currentMarker.remove();
        currentMarker = null;
    }

    clearBuildingHighlight();
});

map.on('click', () => {
    setDropdownVisible(false);
    searchBar.blur();
});

// Nasłuchiwanie błędów ładowania mapy (np. brak limitu)
map.on('error', (e) => {
    if (e && e.error && e.error.status === 403) {
        limitAlert.classList.remove('hidden');
    }
});

// Przełącznik motywu
themeToggle.addEventListener('click', () => {
    const body = document.body;
    body.classList.toggle('dark-theme');
    const darkNow = body.classList.contains('dark-theme');
    
    // Zapis do localStorage
    localStorage.setItem('theme', darkNow ? 'dark' : 'light');
    updateThemeButton(darkNow);
    
    // Aktualizacja kolorów systemowych Safari / iOS
    syncSystemThemeColor(darkNow);
    
    // Zmiana warstwy kafelków w locie
    map.setStyle(darkNow ? ciemnyStyl : minimalistycznyStyl);
    map.once('style.load', () => {
        scheduleMapResize();
        initializeLiveConstructionRoads();
    });

    // Zmiana koloru aktywnego obrysu budynku w locie
    if (map.getSource('highlight-building')) {
        const { outlineColor, fillColor } = getHighlightColors(darkNow);
        
        if (map.getLayer('highlight-building-fill')) {
            map.setPaintProperty('highlight-building-fill', 'fill-color', fillColor);
        }
        if (map.getLayer('highlight-building-outline')) {
            map.setPaintProperty('highlight-building-outline', 'line-color', outlineColor);
        }
    }
});

// ==========================================================================
// OBSŁUGA NOWEGO PRZYCISKU GPS
// ==========================================================================
const customGpsBtn = document.getElementById('customGpsToggle');

if (customGpsBtn) {
    customGpsBtn.addEventListener('click', () => {
        // Ponieważ standardowa kontrolka jest ukryta w CSS, 
        // symulujemy kliknięcie na nią w JavaScript.
        const originalLocateBtn = document.querySelector('.maplibregl-ctrl-geolocate');
        if (originalLocateBtn) {
            originalLocateBtn.click();
        }
    });
}
