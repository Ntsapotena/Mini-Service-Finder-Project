// Baseline database mimicking your whiteboard items (Clinics, Libraries, Shelters, Police)
const defaultServices = [
    { id: 1, name: "Cape Town Central Clinic", type: "clinic", lat: -33.9249, lon: 18.4241, desc: "Primary health consultations and family health services.", hours: "08:00 - 16:00" },
    { id: 2, name: "Central Library", type: "library", lat: -33.9215, lon: 18.4210, desc: "Public book tracking lanes, student workspace desks, and free high-speed WiFi setup zones.", hours: "09:00 - 17:00" },
    { id: 3, name: "Safe Haven Crisis Shelter", type: "shelter", lat: -33.9321, lon: 18.4025, desc: "Emergency short-term shelter, overnight intake, and warm food distribution lines.", hours: "24/7 Service" },
    { id: 4, name: "Central Police Station", type: "police", lat: -33.9220, lon: 18.4280, desc: "Community policing, emergency safety assistance response, and public certification handling.", hours: "24/7 Operations" }
];

let servicesDatabase = [];
let activeMarkers = [];

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

// Initialize Leaflet Map Engine centered on Cape Town
const map = L.map('map', { zoomControl: false }).setView([-33.9249, 18.4250], 13);
L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

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

    const selectedCategory = document.getElementById('serviceFilter').value;
    const searchString = document.getElementById('mapSearch').value.toLowerCase();

    servicesDatabase.forEach(item => {
        const categoryMatch = selectedCategory === 'all' || item.type === selectedCategory;
        const searchMatch = item.name.toLowerCase().includes(searchString) || item.desc.toLowerCase().includes(searchString);

        if (categoryMatch && searchMatch) {
            const marker = L.marker([item.lat, item.lon]).addTo(map);
            
            // Layout mapping details + dynamic routing links directly satisfying Requirement #3 and #6
            const contents = `
                <div class="map-popup">
                    <h3>${item.name}</h3>
                    <p>${item.desc}</p>
                    <p style="font-size:11px; font-weight:bold; color:#1e3a8a;">🕒 ${item.hours}</p>
                    <a class="directions-btn" href="https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}" target="_blank">Get Directions</a>
                </div>
            `;
            marker.bindPopup(contents);
            activeMarkers.push(marker);
        }
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

// Wire Event Handlers safely to components
document.getElementById('openModalBtn').addEventListener('click', () => toggleModalVisibility(true));
document.getElementById('closeModalBtn').addEventListener('click', () => toggleModalVisibility(false));
document.getElementById('submissionForm').addEventListener('submit', processNewSuggestion);
document.getElementById('serviceFilter').addEventListener('change', renderMapPoints);
document.getElementById('mapSearch').addEventListener('input', renderMapPoints);

// Startup Routine Trigger
loadServicesData();
renderMapPoints();