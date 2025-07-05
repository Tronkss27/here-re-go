import React from 'react';
import { Button } from '../../components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  isNextDisabled?: boolean;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  isNextDisabled = false,
}) => {
  return (
    <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200 flex items-center justify-between">
      <div>
        {currentStep > 1 && (
          <Button variant="ghost" onClick={onPrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Step {currentStep} di {totalSteps}
        </span>
        
        {currentStep < totalSteps ? (
          <Button onClick={onNext} disabled={isNextDisabled}>
            Continua <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onNext} disabled={isNextDisabled} className="bg-green-600 hover:bg-green-700">
            Completa e Salva
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardNavigation; 