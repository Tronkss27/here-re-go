import React from 'react';
import { Button } from '../ui/button';
import { Minus, Plus } from 'lucide-react';

interface StepScreensProps {
  data: { screenCount: number };
  onUpdate: (data: { screenCount: number }) => void;
}

const StepScreens: React.FC<StepScreensProps> = ({ data, onUpdate }) => {
  const handleIncrement = () => {
    onUpdate({ screenCount: data.screenCount + 1 });
  };

  const handleDecrement = () => {
    onUpdate({ screenCount: Math.max(0, data.screenCount - 1) });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">3 / 6</div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            NUMBER OF SCREENS
          </h1>
          <Button variant="ghost" className="text-sm text-gray-600">
            Skip
          </Button>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">
          Select the number of TVs and projectors that you show sport on.
        </p>
      </div>

      {/* Counter Section */}
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-8">
          {/* Decrement Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleDecrement}
            disabled={data.screenCount <= 0}
            className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-gray-400 disabled:opacity-50"
          >
            <Minus className="h-6 w-6" />
          </Button>

          {/* Counter Display */}
          <div className="text-6xl font-bold text-gray-900 min-w-[120px] text-center">
            {data.screenCount}
          </div>

          {/* Increment Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleIncrement}
            className="w-12 h-12 rounded-full border-2 border-gray-300 hover:border-gray-400"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StepScreens; 