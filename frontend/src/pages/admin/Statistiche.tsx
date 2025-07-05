import { TrendingUp, Eye, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Statistiche = () => {
  return (
    <div className="space-y-6">
      <h2 className="font-racing text-2xl text-fanzo-dark">STATISTICHE</h2>

      {/* Time Filter Tabs */}
      <Tabs defaultValue="7days" className="w-full">
        <TabsList className="bg-fanzo-light-bg">
          <TabsTrigger value="7days" className="font-kanit">7 Giorni</TabsTrigger>
          <TabsTrigger value="30days" className="font-kanit">30 Giorni</TabsTrigger>
          <TabsTrigger value="90days" className="font-kanit">90 Giorni</TabsTrigger>
          <TabsTrigger value="all" className="font-kanit">Tutto</TabsTrigger>
        </TabsList>

        <TabsContent value="7days" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white border-fanzo-teal/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-fanzo-yellow rounded-lg">
                    <Eye className="h-6 w-6 text-fanzo-dark" />
                  </div>
                  <div>
                    <p className="font-kanit text-2xl font-bold text-fanzo-dark">892</p>
                    <p className="font-kanit text-sm text-gray-600 uppercase tracking-wide">
                      Visualizzazioni
                    </p>
                    <p className="font-kanit text-xs text-green-600">+12% vs settimana scorsa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-fanzo-teal/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-fanzo-yellow rounded-lg">
                    <TrendingUp className="h-6 w-6 text-fanzo-dark" />
                  </div>
                  <div>
                    <p className="font-kanit text-2xl font-bold text-fanzo-dark">145</p>
                    <p className="font-kanit text-sm text-gray-600 uppercase tracking-wide">
                      Click
                    </p>
                    <p className="font-kanit text-xs text-green-600">+8% vs settimana scorsa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-fanzo-teal/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-fanzo-yellow rounded-lg">
                    <Users className="h-6 w-6 text-fanzo-dark" />
                  </div>
                  <div>
                    <p className="font-kanit text-2xl font-bold text-fanzo-dark">23</p>
                    <p className="font-kanit text-sm text-gray-600 uppercase tracking-wide">
                      Prenotazioni
                    </p>
                    <p className="font-kanit text-xs text-green-600">+15% vs settimana scorsa</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-fanzo-teal/20">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-fanzo-yellow rounded-lg">
                    <Calendar className="h-6 w-6 text-fanzo-dark" />
                  </div>
                  <div>
                    <p className="font-kanit text-2xl font-bold text-fanzo-dark">6</p>
                    <p className="font-kanit text-sm text-gray-600 uppercase tracking-wide">
                      Partite Pubblicate
                    </p>
                    <p className="font-kanit text-xs text-gray-500">Questa settimana</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Placeholder */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                ANDAMENTO VISUALIZZAZIONI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-fanzo-light-bg rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-fanzo-teal mx-auto mb-4" />
                  <p className="font-kanit text-lg text-fanzo-dark">Grafico Interattivo</p>
                  <p className="font-kanit text-sm text-gray-600">
                    Visualizzazioni e click negli ultimi 7 giorni
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Fixtures */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-racing text-xl text-fanzo-dark">
                PARTITE PIÙ VISUALIZZATE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-fanzo-light-bg rounded-lg">
                  <div>
                    <p className="font-kanit font-semibold text-fanzo-dark">Arsenal vs Chelsea</p>
                    <p className="font-kanit text-sm text-gray-600">Premier League • 15 Gen 21:00</p>
                  </div>
                  <div className="text-right">
                    <p className="font-kanit text-lg font-bold text-fanzo-dark">234 visualizzazioni</p>
                    <p className="font-kanit text-sm text-green-600">45 click</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-fanzo-light-bg rounded-lg">
                  <div>
                    <p className="font-kanit font-semibold text-fanzo-dark">Inter vs Juventus</p>
                    <p className="font-kanit text-sm text-gray-600">Serie A • 20 Gen 15:00</p>
                  </div>
                  <div className="text-right">
                    <p className="font-kanit text-lg font-bold text-fanzo-dark">189 visualizzazioni</p>
                    <p className="font-kanit text-sm text-green-600">32 click</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-fanzo-light-bg rounded-lg">
                  <div>
                    <p className="font-kanit font-semibold text-fanzo-dark">Man City vs Real Madrid</p>
                    <p className="font-kanit text-sm text-gray-600">Champions League • 18 Gen 18:30</p>
                  </div>
                  <div className="text-right">
                    <p className="font-kanit text-lg font-bold text-fanzo-dark">156 visualizzazioni</p>
                    <p className="font-kanit text-sm text-green-600">28 click</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other time periods would show similar content with different data */}
        <TabsContent value="30days">
          <p className="font-kanit text-gray-600">Statistiche degli ultimi 30 giorni...</p>
        </TabsContent>
        <TabsContent value="90days">
          <p className="font-kanit text-gray-600">Statistiche degli ultimi 90 giorni...</p>
        </TabsContent>
        <TabsContent value="all">
          <p className="font-kanit text-gray-600">Tutte le statistiche...</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistiche;
