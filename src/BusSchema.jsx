import { Box, Typography, Paper, Alert } from '@mui/material';
import { WbSunny, Brightness3, CheckCircle } from '@mui/icons-material';

export default function BusSchema({ leftExposure = 0, rightExposure = 0 }) {
  // Get recommendation message
  const getRecommendation = () => {
    if (leftExposure === 0 && rightExposure === 0) {
      return { 
        text: 'No sun exposure during your trip - any seat is good!', 
        severity: 'info',
        icon: <Brightness3 />
      };
    }
    
    const leftPercent = Math.round(leftExposure * 100);
    const rightPercent = Math.round(rightExposure * 100);
    
    if (leftPercent > rightPercent + 20) {
      return { 
        text: `Choose RIGHT side seats (C, D) for less sun exposure (${rightPercent}% vs ${leftPercent}%)`, 
        severity: 'success',
        icon: <CheckCircle />
      };
    } else if (rightPercent > leftPercent + 20) {
      return { 
        text: `Choose LEFT side seats (A, B) for less sun exposure (${leftPercent}% vs ${rightPercent}%)`, 
        severity: 'success',
        icon: <CheckCircle />
      };
    } else {
      return { 
        text: `Similar sun exposure on both sides (~${Math.max(leftPercent, rightPercent)}%) - choose any side`, 
        severity: 'warning',
        icon: <WbSunny />
      };
    }
  };

  const recommendation = getRecommendation();

  return (
    <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
      {/* Recommendation message */}
      <Alert 
        severity={recommendation.severity} 
        icon={recommendation.icon}
        sx={{ mb: 2, fontSize: '0.875rem' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {recommendation.text}
        </Typography>
      </Alert>

      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <svg width="200" height="300" viewBox="0 0 200 300">
          {/* Bus outline */}
          <rect x="20" y="20" width="160" height="260" 
                fill="white" stroke="#333" strokeWidth="2" rx="10"/>
          
          {/* Driver area */}
          <rect x="30" y="30" width="140" height="30" 
                fill="#e0e0e0" stroke="#999" strokeWidth="1"/>
          <text x="100" y="50" textAnchor="middle" fontSize="10" fill="#666">
            Driver
          </text>
          
          {/* Aisle */}
          <rect x="95" y="70" width="10" height="200" fill="#f5f5f5"/>
          
          {/* Left side seats (A, C) */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(row => (
            <g key={`left-${row}`}>
              {/* Seat A */}
              <rect 
                x="35" 
                y={80 + row * 25} 
                width="25" 
                height="20" 
                fill={`rgba(255, 193, 7, ${leftExposure})`}
                stroke="#666" 
                strokeWidth="1"
                rx="2"
              />
              <text x="47" y={93 + row * 25} textAnchor="middle" fontSize="8" fill="#333">
                {row + 1}A
              </text>
              
              {/* Seat C */}
              <rect 
                x="65" 
                y={80 + row * 25} 
                width="25" 
                height="20" 
                fill={`rgba(255, 193, 7, ${leftExposure})`}
                stroke="#666" 
                strokeWidth="1"
                rx="2"
              />
              <text x="77" y={93 + row * 25} textAnchor="middle" fontSize="8" fill="#333">
                {row + 1}C
              </text>
            </g>
          ))}
          
          {/* Right side seats (B, D) */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(row => (
            <g key={`right-${row}`}>
              {/* Seat B */}
              <rect 
                x="110" 
                y={80 + row * 25} 
                width="25" 
                height="20" 
                fill={`rgba(255, 152, 0, ${rightExposure})`}
                stroke="#666" 
                strokeWidth="1"
                rx="2"
              />
              <text x="122" y={93 + row * 25} textAnchor="middle" fontSize="8" fill="#333">
                {row + 1}B
              </text>
              
              {/* Seat D */}
              <rect 
                x="140" 
                y={80 + row * 25} 
                width="25" 
                height="20" 
                fill={`rgba(255, 152, 0, ${rightExposure})`}
                stroke="#666" 
                strokeWidth="1"
                rx="2"
              />
              <text x="152" y={93 + row * 25} textAnchor="middle" fontSize="8" fill="#333">
                {row + 1}D
              </text>
            </g>
          ))}
        </svg>
      </Box>
      
      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              bgcolor: 'rgba(255, 193, 7, 0.7)', 
              border: '1px solid #666',
              borderRadius: '2px'
            }} 
          />
          <Typography variant="caption">
            Left side - {Math.round(leftExposure * 100)}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box 
            sx={{ 
              width: 16, 
              height: 16, 
              bgcolor: 'rgba(255, 152, 0, 0.7)', 
              border: '1px solid #666',
              borderRadius: '2px'
            }} 
          />
          <Typography variant="caption">
            Right side - {Math.round(rightExposure * 100)}%
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
} 