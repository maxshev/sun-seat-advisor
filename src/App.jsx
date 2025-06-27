import { useState, useEffect } from 'react'

import 'leaflet/dist/leaflet.css'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
  LinearProgress,
  Chip,
} from '@mui/material'
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { WbSunny, Brightness3 } from '@mui/icons-material'
import AddressAutosuggest from './AddressAutosuggest'
import MapWithDraggableMarkers from './MapWithDraggableMarkers'

import BusSchema from './BusSchema'
import SunCalc from 'suncalc'
import tzlookup from 'tz-lookup'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

export default function App() {
  // Form states
  const [from, setFrom] = useState('')
  const [fromCoords, setFromCoords] = useState(null)
  const [to, setTo] = useState('')
  const [toCoords, setToCoords] = useState(null)
  const [via, setVia] = useState([''])
  const [viaCoords, setViaCoords] = useState([null])
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)

  // Route and sun states
  const [route, setRoute] = useState([]); // [[lat, lng], ...]
  const [markers, setMarkers] = useState([]);
  const [sunExposure, setSunExposure] = useState({ left: 0, right: 0 }); // 0-1
  const [routeInfo, setRouteInfo] = useState(null); // Информация о маршруте
  const [mapCenter, setMapCenter] = useState([52.2297, 21.0122]); // Warsaw coordinates
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update map center when markers change
  useEffect(() => {
    if (markers.length > 0) {
      setMapCenter(markers[0].position);
    }
  }, [markers]);

  // Build route via OSRM
  const buildRoute = async () => {
    if (!fromCoords || !toCoords) {
      setError('Please select start and end points');
      return;
    }

    if (!date || !time) {
      setError('Please specify date and time for sun calculation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Form coordinates for OSRM
      const coords = [fromCoords];
      if (viaCoords[0]) coords.push(viaCoords[0]);
      coords.push(toCoords);

      const coordsStr = coords.map(c => `${c[1]},${c[0]}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoute(routeCoords);
        
        // Update markers
        const newMarkers = coords.map((coord, i) => ({
          position: coord,
          label: i === 0 ? 'Start' : i === coords.length - 1 ? 'End' : 'Via'
        }));
        setMarkers(newMarkers);

        // Save route info
        setRouteInfo({
          distance: (data.routes[0].distance / 1000).toFixed(1), // km
          duration: Math.round(data.routes[0].duration / 60), // minutes
        });

        // Calculate sun exposure
        calculateSunExposure(routeCoords, data.routes[0].distance);
      } else {
        throw new Error('Route not found');
      }
    } catch (error) {
      console.error('Route building error:', error);
      setError('Failed to build route. Check internet connection and selected points.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate sun exposure
  const calculateSunExposure = (routeCoords, totalDistanceMeters) => {
    const startDateTime = new Date();
    startDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    startDateTime.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const totalDistanceKm = totalDistanceMeters / 1000;
    const segmentDistanceKm = 5; // Every 5km
    const numSegments = Math.ceil(totalDistanceKm / segmentDistanceKm);
    
    let leftExposure = 0;
    let rightExposure = 0;
    let totalSegments = 0;

    for (let i = 0; i < numSegments; i++) {
      const segmentIndex = Math.floor((i / numSegments) * (routeCoords.length - 1));
      const nextIndex = Math.min(segmentIndex + 1, routeCoords.length - 1);
      
      if (segmentIndex >= routeCoords.length - 1) break;
      
      const currentCoord = routeCoords[segmentIndex];
      const nextCoord = routeCoords[nextIndex];
      
      // Time at this point (assuming constant speed)
      const timeOffsetHours = (i * segmentDistanceKm) / 60; // 60 km/h average
      const timeAtPoint = new Date(startDateTime.getTime() + timeOffsetHours * 60 * 60 * 1000);
      
      // Sun position
      const sunPos = SunCalc.getPosition(timeAtPoint, currentCoord[0], currentCoord[1]);
      
      // Bus bearing (direction)
      const busBearing = getBearing(currentCoord, nextCoord);
      
      // Sun azimuth in degrees
      const sunAzimuth = (sunPos.azimuth * 180 / Math.PI + 360) % 360;
      
      // Sun altitude (ignore if < 10°)
      const sunAltitude = sunPos.altitude * 180 / Math.PI;
      if (sunAltitude < 10) continue;
      
      // Determine which side sun is relative to bus direction
      const relativeSunAngle = (sunAzimuth - busBearing + 360) % 360;
      
      // Weight by distance segment
      const segmentWeight = Math.min(segmentDistanceKm, totalDistanceKm - i * segmentDistanceKm) / segmentDistanceKm;
      
      if (relativeSunAngle > 90 && relativeSunAngle < 270) {
        leftExposure += segmentWeight;
      } else {
        rightExposure += segmentWeight;
      }
      
      totalSegments += segmentWeight;
    }

    setSunExposure({
      left: totalSegments > 0 ? leftExposure / totalSegments : 0,
      right: totalSegments > 0 ? rightExposure / totalSegments : 0
    });
  };

  // Calculate bearing between two points
  const getBearing = (start, end) => {
    const lat1 = start[0] * Math.PI / 180
    const lat2 = end[0] * Math.PI / 180
    const deltaLng = (end[1] - start[1]) * Math.PI / 180
    
    const x = Math.sin(deltaLng) * Math.cos(lat2)
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
    
    return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360
  }

  // Handle marker drag
  const handleMarkerDrag = (markerIndex, newPosition) => {
    const newMarkers = [...markers];
    newMarkers[markerIndex].position = newPosition;
    setMarkers(newMarkers);

    // Update corresponding coordinates
    if (markerIndex === 0) {
      setFromCoords(newPosition);
    } else if (markerIndex === markers.length - 1) {
      setToCoords(newPosition);
    } else {
      const newViaCoords = [...viaCoords];
      newViaCoords[markerIndex - 1] = newPosition;
      setViaCoords(newViaCoords);
    }

    // Rebuild route
    buildRoute();
  };

  // Get sun exposure recommendation
  const getSunRecommendation = () => {
    if (sunExposure.left === 0 && sunExposure.right === 0) {
      return { text: 'No sun exposure during trip', color: 'default', icon: <Brightness3 /> };
    }
    
    const leftPercent = Math.round(sunExposure.left * 100);
    const rightPercent = Math.round(sunExposure.right * 100);
    
    if (leftPercent > rightPercent + 20) {
      return { 
        text: `Choose right side seats (B, D) - ${rightPercent}% sun vs ${leftPercent}%`, 
        color: 'success',
        icon: <WbSunny />
      };
    } else if (rightPercent > leftPercent + 20) {
      return { 
        text: `Choose left side seats (A, C) - ${leftPercent}% sun vs ${rightPercent}%`, 
        color: 'success',
        icon: <WbSunny />
      };
    } else {
      return { 
        text: `Similar sun exposure on both sides (~${Math.max(leftPercent, rightPercent)}%)`, 
        color: 'warning',
        icon: <WbSunny />
      };
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ height: '100vh', display: 'flex' }}>
          {/* Map - Left side */}
          <Box sx={{ flex: 1, height: '100%' }}>
            <MapWithDraggableMarkers
              center={mapCenter}
              markers={markers}
              route={route}
              onMarkerDrag={handleMarkerDrag}
            />
          </Box>

          {/* Controls - Right side */}
          <Paper 
            elevation={3} 
            sx={{ 
              width: 400, 
              p: 3, 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold',
                textAlign: 'center',
                mb: 1
              }}
            >
              SunSeat Advisor
            </Typography>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Route form */}
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <AddressAutosuggest
                label="From"
                value={from}
                onChange={(val, item) => {
                  setFrom(val);
                  setFromCoords(item ? [parseFloat(item.lat), parseFloat(item.lon)] : null);
                }}
                placeholder="Enter start address"
              />
              
              <AddressAutosuggest
                label="To"
                value={to}
                onChange={(val, item) => {
                  setTo(val);
                  setToCoords(item ? [parseFloat(item.lat), parseFloat(item.lon)] : null);
                }}
                placeholder="Enter destination address"
              />
              
              <AddressAutosuggest
                label="Via (optional)"
                value={via[0]}
                onChange={(val, item) => {
                  setVia([val]);
                  setViaCoords([item ? [parseFloat(item.lat), parseFloat(item.lon)] : null]);
                }}
                placeholder="Enter intermediate stop"
              />
              
              <DatePicker
                label="Date"
                value={date}
                onChange={setDate}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
              
              <TimePicker
                label="Time"
                value={time}
                onChange={setTime}
                ampm={false}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
              
              <Button 
                variant="contained" 
                onClick={buildRoute}
                disabled={loading}
                size="large"
              >
                {loading ? 'Building Route...' : 'Build Route'}
              </Button>
            </Box>

            {/* Route info */}
            {routeInfo && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Route Information
                  </Typography>
                  <Typography variant="body2">
                    Distance: {routeInfo.distance} km
                  </Typography>
                  <Typography variant="body2">
                    Duration: {routeInfo.duration} min
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Sun exposure recommendation */}
            {(sunExposure.left > 0 || sunExposure.right > 0) && (
              <Card variant="outlined" sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WbSunny />
                    <Typography variant="h6">
                      Seat Recommendation
                    </Typography>
                  </Box>
                  
                  <Chip 
                    icon={getSunRecommendation().icon}
                    label={getSunRecommendation().text}
                    color={getSunRecommendation().color}
                    sx={{ mb: 2, width: '100%', height: 'auto', py: 1 }}
                  />
                  
                  {/* Visual comparison */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Left side (A, C)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Math.round(sunExposure.left * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={sunExposure.left * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 193, 7, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'rgba(255, 193, 7, 0.8)'
                        }
                      }} 
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Right side (B, D)
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Math.round(sunExposure.right * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={sunExposure.right * 100} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 152, 0, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'rgba(255, 152, 0, 0.8)'
                        }
                      }} 
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Bus schema */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Bus Layout
              </Typography>
              <BusSchema 
                leftExposure={sunExposure.left} 
                rightExposure={sunExposure.right} 
              />
            </Box>
          </Paper>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  )
}
