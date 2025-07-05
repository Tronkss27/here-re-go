import React from 'react';
import { Button } from '../ui/button';
import { Wifi, UtensilsCrossed, Projector, PawPrint, Trees, MessageSquare, Monitor } from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface StepFacilitiesProps {
  data: { facilities: Facility[] };
  onUpdate: (data: { facilities: Facility[] }) => void;
}

const StepFacilities: React.FC<StepFacilitiesProps> = ({ data, onUpdate }) => {
  const defaultFacilities: Facility[] = [
    { id: 'wifi', name: 'Wifi', icon: <Wifi className="h-5 w-5" />, enabled: false },
    { id: 'food', name: 'Food', icon: <UtensilsCrossed className="h-5 w-5" />, enabled: false },
    { id: 'projector', name: 'Projector', icon: <Projector className="h-5 w-5" />, enabled: false },
    { id: 'pet-friendly', name: 'Pet friendly', icon: <PawPrint className="h-5 w-5" />, enabled: false },
    { id: 'garden', name: 'Garden', icon: <Trees className="h-5 w-5" />, enabled: false },
    { id: 'commentary', name: 'Commentary', icon: <MessageSquare className="h-5 w-5" />, enabled: false },
    { id: 'outdoor-screen', name: 'Outdoor Screen', icon: <Monitor className="h-5 w-5" />, enabled: false },
  ];

  // Initialize facilities if not set
  const facilities = data.facilities.length > 0 ? data.facilities : defaultFacilities;

  const handleToggleFacility = (facilityId: string) => {
    const updatedFacilities = facilities.map(facility =>
      facility.id === facilityId
        ? { ...facility, enabled: !facility.enabled }
        : facility
    );
    onUpdate({ facilities: updatedFacilities });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">5 / 6</div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            FACILITIES
          </h1>
          <Button variant="ghost" className="text-sm text-gray-600">
            Skip
          </Button>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">
          Tap the facilities that you offer your customers.
        </p>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {facilities.map((facility) => (
          <button
            key={facility.id}
            onClick={() => handleToggleFacility(facility.id)}
            className={`
              p-6 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-3
              ${facility.enabled
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }
            `}
          >
            <div className={`
              ${facility.enabled ? 'text-orange-600' : 'text-gray-400'}
            `}>
              {facility.icon}
            </div>
            <span className="text-sm font-medium">
              {facility.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepFacilities; 