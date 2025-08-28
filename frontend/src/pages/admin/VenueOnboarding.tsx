import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WizardNavigation from '../../components/wizard-steps/WizardNavigation';
import StepKeyInfo from '../../components/wizard-steps/StepKeyInfo';
import StepOpeningHours from '../../components/wizard-steps/StepOpeningHours';
import StepCapacity from '../../components/wizard-steps/StepCapacity';
import StepScreens from '../../components/wizard-steps/StepScreens';
import StepFavourites from '../../components/wizard-steps/StepFavourites';
import StepFacilities from '../../components/wizard-steps/StepFacilities';
import StepPhotos from '../../components/wizard-steps/StepPhotos';
import { venueProfileService, accountService } from '@/services/venueService';
import adminVenueService from '@/services/adminVenueService.js';

// Type definitions for all step data
interface KeyInfoData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  about: string;
  website: string;
  phone: string;
}

interface OpeningHour {
  day: string;
  status: 'open' | 'closed';
  openTime: string;
  closeTime: string;
}

interface Competition {
  id: string;
  name: string;
  sport: string;
}

interface Facility {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PhotoFile {
  id: string;
  file: File;
  preview: string;
}

interface OnboardingData {
  keyInfo: KeyInfoData;
  openingHours: OpeningHour[];
  capacity: { totalCapacity: number; maxReservations: number };
  screens: { screenCount: number };
  favourites: { selectedCompetitions: Competition[] };
  facilities: { facilities: Facility[] };
  photos: { photos: PhotoFile[] };
}

const VenueOnboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser, markOnboardingAsCompleted } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 6;

  // Initialize data state
  const [data, setData] = useState<OnboardingData>({
    keyInfo: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      about: '',
      website: '',
      phone: ''
    },
    openingHours: [
      { day: 'MON', status: 'open', openTime: '11:00', closeTime: '23:00' },
      { day: 'TUE', status: 'open', openTime: '11:00', closeTime: '23:00' },
      { day: 'WED', status: 'open', openTime: '11:00', closeTime: '23:00' },
      { day: 'THU', status: 'open', openTime: '11:00', closeTime: '23:00' },
      { day: 'FRI', status: 'open', openTime: '11:00', closeTime: '23:00' },
      { day: 'SAT', status: 'open', openTime: '11:00', closeTime: '23:00' },
      { day: 'SUN', status: 'open', openTime: '11:00', closeTime: '23:00' },
    ],
    capacity: { totalCapacity: 50, maxReservations: 15 },
    screens: { screenCount: 1 },
    favourites: { selectedCompetitions: [] },
    facilities: { facilities: [] },
    photos: { photos: [] }
  });

  // Pre-populate form data with user registration info
  useEffect(() => {
    if (user) {
      console.log('🔄 Pre-populating onboarding with user data:', user);
      
      // ✅ FIX: Usa dati di registrazione se disponibili
      setData(prev => ({
        ...prev,
        keyInfo: {
          // Prima prova user.venue (se esiste), poi fallback sui dati di registrazione
          name: user.venue?.name || user.businessName || '',
          address: user.venue?.address || user.businessAddress || '',
          city: user.venue?.city || user.businessCity || '',
          postalCode: user.venue?.postalCode || user.businessPostalCode || '',
          about: user.venue?.about || '',
          website: user.venue?.website || '',
          phone: user.venue?.phone || user.businessPhone || user.phone || ''
        }
      }));
    }
  }, [user]);

  const updateStepData = (stepKey: keyof OnboardingData, stepData: any) => {
    setData(prev => ({
      ...prev,
      [stepKey]: stepData
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      // Handle final submission
      handleSubmit();
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!user || !user.id) {
        console.error('❌ No user ID found during onboarding save!');
        setIsSubmitting(false);
        return;
      }
      
      // Prepara i dati del profilo venue
      const venueProfileData = {
        // Informazioni principali
        name: data.keyInfo.name,
        address: data.keyInfo.address,
        city: data.keyInfo.city,
        postalCode: data.keyInfo.postalCode,
        description: data.keyInfo.about, // about dal form → description nel backend
        website: data.keyInfo.website,
        phone: data.keyInfo.phone,
        
        // Orari di apertura
        openingHours: data.openingHours,
        
        // Capacità locale
        capacity: {
          total: data.capacity.totalCapacity,
          maxReservations: data.capacity.maxReservations,
          standing: data.capacity.totalCapacity * 1.5 // Default standing capacity
        },
        
        // Facilities e servizi
        facilities: {
          screens: data.screens.screenCount,
          services: data.facilities.facilities
        },
        
        // Sport preferiti
        favouriteSports: data.favourites.selectedCompetitions,
        
        // Foto caricate
        photos: data.photos.photos.map(photo => ({
          id: photo.id,
          preview: photo.preview
        })),
        
        // Metadata
        completedAt: new Date().toISOString(),
        userId: user.id
      };

      // Salva il profilo venue utilizzando il nuovo servizio
      venueProfileService.saveProfile(user.id, venueProfileData);
      
      // ✨ SINCRONIZZA CON BACKEND - CREA VENUE REALE
      console.log('🔄 Syncing venue to backend database...');
      console.log('🔍 SERVICES DEBUG pre-sync:', venueProfileData.facilities);
      const syncResult = await venueProfileService.syncToBackend(user.id, venueProfileData, user);
      
      if (!syncResult.success) {
        console.error('❌ Warning: Failed to sync venue to backend:', syncResult.error);
        // 🎯 FALLBACK: Salva direttamente via adminVenueService come backup
        try {
          await adminVenueService.saveVenueProfile({
            name: venueProfileData.name,
            address: venueProfileData.address,
            city: venueProfileData.city,
            postalCode: venueProfileData.postalCode,
            description: venueProfileData.description,
            website: venueProfileData.website,
            phone: venueProfileData.phone,
            openingHours: venueProfileData.openingHours,
            capacity: venueProfileData.capacity,
            facilities: venueProfileData.facilities,
            photos: venueProfileData.photos || [],
                          // Nessun backendId temporaneo - lascia che il backend crei l'ID
          });
          console.log('✅ Fallback save via adminVenueService successful');
        } catch (fallbackError) {
          console.error('❌ Fallback save failed:', fallbackError);
        }
      } else {
        console.log('✅ Venue successfully synced to backend!', syncResult.venue);
        // ✨ IMPORTANTE: Aggiorna i dati locali con backendId per future operazioni
        venueProfileData.backendId = syncResult.venue._id;
        venueProfileData.syncedAt = new Date().toISOString();
        venueProfileData.status = 'synced';
        
        // Risalva con i dati di sync aggiornati
        venueProfileService.saveProfile(user.id, venueProfileData);
        
        // 🎯 NUOVO: Salva anche tramite adminVenueService per compatibility
        try {
          console.log('🔍 ONBOARDING DEBUG - facilities structure:', {
            'venueProfileData.facilities': venueProfileData.facilities,
            'venueProfileData.facilities?.facilities': venueProfileData.facilities?.facilities,
            'venueProfileData.facilities?.services': venueProfileData.facilities?.services
          });
          
          const adminProfileData = {
            name: venueProfileData.name,
            address: venueProfileData.address,
            city: venueProfileData.city,
            postalCode: venueProfileData.postalCode,
            description: venueProfileData.description || '', // description field
            website: venueProfileData.website,
            phone: venueProfileData.phone,
            userEmail: user.email,
            openingHours: venueProfileData.openingHours,
            capacity: venueProfileData.capacity,
            facilities: {
              screens: venueProfileData.facilities?.screens || 1,
              // Usa i servizi confermati dal backend se presenti, altrimenti quelli selezionati in onboarding
              services: (syncResult.venue?.facilities?.services && syncResult.venue.facilities.services.length > 0)
                ? syncResult.venue.facilities.services
                : (venueProfileData.facilities?.facilities || [])
            },
            photos: venueProfileData.photos || [],
            backendId: syncResult.venue._id,
            bookingSettings: venueProfileData.bookingSettings || {
              enabled: true,
              requiresApproval: false,
              advanceBookingDays: 30,
              minimumPartySize: 1,
              maximumPartySize: 10,
              timeSlotDuration: 120
            }
          };
          
          await adminVenueService.saveVenueProfile(adminProfileData);
          console.log('✅ Profile also saved via adminVenueService');
        } catch (adminError) {
          console.error('⚠️ AdminVenueService save failed:', adminError);
          // Non bloccare il flusso, l'importante è che il venue sia creato
        }
      }
      
      // Prepara i dati account iniziali
      const accountData = {
        email: user.email,
        ownerName: user.name || '',
        phone: data.keyInfo.phone,
        notifications: {
          email: true,
          push: false,
          whatsapp: false
        },
        preferences: {
          language: 'it',
          timezone: 'Europe/Rome'
        },
        createdAt: new Date().toISOString(),
        // Aggiungi info su venue backend se sync riuscita
        venueBackendId: syncResult.success ? syncResult.venue._id : undefined
      };

      // Salva i dati account
      accountService.saveAccountData(user.id, accountData);

      console.log('Venue profile saved:', venueProfileData);
      console.log('Account data saved:', accountData);
      console.log('Backend sync result:', syncResult);

      // Ricrea l'oggetto utente aggiornato
      const updatedUserData = {
        ...user,
        venueId: syncResult.success ? syncResult.venue._id : user.venueId, // salva anche a livello top per comodità
        venue: {
          ...(user.venue || {}),
          id: syncResult.success ? syncResult.venue._id : (user.venue?.id || ''),
          name: data.keyInfo.name
        },
        // Flag per forzare re-render
        updatedAt: new Date().toISOString()
      };

      // Aggiorna l'utente nel localStorage e context
      updateUser(updatedUserData);
      
      // Marca l'onboarding come completato usando la nuova funzione dal context
      markOnboardingAsCompleted();
      
      // Simula un piccolo delay per l'UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect alla dashboard con messaggio di successo
      navigate('/admin', { 
        state: { 
          message: 'Profilo completato con successo! I tuoi dati sono stati salvati.',
          type: 'success'
        }
      });
      
    } catch (error) {
      console.error('Error saving venue profile:', error);
      setIsSubmitting(false);
      // TODO: Mostra messaggio di errore all'utente
    }
  };

  // Validation for each step
  const isStepValid = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1: // Key Info
        return !!(data.keyInfo.name && data.keyInfo.address && data.keyInfo.city);
      case 2: // Opening Hours
        return true; // Opening hours always valid (can be skipped)
      case 3: // Capacity
        return data.capacity.totalCapacity > 0;
      case 4: // Screens
        return data.screens.screenCount >= 0;
      case 5: // Facilities
        return true; // Facilities optional
      case 6: // Photos
        return true; // Photos optional
      default:
        return true;
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return (
          <StepKeyInfo
            data={data.keyInfo}
            onUpdate={(keyInfo) => updateStepData('keyInfo', keyInfo)}
          />
        );
      case 2:
        return (
          <StepOpeningHours
            data={data.openingHours}
            onUpdate={(openingHours) => updateStepData('openingHours', openingHours)}
          />
        );
      case 3:
        return (
          <StepCapacity
            data={data.capacity}
            onUpdate={(capacity) => updateStepData('capacity', capacity)}
          />
        );
      case 4:
        return (
          <StepScreens
            data={data.screens}
            onUpdate={(screens) => updateStepData('screens', screens)}
          />
        );
      case 5:
        return (
          <StepFacilities
            data={data.facilities}
            onUpdate={(facilities) => updateStepData('facilities', facilities)}
          />
        );
      case 6:
        return (
          <StepPhotos
            profile={data}
            onUpdate={(photos) => updateStepData('photos', photos)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col">
        <div className="p-8 flex-grow">
          {renderCurrentStep()}
        </div>

        <WizardNavigation 
          currentStep={step}
          totalSteps={totalSteps}
          onNext={handleNext}
          onPrev={handlePrev}
          isNextDisabled={!isStepValid(step) || isSubmitting}
        />
      </div>
    </div>
  );
};

export default VenueOnboarding;
