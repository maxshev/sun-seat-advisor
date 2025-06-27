# SunSeat Advisor

A smart web application for choosing the best bus seat based on sunlight exposure analysis during your trip.

## 📸 Screenshots

### Route Planning Interface
![Route Planning Interface](./screenshots/route-planning.png)
*Enter your route details and travel time to get started*

### Seat Recommendations & Results
![Seat Recommendations](./screenshots/seat-recommendations.png)
*Get intelligent seat recommendations based on sun exposure analysis*

## 🌟 Key Features

- **Smart Seat Recommendations** - intelligent advice on which side of the bus to choose
- **Route Building** - automatic construction of optimal routes between points
- **Address Autocomplete** - address search using OpenStreetMap Nominatim API
- **Interactive Map** - drag markers to change routes
- **Sunlight Exposure Analysis** - detailed calculation of sun exposure for each side of the bus
- **Visual Seat Layout** - bus diagram with dynamic highlighting based on exposure levels
- **Real-time Calculations** - instant updates when route changes

## 🛠 Technologies

- **React 18** - main framework
- **Vite** - bundler and dev server
- **Material-UI (MUI)** - UI components
- **Leaflet** - interactive maps
- **SunCalc** - sun position calculation
- **OSRM API** - route building
- **Nominatim API** - address geocoding

## 🚀 Installation and Setup

### Prerequisites

- Node.js version 16 or higher
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd bus-route-planner
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:5173
```

### Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📖 How to Use

### 1. Route Planning

1. **Enter starting point** in the "From" field
   - Start typing an address
   - Select the appropriate option from the dropdown

2. **Enter destination** in the "To" field
   - Similar to the starting point

3. **Add intermediate stop** (optional)
   - Use the "Via" field to add an intermediate point

4. **Select trip date and time**
   - Date: choose the day of travel
   - Time: specify departure time (24-hour format)

5. **Click "Build Route"**
   - The app will build the route and calculate sun exposure

### 2. Working with the Map

- **Drag markers**: Click and drag markers to change the route
- **Automatic updates**: Route recalculates automatically when positions change
- **Zoom**: Use mouse wheel or +/- buttons for zooming

### 3. Sunlight Exposure Analysis

After building the route, you'll see:

- **Seat recommendations**: Colored chip with advice on which side to choose
- **Visual comparison**: Progress bars showing exposure percentage for each side
- **Bus layout**: Interactive diagram with seat highlighting based on exposure level

### 4. Understanding Results

**Color coding:**
- 🟡 **Yellow** - left side of bus (seats A, C)
- 🟠 **Orange** - right side of bus (seats B, D)

**Recommendation types:**
- 🟢 **Green chip** - clear recommendation (difference > 20%)
- 🟡 **Yellow chip** - approximately equal exposure
- ⚫ **Gray chip** - trip without sunlight

## 🧮 Calculation Algorithm

1. **Route segmentation** - route is divided into 5km segments
2. **Time calculation** - travel time calculated for each segment (60 km/h speed)
3. **Sun position** - azimuth and altitude determined for each segment
4. **Bus direction** - bearing (direction of movement) calculated
5. **Relative position** - determines which side the sun shines relative to movement
6. **Filtering** - ignores periods when sun is below 10° above horizon
7. **Weighting** - result weighted by distance of each segment

## 🌍 APIs and Services

- **OSRM** - `https://router.project-osrm.org` for route building
- **Nominatim** - `https://nominatim.openstreetmap.org` for address search
- **OpenStreetMap** - base maps

## 📁 Project Structure

```
bus-route-planner/
├── src/
│   ├── App.jsx                    # Main application component
│   ├── AddressAutosuggest.jsx     # Address autocomplete component
│   ├── MapWithDraggableMarkers.jsx # Interactive map component
│   ├── BusSchema.jsx              # Bus layout component
│   ├── App.css                    # Application styles
│   ├── index.css                  # Global styles
│   └── main.jsx                   # Entry point
├── public/                        # Static files
├── package.json                   # Dependencies and scripts
└── vite.config.js                # Vite configuration
```

## 🎨 UI Features

- **Material Design** - modern and intuitive interface
- **Responsive** - works on different screen sizes
- **Dark/Light theme** - automatic system preference detection
- **Accessibility** - keyboard navigation and screen reader support

## 🔧 Configuration

The application uses public APIs and requires no additional configuration. All settings are in the code:

- Bus speed: 60 km/h
- Segment size: 5 km
- Minimum sun altitude: 10°
- Search results limit: 5 addresses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See the `LICENSE` file for more information.

## 🐛 Known Limitations

- Works only with public roads (OSRM limitations)
- Sun calculation accuracy depends on timezone
- Requires internet connection for maps and API functionality
