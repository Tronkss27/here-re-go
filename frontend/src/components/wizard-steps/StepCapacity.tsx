import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Users } from 'lucide-react';

interface StepCapacityProps {
  data: {
    totalCapacity: number;
    maxReservations: number;
    standingCapacity: number;
  };
  onUpdate: (data: any) => void;
}

const StepCapacity: React.FC<StepCapacityProps> = ({ data, onUpdate }) => {
  const handleChange = (field: string, value: string) => {
    const numericValue = parseInt(value) || 0;
    onUpdate({ ...data, [field]: Math.max(0, numericValue) });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">3 / 6</div>
        <h1 className="text-4xl font-black uppercase tracking-tight">CAPACITÀ</h1>
        <p className="text-gray-600 mt-2">Imposta la capacità del tuo locale</p>
      </div>

      {/* Content */}
      <Card className="bg-white border-2 border-gray-100">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Capacità Totale */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-gray-900" />
                <div>
                  <Label className="text-lg font-semibold text-gray-900">
                    Posti a sedere
                  </Label>
                  <p className="text-sm text-gray-500">Numero totale di posti</p>
                </div>
              </div>
              <Input
                type="number"
                value={data.totalCapacity}
                onChange={(e) => handleChange('totalCapacity', e.target.value)}
                placeholder="50"
                min="1"
                max="500"
                className="text-lg p-4 border-2"
              />
            </div>

            {/* Max Prenotazioni */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-gray-900" />
                <div>
                  <Label className="text-lg font-semibold text-gray-900">
                    Max prenotazioni
                  </Label>
                  <p className="text-sm text-gray-500">Tavoli prenotabili contemporaneamente</p>
                </div>
              </div>
              <Input
                type="number"
                value={data.maxReservations}
                onChange={(e) => handleChange('maxReservations', e.target.value)}
                placeholder="15"
                min="1"
                max="50"
                className="text-lg p-4 border-2"
              />
            </div>
          </div>

          {/* Suggerimenti */}
          <div className="mt-8 p-4 bg-gray-900 border-2 border-pink-300 rounded-lg">
            <h4 className="font-semibold text-white text-sm mb-2">💡 Consigli</h4>
            <div className="text-white text-sm space-y-1">
              <p>• <strong>Posti a sedere:</strong> Conta solo i posti effettivamente utilizzabili</p>
              <p>• <strong>Prenotazioni:</strong> Lascia sempre spazio per clienti walk-in</p>
              <p>• Puoi modificare questi valori in qualsiasi momento dal pannello admin</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StepCapacity;
