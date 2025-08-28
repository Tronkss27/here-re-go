import React, { useState, useEffect } from 'react';
import { Edit, Upload, Star, Wifi, Monitor, Users, Coffee, Dog, Sun, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import adminVenueService from '@/services/adminVenueService.js';
import { venuesService } from '@/services/index.js';
import BookingToggle from '@/components/BookingToggle';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface VenueProfile {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  description: string;
  website: string;
  phone: string;
  userEmail?: string; // 🎯 NUOVO: Email utente per backend
  openingHours: Array<{
    day: string;
    status: 'open' | 'closed';
    openTime: string;
    closeTime: string;
  }>;
  capacity?: {
    total: number;
    maxReservations: number;
  };
  facilities: {
    screens: number;
    services: Array<{
      id: string;
      name: string;
      enabled: boolean;
    }>;
  };
  photos: Array<{
    id: string;
    preview: string;
  }>;
  backendId?: string; // Aggiunto per il backendId
  bookingSettings?: {
    enabled: boolean;
    requiresApproval?: boolean;
    advanceBookingDays?: number;
    minimumPartySize?: number;
    maximumPartySize?: number;
    timeSlotDuration?: number;
  };
}

const ProfiloLocale = () => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [venueProfile, setVenueProfile] = useState<VenueProfile | null>(null);
  const [formData, setFormData] = useState<VenueProfile | null>(null);

  const services = [
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { id: 'cibo', label: 'Cibo', icon: Coffee },
    { id: 'grandi-schermi', label: 'Grandi Schermi', icon: Monitor },
    { id: 'prenotabile', label: 'Prenotabile', icon: Users },
    { id: 'pet-friendly', label: 'Pet Friendly', icon: Dog },
    { id: 'giardino', label: 'Giardino', icon: Sun }
  ];

  // Carica i dati del profilo venue
  useEffect(() => {
    const loadVenueProfile = async () => {
      if (user) {
        const profile = await adminVenueService.getVenueProfile();
        if (profile) {
          console.log('✅ Venue profile loaded:', profile);
          
          // Se abbiamo un backendId, carichiamo anche le foto dal backend
          let backendPhotos = [];
          if (profile.backendId) {
            try {
              const backendVenue = await venuesService.getFormattedVenueById(profile.backendId);
              if (backendVenue && backendVenue.images) {
                // Convertiamo le immagini dal backend nel formato corretto
                backendPhotos = backendVenue.images
                  .filter(img => img && typeof img === 'string') // Solo URL string validi
                  .map(imageUrl => {
                    // ✅ FIX: Assicuriamoci che l'URL sia assoluto
                    let fullUrl = imageUrl;
                    if (imageUrl.startsWith('/uploads/')) {
                      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                      const baseUrl = API_BASE_URL.replace('/api', ''); // Rimuovi /api se presente
                      fullUrl = `${baseUrl}${imageUrl}`;
                    }
                    return {
                      id: fullUrl, // Usa URL completo come ID
                      preview: fullUrl // E come preview per anteprime corrette
                    };
                  });
                console.log('📸 Loaded photos from backend:', backendPhotos);
              }
            } catch (error) {
              console.error('❌ Error loading photos from backend:', error);
            }
          }
          
          // Trasforma i dati dal formato salvato al formato del componente
          const transformedProfile: VenueProfile = {
            name: profile.name || '',
            address: profile.address || '',
            city: profile.city || '',
            postalCode: profile.postalCode || '',
            description: profile.description || profile.about || '',
            website: profile.website || '',
            phone: profile.phone || '',
            openingHours: Array.isArray(profile.openingHours) ? profile.openingHours : [],
            capacity: {
              total: profile.capacity?.total || 50,
              maxReservations: profile.capacity?.maxReservations || 15
            },
            facilities: {
              screens: profile.facilities?.screens || 0,
              services: Array.isArray(profile.facilities?.services) ? profile.facilities.services : []
            },
            // Usa le foto dal backend se disponibili, altrimenti quelle salvate localmente
            photos: backendPhotos.length > 0 ? backendPhotos : (Array.isArray(profile.photos) ? profile.photos.map((p: any) => {
              if (typeof p === 'string') {
                return { id: p, preview: p };
              }
              return {
                id: p.id || p.url || '',
                preview: p.preview || p.url || p.id || ''
              };
            }) : []),
            backendId: profile.backendId, // Aggiunto backendId
            bookingSettings: profile.bookingSettings || { enabled: true } // Aggiunto bookingSettings
          };
          
          console.log('🔄 Transformed profile for component:', transformedProfile);
          setVenueProfile(transformedProfile);
          setFormData(transformedProfile);
        } else {
          console.log('⚠️ No venue profile found - user may need to complete onboarding');
        }
      }
    };

    loadVenueProfile();
  }, [user]);

  // Gestisce i cambiamenti nei form fields
  const handleFieldChange = (field: string, value: any) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Gestisce selezione indirizzo da autocomplete
  const handleAddressSelect = (address: string, placeDetails?: any) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      address: address,
      city: placeDetails?.city || formData.city,
      postalCode: placeDetails?.postalCode || formData.postalCode
    });
  };

  // Gestisce i cambiamenti negli orari di apertura
  const handleOpeningHourChange = (index: number, field: string, value: string) => {
    if (!formData) return;
    
    const updatedHours = [...formData.openingHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      openingHours: updatedHours
    });
  };

  // Gestisce il toggle dei servizi
  const toggleService = (serviceId: string) => {
    if (!editMode || !formData) return;
    
    const existingServices = formData.facilities.services;
    const serviceIndex = existingServices.findIndex(s => s.id === serviceId);
    
    let updatedServices;
    if (serviceIndex >= 0) {
      // Rimuovi il servizio se esiste
      updatedServices = existingServices.filter(s => s.id !== serviceId);
    } else {
      // Aggiungi il servizio se non esiste e non sono già 5
      if (existingServices.length < 5) {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          updatedServices = [...existingServices, {
            id: serviceId,
            name: service.label,
            enabled: true
          }];
        } else {
          updatedServices = existingServices;
        }
      } else {
        updatedServices = existingServices;
      }
    }
    
    setFormData({
      ...formData,
      facilities: {
        ...formData.facilities,
        services: updatedServices
      }
    });
  };

  // Gestisce il cambio del numero di schermi
  const handleScreenCountChange = (change: number) => {
    if (!editMode || !formData) return;
    
    const newCount = Math.max(0, Math.min(10, formData.facilities.screens + change));
    setFormData({
      ...formData,
      facilities: {
        ...formData.facilities,
        screens: newCount
      }
    });
  };

  // Salva le modifiche
  const handleSave = async () => {
    if (!user || !formData) return;
    
    try {
      setSaving(true);
      
      // Trasforma i dati dal formato del componente al formato di salvataggio
      const profileData = {
        ...formData,
        userId: user.id,
        userEmail: user.email, // 🎯 NUOVO: Passa email utente per backend
        updatedAt: new Date().toISOString()
      };
      
      // 🎯 NUOVO: Salva direttamente sul backend (NO LOCALSTORAGE)
      await adminVenueService.saveVenueProfile(profileData);
      
      setVenueProfile(formData);
      setEditMode(false);
      
      setMessage({
        text: 'Profilo aggiornato con successo!',
        type: 'success'
      });
      
      // Rimuovi il messaggio dopo 3 secondi
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({
        text: 'Errore durante il salvataggio del profilo.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Annulla le modifiche
  const handleCancel = () => {
    setFormData(venueProfile);
    setEditMode(false);
  };

  // Verifica se un servizio è selezionato
  const isServiceSelected = (serviceId: string) => {
    return formData?.facilities.services.some(s => s.id === serviceId) || false;
  };

  // Gestisce l'upload delle foto
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !formData) return;

    const currentPhotos = [...formData.photos];
    const newPhotos = [...currentPhotos];

    // 🎯 NUOVO: Upload tramite adminVenueService
    if (formData.backendId) {
      try {
        const uploadedImages = await adminVenueService.uploadVenuePhotos(formData.backendId, files);
        
        for (const uploadedImage of uploadedImages) {
          if (newPhotos.length >= 4) break;
          
          if (uploadedImage.url) {
            newPhotos.push({
              id: uploadedImage.url,
              preview: uploadedImage.url
            });
            console.log('📸 Added photo:', uploadedImage.url);
          }
        }
      } catch (uploadError) {
        console.error('❌ Error uploading photos:', uploadError);
        setMessage({
          text: 'Errore durante l\'upload delle foto.',
          type: 'error'
        });
      }
    } else {
      // Fallback locale se non c'è backendId
      Array.from(files).forEach((file, index) => {
        if (newPhotos.length < 4) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const preview = e.target?.result as string;
            newPhotos.push({
              id: `photo_${Date.now()}_${index}`,
              preview: preview
            });
            setFormData(prev => prev ? { ...prev, photos: [...newPhotos] } : null);
          };
          reader.readAsDataURL(file);
        }
      });
      return; // Exit early for local mode
    }

    setFormData({
      ...formData,
      photos: newPhotos
    });
    
    // 🎯 NUOVO: Notifica dell'upload per invalidare cache pubblica
    console.log('📸 Photos updated, triggering venue cache invalidation...');
  };

  // Rimuove una foto
  const removePhoto = async (photoId: string) => {
    if (!formData) return;
    
    // Trova la foto da rimuovere per ottenere l'URL
    const photoToRemove = formData.photos.find(photo => photo.id === photoId);
    if (!photoToRemove) {
      console.error('❌ Foto non trovata:', photoId);
      return;
    }

    console.log('🗑️ Tentativo rimozione foto:', { photoId, photoToRemove });
    
    const updatedPhotos = formData.photos.filter(photo => photo.id !== photoId);
    
    // ✨ RIPRISTINO: Rimozione backend per persistenza
    if (formData.backendId && photoToRemove.preview) {
      try {
        // Verifica che l'URL non sia undefined
        if (!photoToRemove.preview || photoToRemove.preview === 'undefined') {
          console.error('❌ URL foto non valido:', photoToRemove.preview);
          return;
        }
        
        // ✅ FIX: Usa photoId (che è l'URL originale) invece di preview
        // Il photoId contiene già l'URL corretto dalla conversione backend
        let imageUrlToDelete = photoId;
        
        // Se l'URL contiene il dominio completo, estrapoliamo solo il path relativo
        if (imageUrlToDelete.includes('/uploads/')) {
          const urlParts = imageUrlToDelete.split('/uploads/');
          if (urlParts.length > 1) {
            imageUrlToDelete = '/uploads/' + urlParts[1];
          }
        }
        
        console.log('🗑️ URL da eliminare (relativo):', imageUrlToDelete);
        
        // Correzione: passiamo l'URL dell'immagine come primo parametro
        await venuesService.deleteVenuePhoto(imageUrlToDelete, formData.backendId);
        console.log('✅ Foto cancellata dal backend:', imageUrlToDelete);
      } catch (err) {
        console.error('❌ Errore cancellazione foto:', err);
        return; // Non aggiornare il frontend se il backend fallisce
      }
    }
    
    setFormData({
      ...formData,
      photos: updatedPhotos
    });
  };

  if (!venueProfile) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="font-racing text-2xl text-fanzo-dark mb-4">PROFILO NON TROVATO</h2>
          <p className="font-kanit text-gray-600 mb-6">
            Non abbiamo trovato i dati del tuo profilo. Contatta il supporto per assistenza.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-racing text-2xl text-fanzo-dark">PROFILO LOCALE</h2>
        <div className="flex space-x-3">
          {editMode ? (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
              >
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300"
              >
                Annulla
              </Button>
            </>
          ) : (
        <Button
              onClick={() => setEditMode(true)}
              className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
        >
          <Edit className="h-4 w-4 mr-2" />
              Modifica
        </Button>
          )}
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                INFORMAZIONI PRINCIPALI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-kanit font-semibold">Nome Locale</Label>
                <Input 
                  value={formData?.name || ''} 
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={!editMode}
                  className="border-gray-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                <Label className="font-kanit font-semibold">Indirizzo</Label>
                {editMode ? (
                  <AddressAutocomplete
                    value={formData?.address || ''}
                    onChange={(address) => handleFieldChange('address', address)}
                    onAddressSelect={handleAddressSelect}
                    placeholder="Inserisci indirizzo..."
                    className="border-gray-300"
                    showValidation
                  />
                ) : (
                  <Input 
                    value={formData?.address || ''} 
                    disabled
                    className="border-gray-300"
                  />
                )}
                </div>
                <div>
                  <Label className="font-kanit font-semibold">Città</Label>
                  <Input 
                    value={formData?.city || ''} 
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                  disabled={!editMode}
                  className="border-gray-300"
                />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-kanit font-semibold">CAP</Label>
                  <Input 
                    value={formData?.postalCode || ''} 
                    onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                    disabled={!editMode}
                    className="border-gray-300"
                    placeholder="20121"
                  />
                </div>
                <div>
                  {/* Spazio per bilanciare la griglia */}
                </div>
              </div>
              <div>
                <Label className="font-kanit font-semibold">Descrizione</Label>
                <Textarea 
                  value={formData?.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={!editMode}
                  className="border-gray-300 h-24"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-kanit font-semibold">Sito Web</Label>
                  <Input 
                    value={formData?.website || ''} 
                    onChange={(e) => handleFieldChange('website', e.target.value)}
                    disabled={!editMode}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label className="font-kanit font-semibold">Telefono</Label>
                  <Input 
                    value={formData?.phone || ''} 
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    disabled={!editMode}
                    className="border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                ORARI DI APERTURA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formData?.openingHours.map((hour, index) => (
                  <div key={hour.day} className="flex items-center space-x-4">
                    <div className="w-20 font-kanit font-semibold text-fanzo-dark">
                      {hour.day}
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={hour.status}
                        onChange={(e) => handleOpeningHourChange(index, 'status', e.target.value)}
                        disabled={!editMode}
                        className="border border-gray-300 rounded px-2 py-1 font-kanit"
                      >
                        <option value="open">Aperto</option>
                        <option value="closed">Chiuso</option>
                      </select>
                      {hour.status === 'open' && (
                        <>
                      <Input 
                        type="time" 
                            value={hour.openTime}
                            onChange={(e) => handleOpeningHourChange(index, 'openTime', e.target.value)}
                        disabled={!editMode}
                        className="w-24 border-gray-300"
                      />
                      <span className="font-kanit text-gray-600">-</span>
                      <Input 
                        type="time" 
                            value={hour.closeTime}
                            onChange={(e) => handleOpeningHourChange(index, 'closeTime', e.target.value)}
                        disabled={!editMode}
                        className="w-24 border-gray-300"
                      />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                SERVIZI OFFERTI (max 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {services.map((service) => {
                  const isSelected = isServiceSelected(service.id);
                  const Icon = service.icon;
                  return (
                    <button
                      key={service.id}
                      onClick={() => editMode && toggleService(service.id)}
                      disabled={!editMode}
                      className={`
                        p-4 rounded-xl border-2 flex items-center space-x-3 transition-all duration-300 transform hover:scale-105
                        ${isSelected
                          ? 'bg-green-100 border-green-500 text-green-800 shadow-lg'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:bg-green-50 hover:shadow-md'
                        } 
                        ${!editMode ? 'cursor-default opacity-70' : 'cursor-pointer'}
                      `}
                    >
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                        ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}
                      `}>
                        {isSelected ? (
                          <span className="text-lg font-bold">✓</span>
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className={`font-semibold text-sm transition-colors duration-300 ${
                        isSelected ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {service.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-white rounded-xl border-2 border-gray-200">
                <Label className="font-racing text-lg text-gray-800 mb-3 block">
                  NUMERO SCHERMI
                </Label>
                <div className="flex items-center justify-center space-x-6">
                  <Button
                    onClick={() => handleScreenCountChange(-1)}
                    disabled={!editMode || (formData?.facilities.screens || 1) <= 1}
                    variant="outline"
                    size="lg"
                    className="w-12 h-12 rounded-full border-2 border-gray-300 text-gray-600 hover:bg-gray-100 text-xl font-bold"
                  >
                    -
                  </Button>
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-600 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                      {formData?.facilities.screens || 1}
                    </div>
                    <span className="text-gray-600 font-semibold mt-2 text-sm">
                      {(formData?.facilities.screens || 1) === 1 ? 'Schermo' : 'Schermi'}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleScreenCountChange(1)}
                    disabled={!editMode || (formData?.facilities.screens || 1) >= 10}
                    variant="outline"
                    size="lg"
                    className="w-12 h-12 rounded-full border-2 border-gray-300 text-gray-600 hover:bg-gray-100 text-xl font-bold"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Photos Section */}
        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                FOTO LOCALE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((index) => {
                  const photo = formData?.photos[index - 1];
                  return (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden"
                    >
                      {photo ? (
                        <img 
                          src={photo.preview} 
                          alt={`Foto ${index}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <span className="font-kanit text-xs text-gray-500">
                            Foto {index}
                          </span>
                    </div>
                      )}
                      {photo && photo.id && editMode && (
                        <div className="absolute top-1 right-1">
                          <button 
                            onClick={() => removePhoto(photo.id)}
                            className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                            title="Rimuovi foto"
                          >
                            <X className="h-3 w-3" />
                      </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              {editMode && (
                <div className="mt-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                <Button
                  variant="outline"
                    className="w-full border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                    Carica Foto (max 4)
                </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                STATISTICHE RAPIDE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-kanit text-gray-600">Valutazione media:</span>
                <div className="flex items-center">
                  <span className="font-kanit text-gray-500 text-sm">Non ancora disponibile</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="font-kanit text-gray-600">Recensioni totali:</span>
                <span className="font-kanit font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-kanit text-gray-600">Partite questo mese:</span>
                <span className="font-kanit font-semibold">0</span>
              </div>
            </CardContent>
          </Card>

          {/* Gestione Prenotazioni Toggle */}
          <BookingToggle 
            venueId={user?.venue?.backendId || user?.venueId}
            initialEnabled={venueProfile?.bookingSettings?.enabled ?? true}
            onToggleChange={(enabled) => {
              // Aggiorna lo stato locale se necessario
              console.log('Booking toggle changed:', enabled);
              // Aggiorna formData con bookingSettings
              if (formData) {
                setFormData({
                  ...formData,
                  bookingSettings: { enabled }
                });
              }
            }}
          />

          {/* Capacità Locale - Solo se prenotazioni abilitate */}
          {(formData?.bookingSettings?.enabled ?? true) && (
            <Card className="bg-white mt-6">
              <CardHeader>
                <CardTitle className="font-kanit text-lg text-gray-800 flex items-center space-x-2">
                  <span>⚙️ GESTIONE CAPACITÀ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Posti a sedere */}
                   <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Posti a sedere</Label>
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => {
                          if (!editMode || !formData) return;
                          const newTotal = Math.max(1, (formData.capacity?.total || 50) - 5);
                          setFormData({
                            ...formData,
                            capacity: { ...formData.capacity, total: newTotal }
                          });
                        }}
                        disabled={!editMode}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full"
                      >
                        -
                      </Button>
                      <div className="w-16 h-12 bg-white border border-gray-300 text-gray-900 rounded-lg flex items-center justify-center text-lg font-bold">
                        {formData?.capacity?.total ?? 0}
                      </div>
                      <Button
                        onClick={() => {
                          if (!editMode || !formData) return;
                          const newTotal = Math.min(500, (formData.capacity?.total || 50) + 5);
                          setFormData({
                            ...formData,
                            capacity: { ...formData.capacity, total: newTotal }
                          });
                        }}
                        disabled={!editMode}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Max prenotazioni */}
                   <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Max prenotazioni simultanee</Label>
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => {
                          if (!editMode || !formData) return;
                          const newMax = Math.max(1, (formData.capacity?.maxReservations || 15) - 1);
                          setFormData({
                            ...formData,
                            capacity: { ...formData.capacity, maxReservations: newMax }
                          });
                        }}
                        disabled={!editMode}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full"
                      >
                        -
                      </Button>
                      <div className="w-16 h-12 bg-white border border-gray-300 text-gray-900 rounded-lg flex items-center justify-center text-lg font-bold">
                        {formData?.capacity?.maxReservations ?? 0}
                      </div>
                      <Button
                        onClick={() => {
                          if (!editMode || !formData) return;
                          const newMax = Math.min(50, (formData.capacity?.maxReservations || 15) + 1);
                          setFormData({
                            ...formData,
                            capacity: { ...formData.capacity, maxReservations: newMax }
                          });
                        }}
                        disabled={!editMode}
                        variant="outline"
                        size="sm"
                        className="w-8 h-8 rounded-full"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-xs">
                    💡 Questi valori controllano la gestione delle prenotazioni del tuo locale
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfiloLocale;
