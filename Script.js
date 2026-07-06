const initialServicesDataset = [
    { id: 1, name: "City Central Clinic", type: "clinic", lat: -33.9249, lon: 18.4241, desc: "Free basic medical screening, children immunizations, and general healthcare checkups.", hours: "08:00 - 16:00" },
    { id: 2, name: "St. Jude Medical Wing", type: "clinic", lat: -33.9012, lon: 18.4110, desc: "Chronic disease management clinic and prescription drug pickup location.", hours: "07:30 - 15:30" },
    { id: 3, name: "Metropolitan Public Library", type: "library", lat: -33.9215, lon: 18.4210, desc: "Free computer terminal bookings, study tables, children's books, and open high-speed WiFi.", hours: "09:00 - 17:00" },
    { id: 4, name: "Hilltop Regional Library", type: "library", lat: -33.9550, lon: 18.4680, desc: "Community study spaces, printing & copying solutions, and educational seminars.", hours: "09:00 - 18:00" },
    { id: 5, name: "Hope Harbor Emergency Shelter", type: "shelter", lat: -33.9321, lon: 18.4025, desc: "Overnight short-term emergency beds, hot meal services, and professional housing counseling support.", hours: "24/7 Intake" },
    { id: 6, name: "Beacon Valley Safe Haven", type: "shelter", lat: -34.0250, lon: 18.6110, desc: "Crisis support housing system offering transitional living workshops for displaced individuals.", hours: "16:00 Open" },
    { id: 7, name: "Metro Digital Access Hub", type: "remote", lat: -33.9134, lon: 18.4300, desc: "Fast Wi-Fi, printer access, and quiet rooms for remote work, interviews, and online study sessions.", hours: "08:00 - 20:00" },
    { id: 8, name: "Harbor Study Lounge", type: "remote", lat: -33.9452, lon: 18.4550, desc: "Private booths, power outlets, and project rooms for freelancers, students, and home-based workers.", hours: "07:00 - 21:00" }
];

let publicServicesState = [];
let renderedMarkers = [];

const typeMeta = {
    clinic: { label: "Health Clinic", badgeClass: "badge-clinic" },
    library: { label: "Public Library", badgeClass: "badge-library" },
    shelter: { label: "Crisis Shelter", badgeClass: "badge-shelter" },
    remote: { label: "Work From Home", badgeClass: "badge-remote" }
};

function initializeDatabaseStore() {
    const preservedData = localStorage.getItem("local_finder_db");
    if (preservedData) {
        publicServicesState = JSON.parse(preservedData);
    } else {
        publicServicesState = [...initialServicesDataset];
        localStorage.setItem("local_finder_db", JSON.stringify(publicServicesState));
    }
}

const map = L.map("map", { zoomControl: false }).setView([-33.9249, 18.4250], 12);
L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);

map.on("click", function (e) {
    document.getElementById("fieldLat").value = e.latlng.lat.toFixed(6);
    document.getElementById("fieldLon").value = e.latlng.lng.toFixed(6);
    toggleSuggestionForm(true);
});

function filterMapLayers() {
    const selectedCategory = document.getElementById("serviceType").value;
    const searchKeyword = document.getElementById("mapSearch").value.trim().toLowerCase();

    renderedMarkers.forEach((marker) => map.removeLayer(marker));
    renderedMarkers = [];

    let activePinsCounter = 0;

    publicServicesState.forEach((service) => {
        const matchesCategory = selectedCategory === "all" || service.type === selectedCategory;
        const matchesSearch = service.name.toLowerCase().includes(searchKeyword) ||
            service.desc.toLowerCase().includes(searchKeyword);

        if (matchesCategory && matchesSearch) {
            activePinsCounter += 1;

            const customMarkerIcon = L.divIcon({
                className: `custom-marker-pin pin-${service.type}`,
                html: `<div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>`
            });

            const marker = L.marker([service.lat, service.lon], { icon: customMarkerIcon }).addTo(map);
            const meta = typeMeta[service.type] || { label: "Service", badgeClass: "badge-remote" };

            const popupHTML = `
                <div class="map-popup">
                    <span class="popup-badge ${meta.badgeClass}">${meta.label}</span>
                    <h3>${service.name}</h3>
                    <p>${service.desc}</p>
                    <p style="font-size: 11px; margin-top: 4px;">🕒 <b>Hours:</b> ${service.hours}</p>
                    <a class="directions-btn" href="https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lon}" target="_blank">Get Directions</a>
                </div>
            `;

            marker.bindPopup(popupHTML);
            renderedMarkers.push(marker);
        }
    });

    document.getElementById("activeCounter").textContent = activePinsCounter;
    document.getElementById("summaryCount").textContent = activePinsCounter;
}

function toggleSuggestionForm(open) {
    const targetModal = document.getElementById("suggestionModal");
    if (open) {
        targetModal.classList.add("active");
    } else {
        targetModal.classList.remove("active");
    }
}

function saveUserSuggestion(event) {
    event.preventDefault();

    const newlyCreatedServiceEntry = {
        id: Date.now(),
        name: document.getElementById("fieldName").value,
        type: document.getElementById("fieldServiceType").value,
        lat: parseFloat(document.getElementById("fieldLat").value),
        lon: parseFloat(document.getElementById("fieldLon").value),
        desc: document.getElementById("fieldDesc").value,
        hours: document.getElementById("fieldHours").value
    };

    publicServicesState.push(newlyCreatedServiceEntry);
    localStorage.setItem("local_finder_db", JSON.stringify(publicServicesState));

    filterMapLayers();
    toggleSuggestionForm(false);
    document.getElementById("submissionForm").reset();

    map.flyTo([newlyCreatedServiceEntry.lat, newlyCreatedServiceEntry.lon], 14);
}

document.getElementById("suggestionModal").addEventListener("click", function (event) {
    if (event.target.id === "suggestionModal") {
        toggleSuggestionForm(false);
    }
});

initializeDatabaseStore();
filterMapLayers();
setTimeout(() => map.invalidateSize(), 120);
