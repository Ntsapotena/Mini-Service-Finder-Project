# 📍 Nearby Services Finder - MVP

A powerful, interactive web application for discovering nearby public services (clinics, libraries, shelters, police stations) and work-from-home hubs. Built with Leaflet and designed for mobile and desktop use.

## ✨ Features

### Map & Navigation
- **Interactive Leaflet Map** – Explore services on an OpenStreetMap or Toner layer
- **Tile Switching** – Toggle between OSM and Stamen Toner map styles
- **Marker Clustering** – Automatically groups nearby markers with animated spiderfy on zoom
- **Heatmap Overlay** – Visualize service density with intensity gradient
- **Find Me** – Geolocation to center map on user's current location
- **Surprise Me** – Random service picker to discover new locations

### Search & Filtering
- **Smart Search** – Filter services by name or description in real-time
- **Category Filter** – View all services or filter by type (Clinic, Library, Shelter, Police, Remote)
- **Favorites** – Star services to keep a personal list
- **Favorites Filter** – Quick access to starred services
- **Voice Search** – Speak to search (powered by Web Speech API)

### Routing & Directions
- **OSRM Routing** – Turn-by-turn route planning from your location to any service
- **Route Summary** – Display distance (km) and estimated time (min)
- **Clear Route** – Remove route overlay from map
- **Google Maps Integration** – One-click directions link in each service popup

### Service Management
- **Suggest New Service** – Add new locations via modal form with geolocation support
- **Export Data** – Download all services as JSON for backup
- **Import Data** – Load custom service lists from JSON files
- **Persistent Storage** – All data stored in browser localStorage

### Interface & Accessibility
- **Dark Mode** – Toggle between light and dark themes with persistence
- **Mini Mode** – Compact sidebar view for maximized map space
- **Service List Panel** – View all filtered services in a scrollable card list
- **Legend** – Color-coded service types and heat intensity guide
- **Responsive Design** – Fully mobile-friendly UI
- **Popup Details** – Rich service information with hours, description, and action buttons

### Data & Admin
- **Statistics** – Live count of visible services and favorites
- **Local Mock Database** – Service data persisted in browser storage
- **Admin Portal** – Placeholder for Phase 2 authentication

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Map Engine:** Leaflet v1.9.4
- **Clustering:** Leaflet.markercluster v1.5.3
- **Heatmap:** Leaflet.heat
- **Routing:** OSRM (Open Source Routing Machine)
- **Speech:** Web Speech API (Chrome, Edge, Safari)
- **Storage:** Browser localStorage
- **Version Control:** Git

## 📦 Quick Start

### 1. Clone or Download
```bash
git clone <repo-url>
cd mini-service-finder
```

### 2. Run Locally
```bash
python -m http.server 8000
```
Or use any static server (Node, PHP, etc.)

### 3. Open in Browser
```
http://localhost:8000
```

### 4. Test Features
- **Search:** Type in the search box (e.g., "clinic", "library")
- **Locate:** Click "📍 Find Me" for geolocation
- **Voice:** Click "🎤 Voice Search" and speak a service type
- **Route:** Click a marker, then click "🗺️ Route" to see turn-by-turn directions
- **Toggle:** Enable "🧩 Clusters" and "🔥 Heatmap" to see density visualization
- **Mini:** Click "🧾 Mini Mode" to hide the sidebar

## 🎯 Success Criteria Met
✅ Interactive map with service markers  
✅ Real-time search and category filtering  
✅ Service details (name, hours, description)  
✅ Geolocation and "Find Me" feature  
✅ Service suggestions form with local storage  
✅ Dark mode & theme persistence  
✅ Favorites system  
✅ Marker clustering with animations  
✅ Heatmap visualization  
✅ OSRM routing with distance/time  
✅ Voice search support  
✅ Import/export JSON data  
✅ Mobile responsive design  
✅ Multiple tile layer support  
✅ Git version control  

## 📋 Service Categories
- 🏥 **Clinics** – Primary healthcare
- 📚 **Libraries** – Learning & resources
- 🏠 **Shelters** – Emergency assistance
- 🚓 **Police Stations** – Community safety
- 💻 **Work From Home Hubs** – Remote work spaces

## 🔐 Privacy & Storage
- All data stored locally in browser (localStorage)
- No data sent to external servers (except OSRM routing API)
- Favorites, theme, and service database persist across sessions

## 📅 Roadmap (Phase 2)
- User authentication (Firebase)
- Admin dashboard for suggestion review
- Real-time service availability status
- User ratings & reviews
- Advanced search filters (operating hours, ratings)
- Service notifications
- Offline mode with Service Workers

## 📝 License
MIT License – Feel free to use and modify.

## 👥 Contributing
To suggest features or report issues, please open a GitHub issue or submit a pull request.

---

**Built with ❤️ for community service discovery**
