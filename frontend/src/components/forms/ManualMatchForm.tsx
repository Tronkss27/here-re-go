import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ManualMatchFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ManualMatchForm: React.FC<ManualMatchFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    competition: { id: 'custom', name: 'Partita personalizzata', logo: '⭐' },
    date: '',
    time: ''
  });
  const [error, setError] = useState('');

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCompetitionChange = (value: string) => {
    setFormData(prev => ({ ...prev, competition: { ...prev.competition, name: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { homeTeam, awayTeam, date, time } = formData;
    if (!homeTeam || !awayTeam || !date || !time) {
      setError('Tutti i campi sono obbligatori.');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <Label htmlFor="homeTeam">Squadra Casa</Label>
        <Input
          id="homeTeam"
          placeholder="Es: Roma"
          value={formData.homeTeam}
          onChange={(e) => handleChange('homeTeam', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="awayTeam">Squadra Ospite</Label>
        <Input
          id="awayTeam"
          placeholder="Es: Lazio"
          value={formData.awayTeam}
          onChange={(e) => handleChange('awayTeam', e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="competition">Competizione</Label>
        <Input
          id="competition"
          placeholder="Es: Serie A"
          value={formData.competition.name === 'Partita personalizzata' ? '' : formData.competition.name}
          onChange={(e) => handleCompetitionChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="time">Orario</Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" className="bg-fanzo-teal">
          Crea Partita
        </Button>
      </div>
    </form>
  );
};

export default ManualMatchForm; 