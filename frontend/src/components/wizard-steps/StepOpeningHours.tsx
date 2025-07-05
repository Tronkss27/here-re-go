import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface OpeningHour {
  day: string;
  status: 'open' | 'closed';
  openTime: string;
  closeTime: string;
}

interface StepOpeningHoursProps {
  data: OpeningHour[];
  onUpdate: (data: OpeningHour[]) => void;
}

const StepOpeningHours: React.FC<StepOpeningHoursProps> = ({ data, onUpdate }) => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const handleStatusChange = (dayIndex: number, status: 'open' | 'closed') => {
    const newData = [...data];
    newData[dayIndex] = { ...newData[dayIndex], status };
    onUpdate(newData);
  };

  const handleTimeChange = (dayIndex: number, field: 'openTime' | 'closeTime', value: string) => {
    const newData = [...data];
    newData[dayIndex] = { ...newData[dayIndex], [field]: value };
    onUpdate(newData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">2 / 6</div>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">
          CONFIRM YOUR OPENING<br />HOURS
        </h1>
        <div className="flex justify-end">
          <Button variant="ghost" className="text-sm text-gray-600">
            Skip
          </Button>
        </div>
      </div>

      {/* Opening Hours Grid */}
      <div className="space-y-4">
        {days.map((day, index) => {
          const dayData = data[index] || { day, status: 'open', openTime: '11:00', closeTime: '23:00' };
          
          return (
            <div key={day} className="flex items-center gap-4">
              {/* Day Label */}
              <div className="w-12 text-sm font-medium text-gray-700">
                {day}
              </div>

              {/* Status Dropdown */}
              <Select
                value={dayData.status}
                onValueChange={(value: 'open' | 'closed') => handleStatusChange(index, value)}
              >
                <SelectTrigger className="w-24 border-yellow-400 focus:ring-yellow-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Time Inputs - Only show if open */}
              {dayData.status === 'open' && (
                <>
                  <Input
                    type="time"
                    value={dayData.openTime}
                    onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                    className="w-24 border-yellow-400 focus:ring-yellow-400 text-center"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <Input
                    type="time"
                    value={dayData.closeTime}
                    onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                    className="w-24 border-yellow-400 focus:ring-yellow-400 text-center"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepOpeningHours; 