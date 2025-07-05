import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Edit3 } from 'lucide-react';

interface StepKeyInfoProps {
  data: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    about: string;
    website: string;
    phone: string;
  };
  onUpdate: (data: any) => void;
}

const StepKeyInfo: React.FC<StepKeyInfoProps> = ({ data, onUpdate }) => {
  const handleChange = (field: string, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">1 / 6</div>
        <h1 className="text-4xl font-black uppercase tracking-tight">KEY INFO</h1>
      </div>

      {/* Name and Address Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium text-gray-900">Name and address</Label>
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <Edit3 className="h-4 w-4" />
            Edit address
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <Input
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Venue name"
            className="border-0 bg-transparent text-lg font-medium p-0 focus:ring-0"
          />
          <Input
            value={data.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Street address"
            className="border-0 bg-transparent text-gray-600 p-0 focus:ring-0 mt-1"
          />
          <div className="flex gap-2 mt-1">
            <Input
              value={data.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              className="border-0 bg-transparent text-gray-600 p-0 focus:ring-0 flex-1"
            />
            <Input
              value={data.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="Postal code"
              className="border-0 bg-transparent text-gray-600 p-0 focus:ring-0 w-24"
            />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-4">
        <Label className="text-base font-medium text-gray-900">About</Label>
        <Textarea
          value={data.about}
          onChange={(e) => handleChange('about', e.target.value)}
          placeholder="Tell us about your pub here"
          className="min-h-[120px] resize-none border-gray-200 focus:border-orange-500 focus:ring-orange-500"
        />
      </div>

      {/* Website Section */}
      <div className="space-y-4">
        <Label className="text-base font-medium text-gray-900">Website</Label>
        <Input
          value={data.website}
          onChange={(e) => handleChange('website', e.target.value)}
          placeholder="Enter venues website"
          className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
        />
      </div>

      {/* Phone Section */}
      <div className="space-y-4">
        <Label className="text-base font-medium text-gray-900">Venue phone number</Label>
        <Input
          value={data.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Enter venues phone number"
          type="tel"
          className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
        />
      </div>
    </div>
  );
};

export default StepKeyInfo; 