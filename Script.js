const locationInput = document.getElementById('location');
const useLocationBtn = document.getElementById('use-location');
const categorySelect = document.getElementById('category');
const radiusInput = document.getElementById('radius');
const radiusValue = document.getElementById('radius-value');
const searchBtn = document.getElementById('search-btn');
const resetBtn = document.getElementById('reset-btn');
const statusEl = document.getElementById('status');
const resultList = document.getElementById('result-list');
const resultCount = document.getElementById('result-count');

let currentCenter = null;
let markersLayer = L.layerGroup();

const map = L.map('map', {
  zoomControl: true,
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

markersLayer.addTo(map);
updateRadiusValue();

radiusInput.addEventListener('input', updateRadiusValue);
searchBtn.addEventListener('click', performSearch);
resetBtn.addEventListener('click', resetMap);
useLocationBtn.addEventListener('click', useCurrentLocation);

function updateRadiusValue() {
  radiusValue.textContent = radiusInput.value;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? 'status error' : 'status';
}

function clearResults() {
  resultList.innerHTML = '';
  markersLayer.clearLayers();
}

function resetMap() {
  map.setView([20, 0], 2);
  currentCenter = null;
  clearResults();
  resultCount.textContent = 'No results yet.';
  setStatus('Enter a location or use your current position to begin.');
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported in this browser.', true);
    return;
  }

  setStatus('Locating your position…');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      currentCenter = { lat: latitude, lon: longitude };
      map.setView([latitude, longitude], 14);
      addCenterMarker(latitude, longitude, 'Your location');
      setStatus('Location found. Search for services nearby.');
    },
    () => setStatus('Unable to retrieve your location.', true),
    { enableHighAccuracy: true, timeout: 15000 }
  );
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'free-service-finder/1.0',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding service error');
  }

  const results = await response.json();
  if (!results.length) {
    throw new Error('Address not found');
  }

  return {
    lat: parseFloat(results[0].lat),
    lon: parseFloat(results[0].lon),
    label: results[0].display_name,
  };
}

async function performSearch() {
  const locationText = locationInput.value.trim();
  const radius = parseInt(radiusInput.value, 10);
  const category = categorySelect.value;

  try {
    if (!currentCenter) {
      if (!locationText) {
        setStatus('Please enter a location or use current location first.', true);
        return;
      }

      setStatus('Geocoding location…');
      currentCenter = await geocode(locationText);
      map.setView([currentCenter.lat, currentCenter.lon], 14);
      addCenterMarker(currentCenter.lat, currentCenter.lon, currentCenter.label);
    }

    setStatus('Searching for nearby services…');
    const places = await searchNearby(currentCenter.lat, currentCenter.lon, radius, category);
    renderPlaces(places);
  } catch (error) {
    setStatus(error.message || 'Search failed. Try again.', true);
  }
}

function addCenterMarker(lat, lon, label) {
  const marker = L.circleMarker([lat, lon], {
    radius: 8,
    color: '#1d4ed8',
    fillColor: '#93c5fd',
    fillOpacity: 0.9,
  }).addTo(markersLayer);

  marker.bindPopup(label).openPopup();
}

async function searchNearby(lat, lon, radius, category) {
  const filter = category === 'all' ? '["amenity"]' : `["amenity"="${category}"]`;
  const query = `
[out:json][timeout:20];
(
  node${filter}(around:${radius},${lat},${lon});
  way${filter}(around:${radius},${lat},${lon});
  relation${filter}(around:${radius},${lat},${lon});
);
out center;`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
  });

  if (!response.ok) {
    throw new Error('Overpass API returned an error. Please try again later.');
  }

  const data = await response.json();
  return data.elements || [];
}

function renderPlaces(elements) {
  // Instead of immediately rendering the list, store results in Vue state.
  // Vue will expose filteredServices (computed) based on searchQuery + selectedCategory.
  const app = window.__serviceFinderApp;

  // Ensure list re-renders on reactive filter changes.
  if (!window.__serviceFinderFilterHooked) {
    window.__serviceFinderFilterHooked = true;
    window.addEventListener('filtered-services-updated', () => {
      const currentApp = window.__serviceFinderApp;
      if (currentApp) {
        renderFilteredList(currentApp.filteredServices);
      }
    });
  }


  // Keep markers rendered for all returned services (phase-1 behavior)
  // but update result list based on Vue computed filtering.
  clearResults();

  if (!elements || !elements.length) {
    resultCount.textContent = 'No services found in this area.';
    setStatus('Try increasing the radius or switching service type.');
    if (app) app.setServices([]);
    return;
  }

  const bounds = [];

  elements.forEach((element) => {
    const coords = element.type === 'node'
      ? [element.lat, element.lon]
      : [element.center?.lat, element.center?.lon];

    if (!coords[0] || !coords[1]) return;

    bounds.push(coords);

    const name = element.tags?.name || 'Unnamed place';
    const amenity = element.tags?.amenity || 'Service';
    const address =
      element.tags?.['addr:street'] || element.tags?.['addr:housenumber'] || '';
    const phone = element.tags?.phone || '';
    const hours = element.tags?.opening_hours || '';

    const markerColor = getMarkerColor(amenity);
    const marker = L.circleMarker(coords, {
      radius: 7,
      fillColor: markerColor,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85,
    }).addTo(markersLayer);

    const distance = estimateDistance(coords[0], coords[1], currentCenter.lat, currentCenter.lon);
    let popupContent = `<strong>${name}</strong><br><em>${amenity.replace('_', ' ')}</em>`;
    if (address) popupContent += `<br>📍 ${address}`;
    if (phone) popupContent += `<br>☎ ${phone}`;
    if (distance) popupContent += `<br>📏 ${distance}m away`;

    marker.bindPopup(popupContent);

    // Attach minimal metadata to marker for list actions.
    marker.__serviceData = {
      element,
      coords,
      name,
      amenity,
      address,
      phone,
      hours,
      distance,
      marker,
    };
  });

  // Fit bounds based on all returned elements.
  if (bounds.length) {
    map.fitBounds(bounds, { padding: [70, 70] });
  }

  // Normalize services so Vue can filter using amenityKey.
  const normalized = elements.map((el) => {
    const type = el.type;
    const coords = type === 'node'
      ? { lat: el.lat, lon: el.lon }
      : { lat: el.center?.lat, lon: el.center?.lon };

    return {
      type,
      lat: coords.lat,
      lon: coords.lon,
      name: el.tags?.name || 'Unnamed place',
      amenityKey: el.tags?.amenity || '',
      amenity: el.tags?.amenity || 'Service',
      address: el.tags?.['addr:street'] || el.tags?.['addr:housenumber'] || '',
      phone: el.tags?.phone || '',
      hours: el.tags?.opening_hours || '',
      element: el,
    };
  });

  if (app) {
    app.setServices(normalized);

    // Render list immediately for the initial computed value.
    renderFilteredList(app.filteredServices);
  }

  setStatus('Search complete. Click a result to center it on the map.');
}

function renderFilteredList(filtered) {
  clearListOnly();

  const items = filtered || [];
  resultCount.textContent = items.length
    ? `${items.length} result${items.length === 1 ? '' : 's'} found.`
    : 'No services found in this area.';

  items.forEach((s) => {
    const coords = [s.lat, s.lon];
    if (!coords[0] || !coords[1]) return;

    const name = s.name || 'Unnamed place';
    const amenity = s.amenity || 'Service';
    const address = s.address || '';
    const phone = s.phone || '';
    const hours = s.hours || '';

    const distance = estimateDistance(coords[0], coords[1], currentCenter.lat, currentCenter.lon);

    const item = document.createElement('li');
    item.className = 'result-item';
    item.innerHTML = `
      <div class="result-header">
        <strong>${name}</strong>
        <span class="result-distance">${distance}m</span>
      </div>
      <div class="result-type">${amenity.replace('_', ' ')}</div>
      ${address ? `<div class="result-address">📍 ${address}</div>` : ''}
      ${phone ? `<div class="result-phone">☎ ${phone}</div>` : ''}
      ${hours ? `<div class="result-hours">🕐 ${hours}</div>` : ''}
    `;

    item.addEventListener('click', () => {
      map.setView(coords, 16);

      // Try to find matching marker and open popup.
      markersLayer.eachLayer((layer) => {
        if (layer?.__serviceData?.coords) {
          const cd = layer.__serviceData.coords;
          if (cd[0] === coords[0] && cd[1] === coords[1]) {
            layer.openPopup?.();
          }
        }
      });
    });

    resultList.appendChild(item);
  });
}

function clearListOnly() {
  // Keep existing markers; only update the list.
  resultList.innerHTML = '';
}


function estimateDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function getMarkerColor(amenity) {
  const colors = {
    pharmacy: '#ef4444',
    hospital: '#dc2626',
    restaurant: '#f97316',
    cafe: '#eab308',
    bank: '#3b82f6',
    fuel: '#6b21a8',
    supermarket: '#10b981',
    post_office: '#8b5cf6',
    library: '#06b6d4',
    police: '#0ea5e9',
  };
  return colors[amenity] || '#6366f1';
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {
    console.warn('Service worker registration failed.');
  });
}
