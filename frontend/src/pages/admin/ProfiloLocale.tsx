import { useState, useEffect } from 'react';
import { Edit, Upload, Star, Wifi, Monitor, Users, Coffee, Dog, Sun, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { venueProfileService } from '@/services/venueService';

interface VenueProfile {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  description: string;
  website: string;
  phone: string;
  openingHours: Array<{
    day: string;
    status: 'open' | 'closed';
    openTime: string;
    closeTime: string;
  }>;
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
    if (user) {
      const profile = venueProfileService.getProfile(user.id);
      if (profile) {
        // Trasforma i dati dal formato salvato al formato del componente
        const transformedProfile: VenueProfile = {
          name: profile.name || '',
          address: profile.address || '',
          city: profile.city || '',
          postalCode: profile.postalCode || '',
          description: profile.description || '',
          website: profile.website || '',
          phone: profile.phone || '',
          openingHours: profile.openingHours || [],
          facilities: {
            screens: profile.facilities?.screens || 0,
            services: profile.facilities?.services || []
          },
          photos: profile.photos || []
        };
        setVenueProfile(transformedProfile);
        setFormData(transformedProfile);
      }
    }
  }, [user]);

  // Gestisce i cambiamenti nei form fields
  const handleFieldChange = (field: string, value: any) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      [field]: value
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
        updatedAt: new Date().toISOString()
      };
      
      // Salva utilizzando il servizio
      venueProfileService.saveProfile(user.id, profileData);
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
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !formData) return;

    const currentPhotos = formData.photos || [];
    const newPhotos = [...currentPhotos];

    Array.from(files).forEach((file, index) => {
      if (newPhotos.length < 4) { // Massimo 4 foto
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          newPhotos.push({
            id: `photo_${Date.now()}_${index}`,
            preview: preview
          });
          
          setFormData({
            ...formData,
            photos: newPhotos
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Rimuove una foto
  const removePhoto = (photoId: string) => {
    if (!formData) return;
    
    const updatedPhotos = formData.photos.filter(photo => photo.id !== photoId);
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
                <Input 
                    value={formData?.address || ''} 
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    disabled={!editMode}
                    className="border-gray-300"
                  />
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((service) => {
                  const isSelected = isServiceSelected(service.id);
                  const Icon = service.icon;
                  return (
                    <button
                      key={service.id}
                      onClick={() => editMode && toggleService(service.id)}
                      disabled={!editMode}
                      className={`p-3 rounded-lg border-2 flex items-center space-x-2 transition-colors ${
                        isSelected
                          ? 'bg-fanzo-yellow border-fanzo-teal text-fanzo-dark'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-fanzo-teal'
                      } ${!editMode ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-kanit font-semibold text-sm">{service.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                <Label className="font-kanit font-semibold">Numero Schermi</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Button
                    onClick={() => handleScreenCountChange(-1)}
                    disabled={!editMode || (formData?.facilities.screens || 0) <= 0}
                    variant="outline"
                    size="sm"
                    className="border-fanzo-teal text-fanzo-teal"
                  >
                    -
                  </Button>
                  <span className="font-kanit font-bold text-lg w-8 text-center">
                    {formData?.facilities.screens || 0}
                  </span>
                  <Button
                    onClick={() => handleScreenCountChange(1)}
                    disabled={!editMode || (formData?.facilities.screens || 0) >= 10}
                    variant="outline"
                    size="sm"
                    className="border-fanzo-teal text-fanzo-teal"
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
                      {photo && editMode && (
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
        </div>
      </div>
    </div>
  );
};

export default ProfiloLocale;
