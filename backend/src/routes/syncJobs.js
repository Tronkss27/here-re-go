const express = require('express');
const router = express.Router();
const jobQueue = require('../services/jobQueue');
const { auth } = require('../middlewares/auth');

// POST /api/sync-jobs - Crea nuovo job di sincronizzazione
router.post('/', auth, async (req, res) => {
  try {
    const { league, dateRange, syncInfo } = req.body;
    const userId = req.user.id;
    
    console.log(`🎯 Creating sync job: league=${league}, syncInfo=`, syncInfo);

    // Validazione input
    if (!league) {
      return res.status(400).json({
        success: false,
        message: 'League is required'
      });
    }

    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Date range with startDate and endDate is required'
      });
    }

    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Validazione date
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Limite massimo di 90 giorni per stabilità
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 90 days for system stability'
      });
    }

    // Crea job
    const result = await jobQueue.createSyncJob(
      league, 
      startDate.toISOString(), 
      endDate.toISOString(), 
      userId,
      syncInfo // ✅ Passa syncInfo al jobQueue
    );

    console.log(`📋 Created sync job for user ${userId}: ${league} (${daysDiff} days)`);

    res.json({
      success: true,
      message: `Sync job created for ${league}`,
      data: {
        jobId: result.jobId,
        league,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: daysDiff
        },
        estimatedDuration: result.estimatedDuration,
        estimatedDurationText: `${Math.ceil(result.estimatedDuration / 1000)} secondi`
      }
    });

  } catch (error) {
    console.error('❌ Error creating sync job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sync job',
      error: error.message
    });
  }
});

// GET /api/sync-jobs/:jobId - Ottieni status di un job
router.get('/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }

    const jobStatus = await jobQueue.getJobStatus(jobId);

    res.json({
      success: true,
      data: {
        ...jobStatus,
        isComplete: jobStatus.status === 'completed',
        isFailed: jobStatus.status === 'failed',
        isRunning: jobStatus.status === 'running',
        progressText: `${jobStatus.progress.processed}/${jobStatus.progress.total} (${jobStatus.progress.percentage}%)`,
        statusText: {
          pending: 'In attesa...',
          running: 'Sincronizzazione in corso...',
          completed: 'Completato',
          failed: 'Errore'
        }[jobStatus.status] || jobStatus.status
      }
    });

  } catch (error) {
    console.error('❌ Error getting job status:', error);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

// GET /api/sync-jobs - Lista job dell'utente (per debug/admin)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const SyncJob = require('../models/SyncJob');
    
    const jobs = await SyncJob.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('jobId league status progress results createdAt completedAt');

    res.json({
      success: true,
      data: jobs.map(job => ({
        jobId: job.jobId,
        league: job.league,
        status: job.status,
        progress: job.progress,
        results: job.results,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      }))
    });

  } catch (error) {
    console.error('❌ Error listing sync jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list sync jobs',
      error: error.message
    });
  }
});

module.exports = router;
