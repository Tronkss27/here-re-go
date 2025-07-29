import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { venueProfileService } from '@/services/venueService';
import { useToast } from '@/hooks/use-toast';

interface BookingToggleProps {
  venueId?: string;
  initialEnabled?: boolean;
  onToggleChange?: (enabled: boolean) => void;
}

const BookingToggle: React.FC<BookingToggleProps> = ({
  venueId,
  initialEnabled = false,
  onToggleChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usa il venueId del user se non fornito come prop
  const effectiveVenueId = venueId || user?.venueId || user?.venue?.backendId;

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggle = async (newEnabled: boolean) => {
    if (!effectiveVenueId) {
      setError('Venue ID non disponibile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Toggling bookings:', { venueId: effectiveVenueId, enabled: newEnabled });
      
      const response = await venueProfileService.updateBookingSettings(effectiveVenueId, {
        enabled: newEnabled
      });

      setEnabled(newEnabled);
      onToggleChange?.(newEnabled);
      
      toast({
        title: newEnabled ? 'Prenotazioni Abilitate' : 'Prenotazioni Disabilitate',
        description: newEnabled 
          ? 'I clienti possono ora prenotare dal tuo profilo pubblico' 
          : 'Le prenotazioni esistenti rimangono valide, ma non ne verranno accettate di nuove',
        variant: 'default'
      });

      console.log('✅ Booking settings updated:', response);
      
    } catch (error) {
      console.error('❌ Error toggling bookings:', error);
      setError(error instanceof Error ? error.message : 'Errore durante l\'aggiornamento');
      
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare le impostazioni di prenotazione',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Gestione Prenotazioni
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-base font-medium">Accetta Prenotazioni</div>
            <div className="text-sm text-muted-foreground">
              Abilita o disabilita la possibilità per i clienti di prenotare
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Importante:</strong> Disabilitare le prenotazioni non cancellerà quelle già esistenti. 
              I clienti non potranno fare nuove prenotazioni, ma quelle già confermate rimarranno valide.
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Stato attuale: <span className={`font-medium ${enabled ? 'text-green-600' : 'text-red-600'}`}>
            {enabled ? 'Prenotazioni Abilitate' : 'Prenotazioni Disabilitate'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingToggle; 