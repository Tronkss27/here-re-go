const Agenda = require('agenda');
const SyncJob = require('../models/SyncJob');
const fixtureController = require('../controllers/fixtureController');
const { v4: uuidv4 } = require('uuid');

class JobQueue {
  constructor() {
    this.agenda = new Agenda({
      db: {
        address: process.env.MONGODB_URI,
        collection: 'agenda_jobs'
      },
      processEvery: '10 seconds',
      maxConcurrency: 2 // Max 2 sync jobs simultanei per stabilità
    });

    this.initializeJobs();
  }

  async initializeJobs() {
    // Definisce il job di sincronizzazione
    this.agenda.define('league_sync', { priority: 'high', concurrency: 1 }, async (job) => {
      const { jobId, league, startDate, endDate, createdBy, syncInfo } = job.attrs.data;
      
      console.log(`🎯 Job worker received syncInfo:`, syncInfo);
      
      try {
        console.log(`🚀 Starting sync job ${jobId} for ${league} (${startDate} to ${endDate})`);
        
        // ⏱️ Piccolo delay per permettere al frontend di iniziare polling
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trova il job nel DB
        const syncJob = await SyncJob.findOne({ jobId });
        if (!syncJob) {
          throw new Error(`SyncJob ${jobId} not found in database`);
        }

        // Aggiorna status a running
        console.log(`🔄 Setting job ${jobId} status to 'running' (was: ${syncJob.status})`);
        syncJob.status = 'running';
        await syncJob.save();
        console.log(`✅ Job ${jobId} status updated to: ${syncJob.status}`);

        // Calcola date range in chunks di 7 giorni per stabilità (max 30 giorni totali)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        if (totalDays > 30) {
          console.log(`⚠️ Limiting sync period from ${totalDays} to 30 days max`);
          end.setTime(start.getTime() + (30 * 24 * 60 * 60 * 1000));
        }
        
        const chunks = this.createDateChunks(start, end, 7);
        await syncJob.updateProgress(0, chunks.length, `Preparazione chunks: ${chunks.length} settimane`);

        let totalFixtures = 0;
        let newMatches = 0;
        let cacheHits = 0;

        // Processa ogni chunk
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkName = `${chunk.start.toISOString().split('T')[0]} - ${chunk.end.toISOString().split('T')[0]}`;
          
          try {
            console.log(`📅 Processing chunk ${i + 1}/${chunks.length}: ${chunkName}`);
            await syncJob.updateProgress(i, chunks.length, `Sincronizzando: ${chunkName}`);

            // Simula la chiamata del controller con req/res mock
            const mockReq = {
              user: { role: 'admin' }, // ✅ FIX: Aggiungi user per passare controllo auth
              body: {
                league,
                dateRange: {
                  startDate: chunk.start.toISOString(),
                  endDate: chunk.end.toISOString(),
                  days: Math.ceil((chunk.end - chunk.start) / (1000 * 60 * 60 * 24))
                },
                syncInfo // ✅ Passa syncInfo al controller V2
              }
            };

            let chunkResults = { cacheStats: { newMatches: 0, reusedMatches: 0, totalFixtures: 0 } };
            const mockRes = {
              json: (data) => { chunkResults = data; },
              status: (code) => ({ json: (data) => { if (code !== 200) throw new Error(JSON.stringify(data)); } })
            };

            // 🎯 Chiama il nuovo controller V2 con round-based filtering
            await fixtureController.syncFixturesV2(mockReq, mockRes);
            
            // Accumula risultati
            totalFixtures += chunkResults.cacheStats?.totalFixtures || 0;
            newMatches += chunkResults.cacheStats?.newMatches || 0;
            cacheHits += chunkResults.cacheStats?.reusedMatches || 0;

            // Piccola pausa tra chunks per stabilità
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (chunkError) {
            console.error(`❌ Error in chunk ${chunkName}:`, chunkError.message);
            await syncJob.addError(`Chunk ${chunkName}: ${chunkError.message}`, { chunk: chunkName });
            // Continua con il prossimo chunk invece di fallire tutto
          }
        }

        // Aggiorna risultati finali
        syncJob.results.totalFixtures = totalFixtures;
        syncJob.results.newMatches = newMatches;
        syncJob.results.cacheHits = cacheHits;
        
        console.log(`🔄 Calling updateProgress: ${chunks.length}/${chunks.length} - Current status: ${syncJob.status}`);
        await syncJob.updateProgress(chunks.length, chunks.length, 'Completato');
        console.log(`✅ Job ${jobId} final status: ${syncJob.status}`);

        console.log(`✅ Sync job ${jobId} completed: ${newMatches} new, ${cacheHits} cached, ${totalFixtures} total`);

      } catch (error) {
        console.error(`❌ Sync job ${jobId} failed:`, error.message);
        
        const syncJob = await SyncJob.findOne({ jobId });
        if (syncJob) {
          syncJob.status = 'failed';
          await syncJob.addError(`Job failed: ${error.message}`, { stack: error.stack });
        }
      }
    });

    // Avvia agenda
    await this.agenda.start();
    console.log('📋 Job queue initialized successfully');
  }

  // Crea chunks di date per processare in modo stabile
  createDateChunks(startDate, endDate, dayInterval = 7) {
    const chunks = [];
    let currentStart = new Date(startDate);
    
    while (currentStart < endDate) {
      let currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + dayInterval);
      
      // Non superare la data finale
      if (currentEnd > endDate) {
        currentEnd = new Date(endDate);
      }
      
      chunks.push({
        start: new Date(currentStart),
        end: new Date(currentEnd)
      });
      
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1); // Prossimo chunk inizia il giorno dopo
    }
    
    return chunks;
  }

  // Crea un nuovo job di sincronizzazione
  async createSyncJob(league, startDate, endDate, createdBy, syncInfo = null) {
    const jobId = uuidv4();
    
    // Crea record nel DB
    const syncJob = new SyncJob({
      jobId,
      league,
      dateRange: { startDate: new Date(startDate), endDate: new Date(endDate) },
      createdBy,
      status: 'pending'
    });
    await syncJob.save();

    // Stima durata (circa 30 secondi per settimana)
    const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const estimatedDuration = Math.ceil(daysDiff / 7) * 30000; // 30 sec per chunk
    syncJob.estimatedDuration = estimatedDuration;
    await syncJob.save();

    // Schedula job in agenda
    await this.agenda.now('league_sync', {
      jobId,
      league,
      startDate,
      endDate,
      createdBy,
      syncInfo // ✅ Passa syncInfo al job worker
    });

    console.log(`📋 Created sync job ${jobId} for ${league} (${startDate} to ${endDate})`);
    return { jobId, estimatedDuration };
  }

  // Ottieni status di un job
  async getJobStatus(jobId) {
    const syncJob = await SyncJob.findOne({ jobId });
    if (!syncJob) {
      throw new Error('Job not found');
    }

    return {
      jobId: syncJob.jobId,
      status: syncJob.status,
      league: syncJob.league,
      dateRange: syncJob.dateRange,
      progress: syncJob.progress,
      results: syncJob.results,
      errors: syncJob.errorDetails.length,
      createdAt: syncJob.createdAt,
      completedAt: syncJob.completedAt,
      estimatedDuration: syncJob.estimatedDuration
    };
  }

  // Cleanup job vecchi (opzionale per mantenere DB pulito)
  async cleanupOldJobs(daysOld = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await SyncJob.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['completed', 'failed'] }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old sync jobs`);
    return result.deletedCount;
  }

  async shutdown() {
    await this.agenda.stop();
    console.log('📋 Job queue stopped');
  }
}

module.exports = new JobQueue();
