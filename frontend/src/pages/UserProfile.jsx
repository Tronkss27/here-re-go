import { useState, useEffect } from 'react';
import { User, Settings, Heart, Lock, MapPin, Star, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const { showSuccessModal, showErrorModal } = useModal();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    city: '',
    address: ''
  });
  
  const [preferences, setPreferences] = useState({
    favoriteTeams: [],
    preferredLocations: [],
    notifications: {
      matches: true,
      offers: true,
      bookings: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', label: 'Profilo', icon: User },
    { id: 'preferences', label: 'Preferenze', icon: Settings },
    { id: 'teams', label: 'Squadre', icon: Heart },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'location', label: 'Localizzazione', icon: MapPin },
    { id: 'spots', label: 'Spots Preferiti', icon: Star }
  ];

  const handleSaveProfile = async () => {
    try {
      // Qui farai la chiamata API per aggiornare il profilo
      await updateUser(formData);
      setIsEditing(false);
      showSuccessModal('Profilo aggiornato con successo!');
    } catch (error) {
      showErrorModal('Errore nell\'aggiornamento del profilo');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showErrorModal('Le password non corrispondono');
      return;
    }
    
    try {
      // Qui farai la chiamata API per cambiare password
      showSuccessModal('Password aggiornata con successo!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showErrorModal('Errore nel cambio password');
    }
  };

  const renderProfileTab = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-kanit text-xl text-fanzo-dark">
            Informazioni Personali
          </CardTitle>
          <Button
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="bg-fanzo-teal hover:bg-fanzo-teal/90"
          >
            {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
            {isEditing ? 'Salva' : 'Modifica'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Nome Completo
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!isEditing}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Email
          </label>
          <Input
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isEditing}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Telefono
          </label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            placeholder="Inserisci il tuo numero di telefono"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderPreferencesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-kanit text-xl text-fanzo-dark">
          Preferenze di Notifica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-kanit font-medium text-fanzo-dark">Notifiche Partite</h4>
            <p className="text-sm text-gray-600">Ricevi notifiche per le partite delle tue squadre</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.notifications.matches}
            onChange={(e) => setPreferences({
              ...preferences,
              notifications: { ...preferences.notifications, matches: e.target.checked }
            })}
            className="h-4 w-4 text-fanzo-teal"
          />
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-kanit font-medium text-fanzo-dark">Offerte e Promozioni</h4>
            <p className="text-sm text-gray-600">Ricevi offerte dai tuoi locali preferiti</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.notifications.offers}
            onChange={(e) => setPreferences({
              ...preferences,
              notifications: { ...preferences.notifications, offers: e.target.checked }
            })}
            className="h-4 w-4 text-fanzo-teal"
          />
        </div>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-kanit font-medium text-fanzo-dark">Prenotazioni</h4>
            <p className="text-sm text-gray-600">Promemoria e aggiornamenti prenotazioni</p>
          </div>
          <input
            type="checkbox"
            checked={preferences.notifications.bookings}
            onChange={(e) => setPreferences({
              ...preferences,
              notifications: { ...preferences.notifications, bookings: e.target.checked }
            })}
            className="h-4 w-4 text-fanzo-teal"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderTeamsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-kanit text-xl text-fanzo-dark">
          Squadre del Cuore
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Cerca e aggiungi una squadra..."
              className="flex-1"
            />
            <Button className="bg-fanzo-teal hover:bg-fanzo-teal/90">
              Aggiungi
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-kanit">Le tue squadre preferite:</p>
            <div className="flex flex-wrap gap-2">
              {/* Esempio di squadre - da collegare al backend */}
              {['AC Milan', 'Manchester United'].map((team) => (
                <div key={team} className="flex items-center bg-fanzo-yellow/20 rounded-full px-3 py-1">
                  <span className="font-kanit text-sm text-fanzo-dark">{team}</span>
                  <X className="h-3 w-3 ml-2 cursor-pointer text-gray-500 hover:text-red-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPasswordTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-kanit text-xl text-fanzo-dark">
          Cambia Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Password Attuale
          </label>
          <Input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Nuova Password
          </label>
          <Input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Conferma Nuova Password
          </label>
          <Input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="w-full"
          />
        </div>
        
        <Button
          onClick={handlePasswordChange}
          className="bg-fanzo-teal hover:bg-fanzo-teal/90 w-full"
        >
          Aggiorna Password
        </Button>
      </CardContent>
    </Card>
  );

  const renderLocationTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-kanit text-xl text-fanzo-dark">
          Localizzazione
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Città
          </label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Milano"
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 font-kanit">
            Indirizzo
          </label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Via Roma 1"
            className="w-full"
          />
        </div>
        
        <Button className="bg-fanzo-teal hover:bg-fanzo-teal/90">
          Usa Posizione Attuale
        </Button>
      </CardContent>
    </Card>
  );

  const renderSpotsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="font-kanit text-xl text-fanzo-dark">
          Sport Bar Preferiti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600 font-kanit">I tuoi locali preferiti appariranno qui</p>
          <div className="space-y-2">
            {/* Esempio di spots - da collegare al backend */}
            {['Queens Head Shoreditch', 'Sports Café Milano'].map((spot) => (
              <div key={spot} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-kanit text-fanzo-dark">{spot}</span>
                </div>
                <Button variant="outline" size="sm">
                  Rimuovi
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'preferences': return renderPreferencesTab();
      case 'teams': return renderTeamsTab();
      case 'password': return renderPasswordTab();
      case 'location': return renderLocationTab();
      case 'spots': return renderSpotsTab();
      default: return renderProfileTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-racing text-fanzo-dark mb-2">
            Il Tuo Profilo
          </h1>
          <p className="text-gray-600 font-kanit">
            Gestisci le tue informazioni e preferenze
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-fanzo-yellow text-fanzo-dark'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="font-kanit font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 