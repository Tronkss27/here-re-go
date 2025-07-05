import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import WizardNavigation from '../../components/wizard-steps/WizardNavigation';
import StepKeyInfo from '../../components/wizard-steps/StepKeyInfo';
import StepOpeningHours from '../../components/wizard-steps/StepOpeningHours';
import StepScreens from '../../components/wizard-steps/StepScreens';
import StepFavourites from '../../components/wizard-steps/StepFavourites';
import StepFacilities from '../../components/wizard-steps/StepFacilities';
import StepPhotos from '../../components/wizard-steps/StepPhotos';
import { venueProfileService, accountService } from '@/services/venueService';

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
    screens: { screenCount: 1 },
    favourites: { selectedCompetitions: [] },
    facilities: { facilities: [] },
    photos: { photos: [] }
  });

  // Pre-populate form data with user registration info
  useEffect(() => {
    if (user && user.venue) {
      setData(prev => ({
        ...prev,
        keyInfo: {
          name: user.venue.name || '',
          address: user.venue.address || '',
          city: user.venue.city || '',
          postalCode: user.venue.postalCode || '',
          about: '',
          website: '',
          phone: user.venue.phone || ''
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
        description: data.keyInfo.about,
        website: data.keyInfo.website,
        phone: data.keyInfo.phone,
        
        // Orari di apertura
        openingHours: data.openingHours,
        
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
      const syncResult = await venueProfileService.syncToBackend(user.id, venueProfileData, user);
      
      if (!syncResult.success) {
        console.error('❌ Warning: Failed to sync venue to backend:', syncResult.error);
        // Continua comunque l'onboarding, l'admin può ritentare la sync più tardi
      } else {
        console.log('✅ Venue successfully synced to backend!', syncResult.venue);
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
        venue: {
          name: data.keyInfo.name,
          id: `venue_${user.id}`
        },
        // Aggiungo un flag per forzare il re-render se necessario
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
      case 3: // Screens
        return data.screens.screenCount >= 0;
      case 4: // Favourites
        return true; // Favourites optional
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
          <StepScreens
            data={data.screens}
            onUpdate={(screens) => updateStepData('screens', screens)}
          />
        );
      case 4:
        return (
          <StepFavourites
            data={data.favourites}
            onUpdate={(favourites) => updateStepData('favourites', favourites)}
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