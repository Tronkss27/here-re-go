import { useState } from 'react';
import { Search } from 'lucide-react';
import Header from '@/components/Header';
import UpcomingMatches from '@/components/UpcomingMatches';
import ClientLandingSection from '@/components/ClientLandingSection';
import { Input } from '@/components/ui/input';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Client Landing Section - only visible for authenticated clients */}
      <ClientLandingSection />
      
      {/* Main Content Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          {/* TROVA LOCALI Section matching screenshots */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-fanzo-dark mb-4 font-kanit">
              TROVA LOCALI
            </h2>
            <p className="text-xl text-gray-600 mb-8 font-kanit">
              Scopri dove guardare la partita nei migliori sport bar
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca per città, quartiere e indirizzo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-lg border-2 border-gray-200 focus:border-orange-500"
              />
            </div>
            
            {/* Filter Tags matching screenshots */}
            <div className="flex flex-wrap gap-3 mt-6">
              {['Wi-Fi', 'Grande schermo', 'Prenotabile', 'Giardino', 'Schermo esterno', 'Servi cibo', 'Pet friendly', 'Commentatore'].map((filter) => (
                <span
                  key={filter}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium font-kanit border"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Matches */}
      <UpcomingMatches />

      {/* Footer */}
      <footer className="bg-fanzo-light py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 font-kanit">
            © 2025 BarMatch • Privacy • Termini
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
