import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';
import matchAnnouncementService from '@/services/matchAnnouncementService';

// Template offerte predefinite
const TEMPLATE_OFFERS = [
  {
    id: 'template_birra_panino',
    title: 'Birra + Panino',
    description: 'Birra media + panino a scelta durante la partita'
  },
  {
    id: 'template_aperitivo',
    title: 'Aperitivo Partita',
    description: 'Aperitivo con stuzzichini durante il primo tempo'
  },
  {
    id: 'template_pizza_birra',
    title: 'Pizza + Birra',
    description: 'Pizza margherita + birra media durante la partita'
  },
  {
    id: 'template_tavolo_riservato',
    title: 'Tavolo Riservato',
    description: 'Tavolo riservato con vista schermo per tutta la partita'
  },
  {
    id: 'template_happy_hour',
    title: 'Happy Hour Esteso',
    description: 'Prezzi happy hour per tutta la durata della partita'
  }
];

interface EditMatchAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcementId: string;
  onSuccess: () => void;
}

interface AnnouncementData {
  _id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: {
      name: string;
      logo: string;
    };
    date: string;
    time: string;
  };
  status: 'published' | 'draft' | 'archived';
  eventDetails: {
    description?: string;
    selectedOffers?: Array<{
      id: string;
      title: string;
      description: string;
    }>;
  };
  views: number;
  clicks: number;
}

const EditMatchAnnouncementModal: React.FC<EditMatchAnnouncementModalProps> = ({
  isOpen,
  onClose,
  announcementId,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    status: 'published' as 'published' | 'draft' | 'archived',
    offers: [] as Array<{
      id: string;
      title: string;
      description: string;
    }>
  });

  // Carica i dati dell'annuncio
  useEffect(() => {
    if (isOpen && announcementId) {
      loadAnnouncement();
    }
  }, [isOpen, announcementId]);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      const result = await matchAnnouncementService.getAnnouncement(announcementId);
      
      if (result.success && result.data) {
        setAnnouncement(result.data);
        setFormData({
          description: result.data.eventDetails?.description || '',
          status: result.data.status,
          offers: result.data.eventDetails?.selectedOffers || []
        });
      }
    } catch (error) {
      console.error('❌ Error loading announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!announcement) return;

    try {
      setSaving(true);
      
      // Filtra offerte vuote
      const validOffers = formData.offers.filter(offer => 
        offer.title.trim() || offer.description.trim()
      );

      const updateData = {
        eventDetails: {
          ...announcement.eventDetails,
          description: formData.description,
          selectedOffers: validOffers
        },
        status: formData.status
      };

      const result = await matchAnnouncementService.updateAnnouncement(announcementId, updateData);
      
      if (result.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('❌ Error updating announcement:', error);
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    const newOffer = {
      id: `offer_${Date.now()}`,
      title: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      offers: [...prev.offers, newOffer]
    }));
  };

  const addTemplateOffer = (template: typeof TEMPLATE_OFFERS[0]) => {
    const newOffer = {
      id: `${template.id}_${Date.now()}`,
      title: template.title,
      description: template.description
    };
    setFormData(prev => ({
      ...prev,
      offers: [...prev.offers, newOffer]
    }));
    setShowTemplates(false);
  };

  const updateOffer = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      offers: prev.offers.map((offer, i) => 
        i === index ? { ...offer, [field]: value } : offer
      )
    }));
  };

  const removeOffer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offers: prev.offers.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifica Annuncio</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Caricamento...</span>
          </div>
        ) : announcement ? (
          <div className="space-y-6">
            {/* Info Partita (Read-only) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {announcement.match.homeTeam} vs {announcement.match.awayTeam}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {announcement.match.competition.name} • {' '}
                      {new Date(announcement.match.date).toLocaleDateString('it-IT')} • {' '}
                      {announcement.match.time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>👁️ {announcement.views}</span>
                    <span>🖱️ {announcement.clicks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status Annuncio</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="published">Pubblicato</option>
                <option value="draft">Bozza</option>
                <option value="archived">Archiviato</option>
              </select>
            </div>

            {/* Descrizione */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione Evento</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrivi l'evento e l'atmosfera del tuo locale..."
                rows={4}
              />
            </div>

            {/* Offerte */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Offerte Speciali</Label>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowTemplates(!showTemplates)} 
                    variant="outline" 
                    size="sm"
                  >
                    📋 Template
                  </Button>
                  <Button onClick={addOffer} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi Offerta
                  </Button>
                </div>
              </div>

              {/* Template Offerte */}
              {showTemplates && (
                <Card className="p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Seleziona da Template:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {TEMPLATE_OFFERS.map((template) => (
                      <Button
                        key={template.id}
                        onClick={() => addTemplateOffer(template)}
                        variant="ghost"
                        className="justify-start h-auto p-3 text-left"
                      >
                        <div>
                          <div className="font-medium">{template.title}</div>
                          <div className="text-xs text-gray-500">{template.description}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </Card>
              )}

              {formData.offers.map((offer, index) => (
                <Card key={offer.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Offerta {index + 1}</h4>
                      <Button
                        onClick={() => removeOffer(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Titolo Offerta</Label>
                        <Input
                          value={offer.title}
                          onChange={(e) => updateOffer(index, 'title', e.target.value)}
                          placeholder="es. Birra + Panino"
                        />
                      </div>
                      <div>
                        <Label>Descrizione</Label>
                        <Textarea
                          value={offer.description}
                          onChange={(e) => updateOffer(index, 'description', e.target.value)}
                          placeholder="Dettagli dell'offerta..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Azioni */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salva Modifiche
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p>Errore nel caricamento dell'annuncio</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditMatchAnnouncementModal; 