// Baseline database mimicking your whiteboard items (Clinics, Libraries, Shelters, Police)
const defaultServices = [
    { id: 1, name: "Cape Town Central Clinic", type: "clinic", lat: -33.9249, lon: 18.4241, desc: "Primary health consultations and family health services.", hours: "08:00 - 16:00" },
    { id: 2, name: "Central Library", type: "library", lat: -33.9215, lon: 18.4210, desc: "Public book tracking lanes, student workspace desks, and free high-speed WiFi setup zones.", hours: "09:00 - 17:00" },
    { id: 3, name: "Safe Haven Crisis Shelter", type: "shelter", lat: -33.9321, lon: 18.4025, desc: "Emergency short-term shelter, overnight intake, and warm food distribution lines.", hours: "24/7 Service" },
    { id: 4, name: "Central Police Station", type: "police", lat: -33.9220, lon: 18.4280, desc: "Community policing, emergency safety assistance response, and public certification handling.", hours: "24/7 Operations" },
    { id: 5, name: "City Remote Access Hub", type: "remote", lat: -33.9190, lon: 18.4255, desc: "Quiet shared workspace with reliable internet for job applications, online meetings, and remote learning.", hours: "07:00 - 21:00" },
    { id: 6, name: "Harbor Digital Lounge", type: "remote", lat: -33.9350, lon: 18.4380, desc: "Free fast Wi-Fi, printing stations, and study-friendly rooms built for home office and interview prep.", hours: "08:00 - 20:00" }
];

let servicesDatabase = [];
let activeMarkers = [];
let favorites = [];
let userLocation = null;
const favoriteStorageKey = 'board_mvp_favorites';
const serviceTypeMeta = {
    clinic: { label: 'Clinic', marker: 'clinic', tag: 'tag-clinic' },
    library: { label: 'Library', marker: 'library', tag: 'tag-library' },
    shelter: { label: 'Shelter', marker: 'shelter', tag: 'tag-shelter' },
    police: { label: 'Police', marker: 'police', tag: 'tag-police' },
    remote: { label: 'Work From Home', marker: 'remote', tag: 'tag-remote' }
};

// Initialize Local Mock DB Data Storage (Stands in for Firebase in our MVP Mini Build)
function loadServicesData() {
    const cached = localStorage.getItem('board_mvp_services');
    if (cached) {
        servicesDatabase = JSON.parse(cached);
    } else {
        servicesDatabase = [...defaultServices];
        localStorage.setItem('board_mvp_services', JSON.stringify(servicesDatabase));
    }
}

function loadFavorites() {
    const cached = localStorage.getItem(favoriteStorageKey);
    if (cached) {
        favorites = JSON.parse(cached);
    } else {
        favorites = [];
    }
}

function saveFavorites() {
    localStorage.setItem(favoriteStorageKey, JSON.stringify(favorites));
}

function isFavorite(serviceId) {
    return favorites.includes(serviceId);
}

function toggleFavorite(serviceId) {
    const index = favorites.indexOf(serviceId);
    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.push(serviceId);
    }
    saveFavorites();
    renderMapPoints();
}

// Initialize Leaflet Map Engine centered on Cape Town
const map = L.map('map', { zoomControl: false }).setView([-33.9249, 18.4250], 13);
L.control.zoom({ position: 'bottomright' }).addTo(map);

const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const tonerLayer = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap contributors'
});

let currentTileLayer = osmLayer;
currentTileLayer.addTo(map);
// Clustering + heatmap support
const clusterGroup = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    animate: true,
    disableClusteringAtZoom: 18,
    maxClusterRadius: 80,
    iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        const c = ' marker-cluster-';
        if (count < 10) return L.divIcon({ html: '<div><span>' + count + '</span></div>', className: 'marker-cluster' + c + 'small', iconSize: L.point(40, 40) });
        if (count < 100) return L.divIcon({ html: '<div><span>' + count + '</span></div>', className: 'marker-cluster' + c + 'medium', iconSize: L.point(50, 50) });
        return L.divIcon({ html: '<div><span>' + count + '</span></div>', className: 'marker-cluster' + c + 'large', iconSize: L.point(60, 60) });
    }
});
let clusterEnabled = true;
let heatLayer = null;
let heatEnabled = false;
let currentRouteLayer = null;
let recognition = null;
let recognitionActive = false;

function switchTileSource(source) {
    map.removeLayer(currentTileLayer);
    currentTileLayer = source === 'toner' ? tonerLayer : osmLayer;
    currentTileLayer.addTo(map);
}

// Auto-populate coordinates into form when a user clicks anywhere on the map
map.on('click', function(e) {
    document.getElementById('fieldLat').value = e.latlng.lat.toFixed(6);
    document.getElementById('fieldLon').value = e.latlng.lng.toFixed(6);
    toggleModalVisibility(true);
});

// Render Markers with Filters and Search Keywords Applied
function renderMapPoints() {
    activeMarkers.forEach(m => map.removeLayer(m));
    activeMarkers = [];
    // clear cluster group when present
    if (clusterGroup) clusterGroup.clearLayers();

    const selectedCategory = document.getElementById('serviceFilter').value;
    const searchString = document.getElementById('mapSearch').value.toLowerCase();
    const visibleServices = [];

    servicesDatabase.forEach(item => {
        const favoriteMatch = selectedCategory === 'favorites' ? favorites.includes(item.id) : true;
        const categoryMatch = selectedCategory === 'all' || item.type === selectedCategory;
        const searchMatch = item.name.toLowerCase().includes(searchString) || item.desc.toLowerCase().includes(searchString);

        if (favoriteMatch && categoryMatch && searchMatch) {
            visibleServices.push(item);
            const meta = serviceTypeMeta[item.type] || serviceTypeMeta.remote;
            const icon = L.divIcon({
                className: `custom-marker ${meta.marker}`,
                html: `<div class="marker-core"></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28]
            });
            const marker = L.marker([item.lat, item.lon], { icon });
            if (clusterEnabled) {
                clusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }
            const favoriteText = isFavorite(item.id) ? '★ Remove' : '☆ Favorite';
            const contents = `
                <div class="map-popup">
                    <span class="service-tag ${meta.tag}">${meta.label}</span>
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                    <p style="font-size:11px; font-weight:bold; color:#1e3a8a;">🕒 ${item.hours}</p>
                    <a class="directions-btn" href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}" target="_blank">Get Directions</a>
                    <button class="popup-route-btn" onclick="routeToService(${item.lat}, ${item.lon})">🗺️ Route</button>
                    <button class="popup-fav-btn" onclick="toggleFavorite(${item.id})">${favoriteText}</button>
                </div>
            `;
            marker.bindPopup(contents);
            activeMarkers.push(marker);
        }
    });

    // If clustering enabled, ensure group is on the map
    if (clusterEnabled) {
        if (!map.hasLayer(clusterGroup)) map.addLayer(clusterGroup);
    } else {
        if (map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup);
    }

    // Heatmap update: gather visible points
    if (heatLayer) { map.removeLayer(heatLayer); heatLayer = null; }
    if (heatEnabled && visibleServices.length) {
        const heatPoints = visibleServices.map(s => [s.lat, s.lon, 0.6]);
        heatLayer = L.heatLayer(heatPoints, { radius: 25, blur: 18, maxZoom: 17 }).addTo(map);
    }

    updateSummary(visibleServices.length);
    renderServiceList(visibleServices);
    setTimeout(() => map.invalidateSize(), 300);
}

function routeToService(lat, lon) {
    const originLon = userLocation ? userLocation.lon : map.getCenter().lng;
    const originLat = userLocation ? userLocation.lat : map.getCenter().lat;
    const url = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${lon},${lat}?overview=full&geometries=geojson`;
    fetch(url).then(r => r.json()).then(data => {
        if (!data.routes || !data.routes.length) return alert('No route found.');
        const routeGeo = data.routes[0].geometry;
        const dist = data.routes[0].distance;
        const dur = data.routes[0].duration;
        if (currentRouteLayer) map.removeLayer(currentRouteLayer);
        currentRouteLayer = L.geoJSON(routeGeo, { style: { color: '#2563eb', weight: 5, opacity: 0.9 } }).addTo(map);
        const bounds = currentRouteLayer.getBounds();
        map.fitBounds(bounds.pad(0.2));
        // show summary
        const km = (dist / 1000).toFixed(1);
        const mins = Math.round(dur / 60);
        const summaryEl = document.getElementById('routeSummary');
        if (summaryEl) { summaryEl.textContent = `${km} km · ${mins} min`; document.getElementById('routeInfo').style.display = 'flex'; }
    }).catch(err => alert('Routing failed: ' + err.message));
}

function clearRoute() {
    if (currentRouteLayer) { map.removeLayer(currentRouteLayer); currentRouteLayer = null; }
    const ri = document.getElementById('routeInfo');
    if (ri) ri.style.display = 'none';
}

function toggleMiniMode() {
    document.body.classList.toggle('mini');
    setTimeout(() => map.invalidateSize(), 300);
}

function startVoiceSearch() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition not available in this browser.');
        return;
    }
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!recognition) {
        recognition = new SpeechRec();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (e) => {
            const text = e.results[0][0].transcript;
            document.getElementById('mapSearch').value = text;
            renderMapPoints();
        };
        recognition.onend = () => { recognitionActive = false; document.querySelectorAll('.secondary-btn').forEach(b => b.disabled = false); };
    }
    if (!recognitionActive) {
        recognition.start(); recognitionActive = true;
        document.querySelectorAll('.secondary-btn').forEach(b => b.disabled = true);
    } else {
        recognition.stop(); recognitionActive = false;
    }
}

function toggleClusters() {
    clusterEnabled = !clusterEnabled;
    localStorage.setItem('nearbyservices_clusters', clusterEnabled ? '1' : '0');
    renderMapPoints();
    updateClusterButton();
    document.querySelectorAll('.tile-btn').forEach(b => b.blur());
}

function toggleHeat() {
    heatEnabled = !heatEnabled;
    localStorage.setItem('nearbyservices_heat', heatEnabled ? '1' : '0');
    renderMapPoints();
    updateHeatButton();
}

function updateClusterButton() {
    const btn = document.querySelector('[onclick="toggleClusters()"]');
    if (btn) btn.textContent = (clusterEnabled ? '🧩 Clusters: On' : '🧩 Toggle Clusters');
}

function updateHeatButton() {
    const btn = document.querySelector('[onclick="toggleHeat()"]');
    if (btn) btn.textContent = (heatEnabled ? '🔥 Heat: On' : '🔥 Toggle Heatmap');
    const heatLegend = document.getElementById('heatLegendCard');
    if (heatLegend) heatLegend.style.display = heatEnabled ? 'block' : 'none';
}

function exportData() {
    const data = JSON.stringify(servicesDatabase, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'services-export.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importDataFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (Array.isArray(parsed)) {
                // merge, avoid ID clashes by generating new ids if necessary
                parsed.forEach(p => {
                    if (!p.id) p.id = Date.now() + Math.floor(Math.random() * 9999);
                    servicesDatabase.push(p);
                });
                localStorage.setItem('board_mvp_services', JSON.stringify(servicesDatabase));
                renderMapPoints();
                alert('Imported ' + parsed.length + ' services.');
            } else {
                alert('Invalid file format: expected an array of services');
            }
        } catch (err) { alert('Failed to import: ' + err.message); }
    };
    reader.readAsText(file);
}

function updateSummary(visibleCount) {
    document.getElementById('visibleCount').textContent = visibleCount;
    document.getElementById('favoriteCount').textContent = favorites.length;
}

function renderServiceList(serviceItems) {
    const container = document.getElementById('serviceListItems');
    container.innerHTML = '';

    if (serviceItems.length === 0) {
        container.innerHTML = '<div class="service-card"><strong>No services found</strong><span>Try changing the filter or search term.</span></div>';
        return;
    }

    serviceItems.forEach(item => {
        const meta = serviceTypeMeta[item.type] || serviceTypeMeta.remote;
        const distanceLabel = userLocation ? ` · ${getDistance(item).toFixed(1)} km away` : '';
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <strong>${item.name}</strong>
            <span class="service-tag ${meta.tag}">${meta.label}</span>
            <span>${item.desc}${distanceLabel}</span>
        `;
        card.addEventListener('click', () => {
            map.flyTo([item.lat, item.lon], 14);
            const marker = activeMarkers.find(m => {
                const latLng = m.getLatLng();
                return latLng.lat === item.lat && latLng.lng === item.lon;
            });
            if (marker) marker.openPopup();
        });
        container.appendChild(card);
    });
}

// Modal Interactivity Toggle Functions
function toggleModalVisibility(show) {
    document.getElementById('suggestionModal').style.display = show ? 'flex' : 'none';
}

// Save suggested pins inside the live local dataset array runtime
function processNewSuggestion(e) {
    e.preventDefault();

    const entry = {
        id: Date.now(),
        name: document.getElementById('fieldName').value,
        type: document.getElementById('fieldCategory').value,
        lat: parseFloat(document.getElementById('fieldLat').value),
        lon: parseFloat(document.getElementById('fieldLon').value),
        desc: document.getElementById('fieldDesc').value,
        hours: document.getElementById('fieldHours').value
    };

    servicesDatabase.push(entry);
    localStorage.setItem('board_mvp_services', JSON.stringify(servicesDatabase));

    renderMapPoints();
    toggleModalVisibility(false);
    document.getElementById('submissionForm').reset();
    
    map.flyTo([entry.lat, entry.lon], 14);
}

function loadTheme() {
    const saved = localStorage.getItem('nearbyservices_theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('toggleThemeBtn').textContent = '☀️ Light Mode';
    }
}

function getDistance(service) {
    const R = 6371;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(service.lat - userLocation.lat);
    const dLon = toRad(service.lon - userLocation.lon);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(userLocation.lat)) * Math.cos(toRad(service.lat)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toggleTheme() {
    const button = document.getElementById('toggleThemeBtn');
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('nearbyservices_theme', isDark ? 'dark' : 'light');
    button.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function toggleServiceList() {
    const panel = document.getElementById('serviceListPanel');
    const btn = document.getElementById('toggleListBtn');
    const hidden = panel.classList.toggle('collapsed');
    btn.textContent = hidden ? 'Show' : 'Hide';
    if (!hidden) setTimeout(() => map.invalidateSize(), 300);
}

function locateUser() {
    if (!navigator.geolocation) {
        alert('Geolocation is not available in your browser.');
        return;
    }
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        userLocation = { lat: latitude, lon: longitude };
        map.flyTo([latitude, longitude], 14);
        renderMapPoints();
    }, () => {
        alert('Unable to retrieve your location. Please allow location access.');
    });
}

function pickRandomService() {
    const selectedCategory = document.getElementById('serviceFilter').value;
    const searchString = document.getElementById('mapSearch').value.toLowerCase();
    const matching = servicesDatabase.filter(item => {
        const categoryMatch = selectedCategory === 'all' || item.type === selectedCategory;
        const searchMatch = item.name.toLowerCase().includes(searchString) || item.desc.toLowerCase().includes(searchString);
        return categoryMatch && searchMatch;
    });

    if (!matching.length) {
        alert('No matching services available for a random pick.');
        return;
    }

    const randomItem = matching[Math.floor(Math.random() * matching.length)];
    map.flyTo([randomItem.lat, randomItem.lon], 14);
    setTimeout(() => {
        const marker = activeMarkers.find(m => {
            const latLng = m.getLatLng();
            return latLng.lat === randomItem.lat && latLng.lng === randomItem.lon;
        });
        if (marker) marker.openPopup();
    }, 600);
}

// Wire Event Handlers safely to components
document.getElementById('openModalBtn').addEventListener('click', () => toggleModalVisibility(true));
document.getElementById('closeModalBtn').addEventListener('click', () => toggleModalVisibility(false));
document.getElementById('submissionForm').addEventListener('submit', processNewSuggestion);
document.getElementById('serviceFilter').addEventListener('change', renderMapPoints);
document.getElementById('mapSearch').addEventListener('input', renderMapPoints);
document.getElementById('toggleThemeBtn').addEventListener('click', toggleTheme);
document.getElementById('toggleListBtn').addEventListener('click', toggleServiceList);
document.querySelectorAll('.tile-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        switchTileSource(this.dataset.source);
    });
});

// Startup Routine Trigger
loadServicesData();
loadFavorites();
loadTheme();
// load saved cluster/heat prefs
const savedClusters = localStorage.getItem('nearbyservices_clusters');
if (savedClusters !== null) clusterEnabled = savedClusters === '1';
const savedHeat = localStorage.getItem('nearbyservices_heat');
if (savedHeat !== null) heatEnabled = savedHeat === '1';
renderMapPoints();
setTimeout(() => map.invalidateSize(), 300);
// update UI buttons
setTimeout(() => { updateClusterButton(); updateHeatButton(); }, 400);
// wire clearRouteBtn if present
const clearRouteBtn = document.getElementById('clearRouteBtn');
if (clearRouteBtn) { clearRouteBtn.addEventListener('click', clearRoute); }
// Import file input listener
const importInput = document.getElementById('importFile');
if (importInput) {
    importInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) importDataFile(f);
        importInput.value = '';
    });
}
