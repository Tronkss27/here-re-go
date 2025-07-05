import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Upload, X, Image, UploadCloudIcon } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import venuesService from '../../services/venuesService';
import { useAuth } from '../../contexts/AuthContext';

interface PhotoFile {
  id: string;
  name: string;
  preview: string;
}

interface StepPhotosProps {
  profile: any | undefined; // ✅ Profile può essere undefined al primo render
  onUpdate: (data: { photos: PhotoFile[] }) => void;
}

const StepPhotos: React.FC<StepPhotosProps> = ({ profile, onUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ✅ CONTROLLO DI SICUREZZA: profile può essere undefined al primo render
  const [photos, setPhotos] = useState<PhotoFile[]>((profile?.photos) || []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Controlla se è necessaria la migrazione da dati locali vecchi
  useEffect(() => {
    const localProfile = JSON.parse(localStorage.getItem(`venue_profile_${user.id}`) || '{}');
    if (localProfile.photos && localProfile.photos.length > 0) {
      setNeedsSync(true);
    }
  }, [user.id]);

  const handleFiles = (files: File[]) => {
    if (photos.length + files.length > 5) {
      setError('Puoi caricare un massimo di 5 foto.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const newPhotosPromises = files.map(file => {
      return new Promise<PhotoFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          preview: reader.result as string,
        });
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotosPromises)
      .then(async newPhotos => {
        const updatedPhotos = [...photos, ...newPhotos];
        setPhotos(updatedPhotos);
        onUpdate({ photos: updatedPhotos }); // Aggiorna lo stato del wizard localmente

        // Logica di salvataggio automatico
        try {
          console.log('🔄 Automatic sync triggered after photo upload.');
          // ✅ CONTROLLO DI SICUREZZA: assicurati che profile esista
          const fullProfileToSync = { ...(profile || {}), photos: updatedPhotos };
          await venuesService.updateVenueProfile(user.id, fullProfileToSync);
          toast({
            title: 'Foto Caricata e Sincronizzata!',
            description: "L'immagine è stata salvata correttamente sul server.",
            variant: 'success',
          });
        } catch (syncError: any) {
          setError('Le foto sono state caricate ma non sincronizzate. Usa il pulsante di Sincronizzazione manuale.');
          setNeedsSync(true); // Mostra il pulsante di migrazione come fallback
        }
      })
      .catch(() => setError('Errore durante la lettura di uno dei file.'))
      .finally(() => setIsUploading(false));
  };

  const handleRemovePhoto = async (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    setPhotos(updatedPhotos);
    onUpdate({ photos: updatedPhotos });

    try {
      // ✅ CONTROLLO DI SICUREZZA: assicurati che profile esista
      const fullProfile = { ...(profile || {}), photos: updatedPhotos };
      await venuesService.updateVenueProfile(user.id, fullProfile);
      toast({ title: 'Foto Rimossa', description: 'Il profilo è stato aggiornato sul server.', variant: 'success' });
    } catch (err) {
      toast({ title: 'Errore Sincronizzazione', description: 'Impossibile aggiornare il server.', variant: 'destructive' });
      setNeedsSync(true); // Mostra il pulsante di migrazione come fallback
    }
  };

  // Funzione di migrazione una-tantum
  const handleSyncToServer = async () => {
    setIsUploading(true);
    setError(null);
    try {
      const localProfile = JSON.parse(localStorage.getItem(`venue_profile_${user.id}`) || '{}');
      if (!localProfile.name) throw new Error('Dati del profilo locale non trovati o incompleti.');

      const response = await venuesService.updateVenueProfile(user.id, localProfile);
      if (response.success) {
        toast({
          title: 'Sincronizzazione Riuscita!',
          description: 'I tuoi dati locali sono stati salvati correttamente sul server.',
          variant: 'success'
        });
        setNeedsSync(false);
      } else {
        throw new Error(response.message || 'Errore sconosciuto durante la sincronizzazione.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Le Tue Foto</h1>
        <p className="text-gray-500">Aggiungi fino a 5 foto. La prima sarà l'immagine principale.</p>
      </div>

      {needsSync && (
        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-md flex items-start">
            <UploadCloudIcon className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-yellow-700">
                Abbiamo trovato dati salvati solo localmente. Sincronizzali ora per renderli visibili su tutti i tuoi dispositivi.
              </p>
              <Button onClick={handleSyncToServer} disabled={isUploading} variant="outline" size="sm" className="mt-2">
                {isUploading ? 'Sincronizzazione...' : 'Sincronizza Dati Locali'}
              </Button>
            </div>
        </div>
      )}

      {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => document.getElementById('photo-upload')?.click()}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <h3 className="text-lg font-medium">Trascina le tue foto qui</h3>
        <p className="text-sm text-gray-500">o clicca per selezionare i file</p>
        <input id="photo-upload" type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group aspect-w-1 aspect-h-1">
              <img src={photo.preview} alt={`Venue photo ${index + 1}`} className="w-full h-full object-cover rounded-lg border" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => handleRemovePhoto(photo.id)} variant="destructive" size="icon">
                <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Principale</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Image className="h-12 w-12 mx-auto mb-2" />
          Nessuna foto caricata.
        </div>
      )}
    </div>
  );
};

export default StepPhotos; 