# Free Service Finder

A comprehensive web application that helps users locate nearby public services using interactive maps. Includes authentication, service suggestions, and admin panel for service management.

## ✨ Features

### Phase 1 - Core Service Finder
- Interactive map with Leaflet and OpenStreetMap tiles
- Location search with Nominatim geocoding
- Free service search using Overpass API (hospitals, pharmacies, restaurants, cafes, banks, fuel stations, supermarkets, post offices, libraries, police)
- Color-coded markers by service type for easy identification
- Service details display (name, address, phone, operating hours, distance)
- Responsive design for mobile and desktop
- Service worker for offline caching of app assets

### Phase 2 - User Features
- **User Authentication**: Sign up and login system with localStorage
- **Service Suggestions**: Logged-in users can suggest new services
- **Admin Panel**: Administrators can review, approve, or reject service suggestions
- **User Management**: Track who suggested services and when

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Enter a location or use current geolocation
3. Select service type and radius
4. Click "Search services"
5. Click the user button (👤) to access authentication features

## 👥 Demo Credentials

**Admin Account:**
- Email: `admin@servicefinder.com`
- Password: `admin123`

**Demo User Account:**
- Email: `demo@example.com`
- Password: `demo123`

## 📱 How to Use Each Feature

### Search for Services
1. Enter a location or click "Use my location"
2. Select a service type from the dropdown
3. Adjust the search radius with the slider
4. Click "Search services"
5. Click any result to center it on the map

### Suggest a Service (Logged-in Users)
1. Click the user button (👤)
2. Click "Suggest a Service"
3. Fill in service details
4. Submit the form
5. Admin will review and approve/reject

### Admin Panel (Admin Users Only)
1. Login with admin credentials
2. Click the user button (👤)
3. Click "Admin Panel"
4. Review pending suggestions
5. Approve or reject each suggestion

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Maps**: Leaflet.js + OpenStreetMap
- **Geocoding**: Nominatim API
- **Service Data**: Overpass API
- **Database**: LocalStorage (mock database for Phase 2)
- **Authentication**: Local user system

## 📝 Notes

- This project uses free OpenStreetMap services. No API key required.
- Overpass and Nominatim are public endpoints; use responsibly.
- Phase 2 uses localStorage (client-side storage); data is not persisted across different devices.
- For production: Consider using Firebase or a dedicated backend server.
- Mobile responsive and works on all modern browsers.

## 🔧 Future Enhancements

- Firebase integration for real database and authentication
- Google Maps API integration
- Mobile app version
- Real-time notifications for approved suggestions
- Service ratings and reviews
- Advanced filtering and sorting options

## 📄 License

Free to use and modify for educational purposes.
