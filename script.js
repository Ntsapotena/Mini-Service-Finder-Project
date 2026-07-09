/* ===========================
   MOCK SERVICES DATA
   =========================== */
const SERVICES_DATA = [
  {
    id: 1,
    name: 'Lansdowne Community Clinic',
    category: 'clinic',
    lat: -33.9785,
    lng: 18.5020,
    address: '245 Main Street, Lansdowne, Cape Town',
    hours: '08:00 - 18:00 Mon-Fri',
  },
  {
    id: 2,
    name: 'Lansdowne Public Library',
    category: 'library',
    lat: -33.9805,
    lng: 18.4978,
    address: '108 Library Road, Lansdowne, Cape Town',
    hours: '09:00 - 17:00 Mon-Sat',
  },
  {
    id: 3,
    name: 'Lansdowne Emergency Shelter',
    category: 'shelter',
    lat: -33.9758,
    lng: 18.5052,
    address: '62 Shelter Lane, Lansdowne, Cape Town',
    hours: '24/7',
  },
  {
    id: 4,
    name: 'Lansdowne Police Station',
    category: 'police',
    lat: -33.9836,
    lng: 18.5081,
    address: '187 Police Avenue, Lansdowne, Cape Town',
    hours: '24/7',
  },
  {
    id: 5,
    name: 'Remote Health Services',
    category: 'remote',
    lat: -33.9797,
    lng: 18.5004,
    address: 'Online Service - Lansdowne Area',
    hours: '24/7 Online',
  },
];

const CATEGORY_COLORS = {
  clinic: '#ef4444',
  library: '#f97316',
  shelter: '#22c55e',
  police: '#3b82f6',
  remote: '#1e3a8a',
};

/* ===========================
   APPLICATION STATE
   =========================== */
let appState = {
  map: null,
  markers: [],
  currentFilter: 'all',
  favorites: [],
  darkMode: true,
  clustersEnabled: false,
  filteredServices: SERVICES_DATA,
  userLocation: null,
};

/* ===========================
   MAP INITIALIZATION (CRITICAL)
   =========================== */
function initializeMap() {
  // Leaflet map must target #map-frame
  appState.map = L.map('map-frame').setView([-33.9785, 18.5020], 13);

  // CartoDB Dark Matter tiles
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; OpenStreetMap contributors &copy; CartoDB',
      maxZoom: 19,
      minZoom: 10,
    }
  ).addTo(appState.map);

  loadMarkers();
  updateMetrics();
}

/* ===========================
   MARKERS
   =========================== */
function loadMarkers() {
  clearMarkers();

  appState.filteredServices.forEach((service) => {
    const marker = L.circleMarker([service.lat, service.lng], {
      radius: 9,
      fillColor: CATEGORY_COLORS[service.category] || '#2563eb',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    }).addTo(appState.map);

    marker.serviceData = service;

    marker.on('click', () => {
      marker.bindPopup(buildPopupContent(service), {
        maxWidth: 340,
      });
      marker.openPopup();
    });

    appState.markers.push(marker);
  });
}

function clearMarkers() {
  appState.markers.forEach((m) => {
    if (appState.map && m) appState.map.removeLayer(m);
  });
  appState.markers = [];
}

function buildPopupContent(service) {
  const isFavorited = appState.favorites.includes(service.id);
  const favoriteBtn = isFavorited ? '❤️' : '🤍';

  return `
    <div class="service-popup">
      <div class="popup-name">${service.name}</div>
      <div class="popup-address">
        <span class="popup-icon">📍</span>
        <span>${service.address}</span>
      </div>
      <div class="popup-hours">
        <span class="popup-icon">🕒</span>
        <span>${service.hours}</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:12px;">
        <button
          class="fav-btn"
          data-service-id="${service.id}"
          style="flex:1;padding:9px 10px;background:#172036;border:1px solid rgba(37,99,235,0.55);border-radius:10px;color:#fff;cursor:pointer;font-weight:800;"
        >
          ${favoriteBtn} Favorite
        </button>
      </div>
    </div>
  `;
}

/* ===========================
   FAVORITES
   =========================== */
function toggleFavorite(serviceId) {
  const index = appState.favorites.indexOf(serviceId);
  if (index > -1) appState.favorites.splice(index, 1);
  else appState.favorites.push(serviceId);
  updateMetrics();
}

/* ===========================
   FILTERING & METRICS
   =========================== */
function filterByCategory(category) {
  appState.currentFilter = category;
  if (category === 'all') appState.filteredServices = SERVICES_DATA;
  else appState.filteredServices = SERVICES_DATA.filter((s) => s.category === category);

  loadMarkers();
  updateMetrics();
}

function updateMetrics() {
  const visibleEl = document.getElementById('visible-count');
  const favEl = document.getElementById('favorites-count');
  if (visibleEl) visibleEl.textContent = appState.filteredServices.length;
  if (favEl) favEl.textContent = appState.favorites.length;
}

/* ===========================
   ACTION BUTTONS
   =========================== */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(37, 99, 235, 0.92);
    color: #fff;
    padding: 12px 22px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 14px;
    z-index: 10000;
    backdrop-filter: blur(12px);
    box-shadow: 0 14px 50px rgba(0,0,0,0.35);
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2200);
}

function findMyLocation() {
  if (!navigator.geolocation) {
    showNotification('Geolocation not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      appState.userLocation = { lat, lng };

      appState.map.setView([lat, lng], 14);

      L.circleMarker([lat, lng], {
        radius: 12,
        fillColor: '#2563eb',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      })
        .addTo(appState.map)
        .bindPopup('📍 Your Location', { maxWidth: 160 })
        .openPopup();

      showNotification('Location found!');
    },
    () => showNotification('Location access denied')
  );
}

function clearRoute() {
  // Reset map view and markers
  appState.map.setView([-33.9785, 18.5020], 13);
  loadMarkers();
  showNotification('Reset complete');
}

function surpriseMe() {
  if (!appState.filteredServices.length) return;
  const randomService = appState.filteredServices[Math.floor(Math.random() * appState.filteredServices.length)];

  appState.map.setView([randomService.lat, randomService.lng], 16);

  setTimeout(() => {
    const marker = appState.markers.find((m) => m.serviceData && m.serviceData.id === randomService.id);
    if (marker) marker.fire('click');
  }, 250);

  showNotification(`Surprised with ${randomService.name} 🎉`);
}

function toggleClusters() {
  // Placeholder (no markercluster dependency)
  appState.clustersEnabled = !appState.clustersEnabled;
  showNotification(appState.clustersEnabled ? 'Clusters enabled (demo)' : 'Clusters disabled (demo)');
}

function toggleDarkMode() {
  appState.darkMode = !appState.darkMode;
  document.documentElement.style.colorScheme = appState.darkMode ? 'dark' : 'light';
  showNotification(appState.darkMode ? 'Dark mode enabled' : 'Light mode enabled');
}

/* ===========================
   NEAREST CLINIC DIRECTIONS
   =========================== */
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function openDirectionsInOSM(originLat, originLng, destLat, destLng) {
  // Uses OpenStreetMap route planning (not Google).
  // Note: query parameters are based on OSRM/OSM routing links.
  const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${encodeURIComponent(
    `${originLat},${originLng};${destLat},${destLng}`
  )}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}


function findNearestClinicDirections() {
  if (!appState.userLocation) {
    showNotification('Click "Find Me" first to get your location');
    return;
  }

  const { lat: userLat, lng: userLng } = appState.userLocation;

  const clinics = SERVICES_DATA.filter((s) => s.category === 'clinic');
  if (!clinics.length) {
    showNotification('No clinics available');
    return;
  }

  let nearest = null;
  let nearestKm = Infinity;

  for (const clinic of clinics) {
    const km = haversineDistanceKm(userLat, userLng, clinic.lat, clinic.lng);
    if (km < nearestKm) {
      nearestKm = km;
      nearest = clinic;
    }
  }

  if (!nearest) return;

  // Pan/zoom map to the nearest clinic
  appState.map.setView([nearest.lat, nearest.lng], 16);

  // Open directions (OSM)
  openDirectionsInOSM(userLat, userLng, nearest.lat, nearest.lng);


  showNotification(`Nearest clinic: ${nearest.name} (~${nearestKm.toFixed(1)} km) 🏥`);
}


/* ===========================
   EVENTS
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  initializeMap();

  const filterEl = document.getElementById('category-filter');
  if (filterEl) {
    filterEl.addEventListener('change', (e) => filterByCategory(e.target.value));
  }

  const findBtn = document.getElementById('find-me-btn');
  const clearBtn = document.getElementById('clear-route-btn');
  const surpriseBtn = document.getElementById('surprise-me-btn');
  const clustersBtn = document.getElementById('toggle-clusters-btn');
  const darkBtn = document.getElementById('dark-mode-btn');
  const nearestClinicBtn = document.getElementById('nearest-clinic-btn');

  if (findBtn) findBtn.addEventListener('click', findMyLocation);
  if (clearBtn) clearBtn.addEventListener('click', clearRoute);
  if (surpriseBtn) surpriseBtn.addEventListener('click', surpriseMe);
  if (clustersBtn) clustersBtn.addEventListener('click', toggleClusters);
  if (darkBtn) darkBtn.addEventListener('click', toggleDarkMode);
  if (nearestClinicBtn) nearestClinicBtn.addEventListener('click', findNearestClinicDirections);


  // Favorite button delegation inside popups
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.fav-btn') : null;
    if (!btn) return;

    const id = Number(btn.getAttribute('data-service-id'));
    if (!Number.isFinite(id)) return;

    e.stopPropagation();
    toggleFavorite(id);

    // Re-render popup content to update heart
    // Find marker by service id
    const marker = appState.markers.find((m) => m.serviceData && m.serviceData.id === id);
    if (marker) {
      marker.bindPopup(buildPopupContent(marker.serviceData), { maxWidth: 340 });
      marker.openPopup();
    }
  });

  // Keep legacy navbar behavior (demo)
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const view = btn.dataset.view;
      if (view === 'admin-portal') showNotification('Admin portal would open here (demo)');
    });
  });
});

