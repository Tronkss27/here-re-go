import { useState, useEffect } from 'react';
import { Bell, Globe, Lock, Mail, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { accountService } from '@/services/venueService';

interface AccountData {
  email: string;
  ownerName: string;
  phone: string;
  notifications: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
  };
}

const AccountSettings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Carica i dati dell'account
  useEffect(() => {
    if (user) {
      const data = accountService.getAccountData(user.id);
      if (data) {
        setAccountData(data);
      } else {
        // Crea dati iniziali se non esistono
        const initialData: AccountData = {
          email: user.email || '',
          ownerName: user.name || '',
          phone: '',
          notifications: {
    email: true,
    push: false,
            whatsapp: false
          },
          preferences: {
            language: 'it',
            timezone: 'Europe/Rome'
          }
        };
        setAccountData(initialData);
        accountService.saveAccountData(user.id, initialData);
      }
    }
  }, [user]);

  // Gestisce i cambiamenti nei dati account
  const handleAccountFieldChange = (field: string, value: any) => {
    if (!accountData) return;
    
    setAccountData({
      ...accountData,
      [field]: value
    });
  };

  // Gestisce i cambiamenti nelle notifiche
  const handleNotificationChange = (type: keyof AccountData['notifications'], value: boolean) => {
    if (!accountData) return;
    
    setAccountData({
      ...accountData,
      notifications: {
        ...accountData.notifications,
        [type]: value
      }
    });
  };

  // Gestisce i cambiamenti nelle preferenze
  const handlePreferenceChange = (type: keyof AccountData['preferences'], value: string) => {
    if (!accountData) return;
    
    setAccountData({
      ...accountData,
      preferences: {
        ...accountData.preferences,
        [type]: value
      }
    });
  };

  // Gestisce i cambiamenti nella password
  const handlePasswordChange = (field: string, value: string) => {
    setPasswords({
      ...passwords,
      [field]: value
    });
  };

  // Salva le modifiche
  const handleSave = async () => {
    if (!user || !accountData) return;
    
    try {
      setSaving(true);
      
      // Salva i dati account
      const updatedData = {
        ...accountData,
        updatedAt: new Date().toISOString()
      };
      
      accountService.saveAccountData(user.id, updatedData);
      
      setMessage({
        text: 'Impostazioni salvate con successo!',
        type: 'success'
      });
      
      // Rimuovi il messaggio dopo 3 secondi
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving account settings:', error);
      setMessage({
        text: 'Errore durante il salvataggio delle impostazioni.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Cambia password (mockato per ora)
  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({
        text: 'Le password non corrispondono.',
        type: 'error'
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({
        text: 'La password deve essere di almeno 6 caratteri.',
        type: 'error'
      });
      return;
    }

    // TODO: Implementare cambio password reale
    setMessage({
      text: 'Password aggiornata con successo!',
      type: 'success'
    });
    
    setPasswords({
      newPassword: '',
      confirmPassword: ''
    });
    
    setTimeout(() => setMessage(null), 3000);
  };

  // Elimina account (mockato per ora)
  const handleDeleteAccount = () => {
    if (window.confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.')) {
      // TODO: Implementare eliminazione account reale
      alert('Funzionalità di eliminazione account non ancora implementata.');
    }
  };

  if (!accountData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="font-racing text-2xl text-fanzo-dark mb-4">CARICAMENTO...</h2>
          <p className="font-kanit text-gray-600">
            Stiamo caricando le tue impostazioni account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      <h2 className="font-racing text-2xl text-fanzo-dark">IMPOSTAZIONI ACCOUNT</h2>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-fanzo-yellow hover:bg-fanzo-yellow/90 text-fanzo-dark"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Info */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-racing text-xl text-fanzo-dark flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              INFORMAZIONI ACCOUNT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-kanit font-semibold">Email di Login</Label>
              <Input 
                type="email"
                value={accountData.email}
                onChange={(e) => handleAccountFieldChange('email', e.target.value)}
                className="border-gray-300"
              />
              <p className="font-kanit text-xs text-gray-500 mt-1">
                Questa email viene utilizzata per accedere al tuo account
              </p>
            </div>
            <div>
              <Label className="font-kanit font-semibold">Nome Proprietario</Label>
              <Input 
                value={accountData.ownerName}
                onChange={(e) => handleAccountFieldChange('ownerName', e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div>
              <Label className="font-kanit font-semibold">Numero di Telefono</Label>
              <Input 
                value={accountData.phone}
                onChange={(e) => handleAccountFieldChange('phone', e.target.value)}
                className="border-gray-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-racing text-xl text-fanzo-dark flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              SICUREZZA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-kanit font-semibold">Nuova Password</Label>
              <Input 
                type="password"
                value={passwords.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Inserisci nuova password" 
                className="border-gray-300"
              />
            </div>
            <div>
              <Label className="font-kanit font-semibold">Conferma Password</Label>
              <Input 
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Conferma nuova password" 
                className="border-gray-300"
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              disabled={!passwords.newPassword || !passwords.confirmPassword}
              variant="outline"
              className="w-full border-fanzo-teal text-fanzo-teal hover:bg-fanzo-teal hover:text-white"
            >
              Cambia Password
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-racing text-xl text-fanzo-dark flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              NOTIFICHE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-kanit font-semibold">Notifiche Email</Label>
                <p className="font-kanit text-sm text-gray-600">
                  Ricevi aggiornamenti via email
                </p>
              </div>
              <Switch
                checked={accountData.notifications.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-kanit font-semibold">Notifiche Push</Label>
                <p className="font-kanit text-sm text-gray-600">
                  Ricevi notifiche push sul browser
                </p>
              </div>
              <Switch
                checked={accountData.notifications.push}
                onCheckedChange={(checked) => handleNotificationChange('push', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-kanit font-semibold">Notifiche WhatsApp</Label>
                <p className="font-kanit text-sm text-gray-600">
                  Ricevi messaggi su WhatsApp
                </p>
              </div>
              <Switch
                checked={accountData.notifications.whatsapp}
                onCheckedChange={(checked) => handleNotificationChange('whatsapp', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="font-racing text-xl text-fanzo-dark flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              PREFERENZE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-kanit font-semibold">Lingua Interfaccia</Label>
              <select 
                value={accountData.preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md font-kanit"
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <Label className="font-kanit font-semibold">Fuso Orario</Label>
              <select 
                value={accountData.preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md font-kanit"
              >
                <option value="Europe/Rome">Europa/Roma (UTC+1)</option>
                <option value="Europe/London">Europa/Londra (UTC+0)</option>
                <option value="America/New_York">America/New York (UTC-5)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              </select>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <Button 
                onClick={handleDeleteAccount}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Elimina Account
              </Button>
              <p className="font-kanit text-xs text-gray-500 mt-2 text-center">
                Questa azione è irreversibile
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
