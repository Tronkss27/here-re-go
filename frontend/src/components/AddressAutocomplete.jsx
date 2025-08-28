import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, Check, AlertCircle } from 'lucide-react';
import { useAddressAutocomplete } from '../hooks/useGoogleMaps';

/**
 * Componente per autocompletamento indirizzi con Google Places API
 */
const AddressAutocomplete = ({
  value = '',
  onChange,
  onAddressSelect,
  placeholder = 'Inserisci indirizzo...',
  required = false,
  disabled = false,
  className = '',
  showValidation = true,
  label,
  error
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const {
    suggestions,
    isLoading,
    selectedPlace,
    searchAddresses,
    getPlaceDetails,
    clearSuggestions,
    clearSelection
  } = useAddressAutocomplete(inputRef);

  // Aggiorna input quando cambia il value esterno
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Gestisce selezione place dall'autocomplete Google
  useEffect(() => {
    if (selectedPlace) {
      const fullAddress = selectedPlace.fullAddress || selectedPlace.formattedAddress;
      setInputValue(fullAddress);
      setIsValid(true);
      setIsOpen(false);
      clearSuggestions();
      
      // Callback con dati completi
      if (onChange) {
        onChange(fullAddress);
      }
      if (onAddressSelect) {
        // ✅ FIX: Passa l'indirizzo come stringa e i dettagli separatamente
        const placeDetails = {
          city: selectedPlace.city,
          postalCode: selectedPlace.postalCode,
          coordinates: selectedPlace.coordinates, // { latitude, longitude }
          formattedAddress: selectedPlace.formattedAddress
        };
        onAddressSelect(fullAddress, placeDetails);
      }
      
      clearSelection();
    }
  }, [selectedPlace, onChange, onAddressSelect, clearSuggestions, clearSelection]);

  // Gestisce input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValid(false);
    
    if (onChange) {
      onChange(newValue);
    }

    // Cerca suggerimenti se almeno 3 caratteri
    if (newValue.length >= 3) {
      searchAddresses(newValue);
      setIsOpen(true);
    } else {
      clearSuggestions();
      setIsOpen(false);
    }
    
    setSelectedIndex(-1);
  };

  // Gestisce selezione da dropdown manuale
  const handleSuggestionSelect = async (suggestion) => {
    try {
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      
      const fullAddress = placeDetails.fullAddress || placeDetails.formattedAddress;
      setInputValue(fullAddress);
      setIsValid(true);
      setIsOpen(false);
      clearSuggestions();
      
      if (onChange) {
        onChange(fullAddress);
      }
      if (onAddressSelect) {
        // ✅ FIX: Consistente con il formato sopra
        const placeDetailsFormatted = {
          city: placeDetails.city,
          postalCode: placeDetails.postalCode,
          coordinates: placeDetails.coordinates,
          formattedAddress: placeDetails.formattedAddress
        };
        onAddressSelect(fullAddress, placeDetailsFormatted);
      }
    } catch (error) {
      console.error('Errore selezione indirizzo:', error);
      // Fallback con testo del suggestion
      setInputValue(suggestion.description);
      setIsOpen(false);
      
      if (onChange) {
        onChange(suggestion.description);
      }
    }
  };

  // Gestisce navigazione keyboard
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Chiude dropdown quando click fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseInputClasses = `
    w-full px-4 py-3 pr-12 border rounded-lg 
    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
    transition-colors text-sm bg-white
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${isValid && showValidation ? 'border-green-500' : ''}
    ${className}
  `;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClasses}
          autoComplete="off"
        />
        
        {/* Icone status */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
          )}
          
          {!isLoading && showValidation && isValid && (
            <Check className="h-4 w-4 text-green-500" />
          )}
          
          {!isLoading && !isValid && inputValue.length > 0 && (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
          
          {!isLoading && !inputValue && (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown suggerimenti */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId}
              onClick={() => handleSuggestionSelect(suggestion)}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                ${index === selectedIndex ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'}
              `}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.mainText}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.secondaryText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messaggio errore */}
      {error && (
        <div className="flex items-center space-x-1 mt-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Hint validation */}
      {showValidation && inputValue.length > 0 && !isValid && !error && (
        <div className="mt-2 text-sm text-gray-500">
          Seleziona un indirizzo dai suggerimenti per validare
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
