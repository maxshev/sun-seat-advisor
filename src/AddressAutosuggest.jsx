import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { LocationOn } from '@mui/icons-material';

export default function AddressAutosuggest({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter address" 
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const debounceRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.length > 2) {
      debounceRef.current = setTimeout(() => {
        searchAddresses(inputValue);
      }, 400);
    } else {
      setOptions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue]);

  const searchAddresses = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=en`
      );
      const data = await response.json();
      setOptions(data.map(item => ({
        ...item,
        label: item.display_name,
        id: item.place_id
      })));
    } catch (error) {
      console.error('Address search error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    onChange(newInputValue, null);
  };

  const handleChange = (event, newValue) => {
    if (newValue) {
      setInputValue(newValue.label);
      onChange(newValue.label, newValue);
    } else {
      setInputValue('');
      onChange('', null);
    }
  };

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => option.label || ''}
      loading={loading}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      filterOptions={(x) => x} // Disable built-in filtering
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2" component="div">
              {option.display_name.split(',')[0]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.display_name.split(',').slice(1).join(',').trim()}
            </Typography>
          </Box>
        </Box>
      )}
      noOptionsText={inputValue.length <= 2 ? "Type at least 3 characters" : "No addresses found"}
    />
  );
} 