import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, X } from 'lucide-react';

interface Competition {
  id: string;
  name: string;
  sport: string;
}

interface StepFavouritesProps {
  data: { selectedCompetitions: Competition[] };
  onUpdate: (data: { selectedCompetitions: Competition[] }) => void;
}

const StepFavourites: React.FC<StepFavouritesProps> = ({ data, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock competition data - in real app this would come from API
  const allCompetitions: Competition[] = [
    { id: '1', name: 'FIFA World Cup', sport: 'Football' },
    { id: '2', name: 'Italian Serie A', sport: 'Football' },
    { id: '3', name: 'Premier League', sport: 'Football' },
    { id: '4', name: 'Argentinian Copa Liga Profesional (Football)', sport: 'Football' },
    { id: '5', name: 'Argentinian Copa Liga Profesional Play-off (Football)', sport: 'Football' },
    { id: '6', name: 'Liga de las Americas (Basketball)', sport: 'Basketball' },
    { id: '7', name: 'Liga Sudamericana (Basketball)', sport: 'Basketball' },
    { id: '8', name: 'Spanish Liga ACB (Basketball)', sport: 'Basketball' },
    { id: '9', name: 'Spanish Liga Feminina (Basketball)', sport: 'Basketball' },
    { id: '10', name: 'Liga NOS (Football)', sport: 'Football' },
    { id: '11', name: 'Spanish La Liga (Football)', sport: 'Football' },
    { id: '12', name: 'Spanish Liga Asobal (Handball)', sport: 'Handball' },
    { id: '13', name: 'Spanish Liga Nacional (Futsal)', sport: 'Futsal' },
  ];

  const filteredCompetitions = allCompetitions.filter(comp =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !data.selectedCompetitions.find(selected => selected.id === comp.id)
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleAddCompetition = (competition: Competition) => {
    const newSelected = [...data.selectedCompetitions, competition];
    onUpdate({ selectedCompetitions: newSelected });
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveCompetition = (competitionId: string) => {
    const newSelected = data.selectedCompetitions.filter(comp => comp.id !== competitionId);
    onUpdate({ selectedCompetitions: newSelected });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">4 / 6</div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-black uppercase tracking-tight">
            FAVOURITES
          </h1>
          <Button variant="ghost" className="text-sm text-gray-600">
            Skip
          </Button>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">
          Is your pub popular with a particular set of supporters? Select any teams or competitions that you'd like to highlight to customers on your venue's profile.
        </p>
      </div>

      {/* Search Section */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search for sports"
            className="pl-10 border-yellow-400 focus:ring-yellow-400 focus:border-yellow-400"
            onFocus={() => setShowSuggestions(searchQuery.length > 0)}
          />
        </div>

        {/* Search Suggestions */}
        {showSuggestions && filteredCompetitions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-yellow-400 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
            {filteredCompetitions.slice(0, 10).map((competition) => (
              <button
                key={competition.id}
                onClick={() => handleAddCompetition(competition)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
                <span className="text-sm">{competition.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Competitions */}
      {data.selectedCompetitions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {data.selectedCompetitions.map((competition) => (
              <Badge
                key={competition.id}
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 border-yellow-300 px-3 py-1 flex items-center gap-2"
              >
                <span>{competition.name}</span>
                <button
                  onClick={() => handleRemoveCompetition(competition.id)}
                  className="ml-1 hover:text-yellow-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepFavourites; 