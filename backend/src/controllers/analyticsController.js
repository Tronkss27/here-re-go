const MatchAnnouncement = require('../models/MatchAnnouncement');
const Fixture = require('../models/Fixture');
const sportsApiService = require('../services/sportsApiService');
const PopularMatch = require('../models/PopularMatch');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const Review = require('../models/Review');
const Offer = require('../models/Offer');
const mongoose = require('mongoose');

function parseRange(query) {
  const now = new Date();
  const to = query.to ? new Date(query.to) : now;
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to };
}

class AnalyticsController {
  async getVenueOverview(req, res) {
    try {
      const { venueId } = req.params;
      const { from, to } = parseRange(req.query);

      // Views/Clicks per venue (cumulativi, fallback)
      const annAgg = await MatchAnnouncement.aggregate([
        { $match: { venueId: new mongoose.Types.ObjectId(venueId) } },
        { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' }, total: { $sum: 1 } } }
      ]);
      const annStats = annAgg[0] || { views: 0, clicks: 0, total: 0 };

      // Preferisci dati recenti dalla collezione analyticsdaily nel range richiesto
      let rangeViews = 0;
      let rangeClicks = 0;
      try {
        const dateFrom = from.toISOString().slice(0,10);
        const dateTo = to.toISOString().slice(0,10);
        let tenant = req.tenantId || null
        if (!tenant) {
          try {
            const v = await Venue.findById(venueId).select('tenantId').lean()
            if (v && v.tenantId) tenant = String(v.tenantId)
          } catch (_) {}
        }
        const dailyAgg = await mongoose.connection.collection('analyticsdaily').aggregate([
          { $match: { tenantId: tenant || 'default', venueId: new mongoose.Types.ObjectId(venueId), date: { $gte: dateFrom, $lte: dateTo }, metric: { $in: ['views','clicks'] } } },
          { $group: { _id: '$metric', total: { $sum: '$count' } } }
        ]).toArray();
        for (const r of dailyAgg) {
          if (r._id === 'views') rangeViews = r.total || 0;
          if (r._id === 'clicks') rangeClicks = r.total || 0;
        }
      } catch (e) {
        // se fallisce, usa solo annStats
      }

      // Fixtures counts (upcoming based on match.date string yyyy-mm-dd)
      const todayStr = new Date().toISOString().split('T')[0];
      const fixturesTotal = await MatchAnnouncement.countDocuments({ venueId: new mongoose.Types.ObjectId(venueId) });
      const fixturesUpcoming = await MatchAnnouncement.countDocuments({ venueId: new mongoose.Types.ObjectId(venueId), 'match.date': { $gte: todayStr } });

      // Bookings stats in range (safe fallback)
      let bookings = { total: 0 };
      try {
        const bookingGroups = await Booking.getBookingStats(venueId, from, to);
        if (Array.isArray(bookingGroups)) {
          bookings = bookingGroups.reduce((acc, g) => { acc[g._id] = g.count; return acc; }, { total: bookingGroups.reduce((a, g) => a + g.count, 0) });
        }
      } catch (e) {
        // fallback: nessun dato booking
      }

      // Reviews stats (approvate, cumulative) - safe fallback
      let reviewStats = { totalReviews: 0, averageRating: 0 };
      try {
        const reviewStatsAgg = await Review.getVenueStats(venueId);
        reviewStats = (reviewStatsAgg && reviewStatsAgg[0]) || reviewStats;
      } catch (e) {
        // fallback: nessun dato review
      }

      // Offers analytics (in range, se disponibili)
      let offers = { count: 0, redemptions: 0, savings: 0 };
      try {
        const offerAgg = await Offer.getAnalytics(venueId, from, to);
        if (Array.isArray(offerAgg)) {
          offers = offerAgg.reduce((acc, r) => {
            acc.count += r.count || 0; acc.redemptions += r.totalRedemptions || 0; acc.savings += r.totalSavings || 0; return acc;
          }, { count: 0, redemptions: 0, savings: 0 });
        }
      } catch (e) {
        // opzionale, non blocca
      }

      // Se la timeseries nel range ha dati, usa quelli; altrimenti fallback sui cumulativi salvati sugli annunci
      const views = (rangeViews && rangeViews > 0) ? rangeViews : (annStats.views || 0);
      const clicks = (rangeClicks && rangeClicks > 0) ? rangeClicks : (annStats.clicks || 0);
      const ctr = views > 0 ? Math.round((clicks / views) * 10000) / 100 : 0; // percentuale con 2 decimali

      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.set('Pragma', 'no-cache')
      res.set('Expires', '0')
      res.json({
        success: true,
        data: {
          timeRange: { from, to },
          views,
          clicks,
          ctr,
          bookings,
          fixtures: { total: fixturesTotal, upcoming: fixturesUpcoming },
          reviews: { total: reviewStats.totalReviews || 0, average: reviewStats.averageRating || 0 },
          offers
        }
      });
    } catch (error) {
      console.error('❌ Error in getVenueOverview:', error);
      res.status(500).json({ success: false, message: 'Errore analytics overview' });
    }
  }

  async getVenueTop(req, res) {
    try {
      const { venueId } = req.params;
      const metric = (req.query.metric || 'views').toLowerCase();
      const allowedMetrics = ['views', 'clicks'];
      if (!allowedMetrics.includes(metric)) {
        return res.status(400).json({ success: false, message: 'Invalid metric. Use views|clicks' });
      }
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

      const agg = await MatchAnnouncement.aggregate([
        { $match: { venueId: new mongoose.Types.ObjectId(venueId), status: { $ne: 'archived' } } },
        { $group: {
            _id: '$match.id',
            homeTeam: { $first: '$match.homeTeam' },
            awayTeam: { $first: '$match.awayTeam' },
            date: { $first: '$match.date' },
            views: { $sum: '$views' },
            clicks: { $sum: '$clicks' }
        } },
        { $sort: { [metric]: -1 } },
        { $limit: limit }
      ]);

      const items = agg.map(r => ({
        id: r._id,
        name: `${r.homeTeam} vs ${r.awayTeam}`,
        date: r.date,
        value: r[metric] || 0
      }));

      res.json({ success: true, data: { metric, items } });
    } catch (error) {
      console.error('❌ Error in getVenueTop:', error);
      res.status(500).json({ success: false, message: 'Errore analytics top' });
    }
  }

  async getVenueTimeseries(req, res) {
    try {
      const { venueId } = req.params;
      const metric = (req.query.metric || 'views').toLowerCase();
      const allowedMetrics = ['views', 'clicks'];
      if (!allowedMetrics.includes(metric)) {
        return res.status(400).json({ success: false, message: 'Invalid metric. Use views|clicks' });
      }
      const { from, to } = parseRange(req.query);

      // Legge dalla collezione analyticsdaily creata via upsert nel tracking
      let tenant = req.tenantId || null
      if (!tenant) {
        try {
          const v = await Venue.findById(venueId).select('tenantId').lean()
          if (v && v.tenantId) tenant = String(v.tenantId)
        } catch (_) {}
      }
      const rows = await mongoose.connection.collection('analyticsdaily')
        .find({
          tenantId: tenant || 'default',
          venueId: new mongoose.Types.ObjectId(venueId),
          metric,
          date: { $gte: from.toISOString().slice(0,10), $lte: to.toISOString().slice(0,10) }
        })
        .sort({ date: 1 })
        .toArray();

      const points = rows.map(r => ({ t: r.date, value: r.count }));
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.set('Pragma', 'no-cache')
      res.set('Expires', '0')
      res.json({ success: true, data: { metric, points, from, to } });
    } catch (error) {
      console.error('❌ Error in getVenueTimeseries:', error);
      res.status(500).json({ success: false, message: 'Errore analytics timeseries' });
    }
  }

  async trackProfileView(req, res) {
    try {
      const { venueId, matchId } = req.body || {}
      if (!venueId) return res.status(400).json({ success: false, message: 'venueId required' })
      const dateStr = new Date().toISOString().split('T')[0]
      const headerPresent = !!req.headers['x-tenant-id']
      const tenantFromHeader = req.tenantId ? String(req.tenantId) : null
      let tenantFromVenue = null
      try {
        const v = await Venue.findById(venueId).select('tenantId').lean()
        if (v && v.tenantId) tenantFromVenue = String(v.tenantId)
      } catch (_) {}
      // Regola: se l'header manca (es. pubblico) usiamo OBBLIGATORIAMENTE il tenant del venue
      // Se entrambi presenti ma diversi, prevale il venue (più affidabile per attribution)
      const tenant = headerPresent ? (tenantFromVenue || tenantFromHeader) : tenantFromVenue
      if (!tenant) {
        return res.status(400).json({ success: false, message: 'Tenant context not resolved for profile-view' })
      }
      const filter = { tenantId: tenant || 'default', venueId: new mongoose.Types.ObjectId(venueId), date: dateStr, metric: 'views' }
      if (matchId) filter.matchId = String(matchId)
      await mongoose.connection.collection('analyticsdaily').updateOne(
        filter,
        { $inc: { count: 1 } },
        { upsert: true }
      )
      res.json({ success: true })
    } catch (error) {
      console.error('❌ Error in trackProfileView:', error)
      res.status(500).json({ success: false, message: 'Errore track profile view' })
    }
  }

  async trackProfileClick(req, res) {
    try {
      const { venueId, matchId } = req.body || {}
      if (!venueId) return res.status(400).json({ success: false, message: 'venueId required' })
      const dateStr = new Date().toISOString().split('T')[0]
      const headerPresent = !!req.headers['x-tenant-id']
      const tenantFromHeader = req.tenantId ? String(req.tenantId) : null
      let tenantFromVenue = null
      try {
        const v = await Venue.findById(venueId).select('tenantId').lean()
        if (v && v.tenantId) tenantFromVenue = String(v.tenantId)
      } catch (_) {}
      const tenant = headerPresent ? (tenantFromVenue || tenantFromHeader) : tenantFromVenue
      if (!tenant) {
        return res.status(400).json({ success: false, message: 'Tenant context not resolved for profile-click' })
      }
      const filter = { tenantId: tenant || 'default', venueId: new mongoose.Types.ObjectId(venueId), date: dateStr, metric: 'clicks' }
      if (matchId) filter.matchId = String(matchId)
      await mongoose.connection.collection('analyticsdaily').updateOne(
        filter,
        { $inc: { count: 1 } },
        { upsert: true }
      )
      res.json({ success: true })
    } catch (error) {
      console.error('❌ Error in trackProfileClick:', error)
      res.status(500).json({ success: false, message: 'Errore track profile click' })
    }
  }

  async trackMatchClick(req, res) {
    try {
      const { matchId } = req.body || {}
      if (!matchId) return res.status(400).json({ success: false, message: 'matchId required' })
      const dateStr = new Date().toISOString().split('T')[0]
      // Daily metric
      await mongoose.connection.collection('analyticsdaily').updateOne(
        { tenantId: req.tenantId || 'default', matchId: String(matchId), date: dateStr, metric: 'match_clicks' },
        { $inc: { count: 1 } },
        { upsert: true }
      )
      // Aggregato totale
      try {
        await mongoose.model('PopularMatch').updateOne(
          { matchId: String(matchId) },
          { $inc: { totalClicks: 1 } },
          { upsert: true }
        )
      } catch {}
      res.json({ success: true })
    } catch (error) {
      console.error('❌ Error in trackMatchClick:', error)
      res.status(500).json({ success: false, message: 'Errore track match click' })
    }
  }

  async getTopMatches(req, res) {
    try {
      const { from, to } = parseRange(req.query)
      const dateFrom = from.toISOString().slice(0,10)
      const dateTo = to.toISOString().slice(0,10)
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
      // Se global=true, aggrega su TUTTI i tenant (scope globale). Altrimenti filtra per tenant corrente
      const isGlobal = String(req.query.global).toLowerCase() === 'true' || String(req.query.global) === '1'
      const matchFilter = {
        metric: 'match_clicks',
        date: { $gte: dateFrom, $lte: dateTo }
      }
      if (!isGlobal) {
        matchFilter.tenantId = req.tenantId || 'default'
      }
      const rows = await mongoose.connection.collection('analyticsdaily').aggregate([
        { $match: matchFilter },
        { $group: { _id: '$matchId', clicks: { $sum: '$count' } } },
        { $sort: { clicks: -1 } },
        { $limit: limit }
      ]).toArray()
      let items = rows.map(r => ({ matchId: String(r._id), clicks: r.clicks }))

      // === Batch enrich (DB-only) ===
      const ids = items.map(i => i.matchId)
      const [pms, fxs, anns] = await Promise.all([
        PopularMatch.find({ matchId: { $in: ids } }).lean(),
        Fixture.find({ fixtureId: { $in: ids } }).lean(),
        MatchAnnouncement.find({ 'match.id': { $in: ids } }, { match: 1 }).lean()
      ])
      const pmById = new Map(pms.map(pm => [String(pm.matchId), pm]))
      const fxById = new Map(fxs.map(fx => [String(fx.fixtureId), fx]))
      const annById = new Map(anns.map(a => [String(a.match?.id), a]))

      items = items.map(it => {
        const id = it.matchId
        const pm = pmById.get(id)
        const fx = fxById.get(id)
        const ann = annById.get(id)
        const computed = {}
        if (pm) {
          computed.title = `${pm.homeTeam || 'Home'} vs ${pm.awayTeam || 'Away'}`
          computed.homeTeamLogo = pm.homeTeamLogo || null
          computed.awayTeamLogo = pm.awayTeamLogo || null
          computed.leagueLogo = pm.leagueLogo || null
          computed.leagueName = pm.league || null
          computed.kickoff = pm.date ? new Date(pm.date) : null
        } else if (fx) {
          computed.title = `${fx.homeTeam?.name || 'Home'} vs ${fx.awayTeam?.name || 'Away'}`
          computed.homeTeamLogo = fx.homeTeam?.logo || null
          computed.awayTeamLogo = fx.awayTeam?.logo || null
          computed.leagueLogo = fx.league?.logo || null
          computed.leagueName = fx.league?.name || null
          computed.kickoff = fx.date || null
        } else if (ann && ann.match) {
          computed.title = `${ann.match.homeTeam} vs ${ann.match.awayTeam}`
          computed.homeTeamLogo = ann.match.homeTeamLogo || null
          computed.awayTeamLogo = ann.match.awayTeamLogo || null
          computed.leagueLogo = ann.match.competition?.logo || null
          computed.leagueName = ann.match.competition?.name || null
          computed.kickoff = ann.match.date ? new Date(ann.match.date) : null
        }
        const league = (computed.leagueName || computed.leagueLogo)
          ? { name: computed.leagueName || null, logo: computed.leagueLogo || null }
          : undefined
        return { ...it, title: computed.title || it.title, homeTeamLogo: computed.homeTeamLogo || it.homeTeamLogo, awayTeamLogo: computed.awayTeamLogo || it.awayTeamLogo, league, _computed: computed }
      })
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.set('Pragma', 'no-cache')
      res.set('Expires', '0')
      res.json({ success: true, data: { items, from, to } })
    } catch (error) {
      console.error('❌ Error in getTopMatches:', error)
      res.status(500).json({ success: false, message: 'Errore top matches' })
    }
  }

  async getVenueMatchTraffic(req, res) {
    try {
      const { venueId } = req.params
      const { from, to } = parseRange(req.query)
      const dateFrom = from.toISOString().slice(0,10)
      const dateTo = to.toISOString().slice(0,10)
      // Fallback tenant come nelle POST: se manca req.tenantId, risolvi dal Venue
      let tenant = req.tenantId || null
      if (!tenant) {
        try {
          const v = await Venue.findById(venueId).select('tenantId').lean()
          if (v && v.tenantId) tenant = String(v.tenantId)
        } catch (_) {}
      }
      const rows = await mongoose.connection.collection('analyticsdaily').aggregate([
        { $match: { tenantId: tenant || 'default', venueId: new mongoose.Types.ObjectId(venueId), matchId: { $exists: true }, date: { $gte: dateFrom, $lte: dateTo }, metric: { $in: ['views','clicks'] } } },
        { $group: { _id: { matchId: '$matchId', metric: '$metric' }, total: { $sum: '$count' } } },
        { $group: { _id: '$_id.matchId', views: { $sum: { $cond: [{ $eq: ['$_id.metric','views'] }, '$total', 0] } }, clicks: { $sum: { $cond: [{ $eq: ['$_id.metric','clicks'] }, '$total', 0] } } } },
        { $sort: { clicks: -1, views: -1 } }
      ]).toArray()
      // Enrich per ogni matchId
      // === Batch enrich (DB-only) ===
      const ids = rows.map(r => String(r._id))
      const [pms, fxs, anns] = await Promise.all([
        PopularMatch.find({ matchId: { $in: ids } }).lean(),
        Fixture.find({ fixtureId: { $in: ids } }).lean(),
        MatchAnnouncement.find({ 'match.id': { $in: ids } }, { match: 1 }).lean()
      ])
      const pmById = new Map(pms.map(pm => [String(pm.matchId), pm]))
      const fxById = new Map(fxs.map(fx => [String(fx.fixtureId), fx]))
      const annById = new Map(anns.map(a => [String(a.match?.id), a]))

      const items = rows.map(r => {
        const id = String(r._id)
        const pm = pmById.get(id)
        const fx = fxById.get(id)
        const ann = annById.get(id)
        const computed = {}
        if (pm) {
          computed.title = `${pm.homeTeam || 'Home'} vs ${pm.awayTeam || 'Away'}`
          computed.homeTeamLogo = pm.homeTeamLogo || null
          computed.awayTeamLogo = pm.awayTeamLogo || null
          computed.leagueLogo = pm.leagueLogo || null
          computed.kickoff = pm.date ? new Date(pm.date) : null
        } else if (fx) {
          computed.title = `${fx.homeTeam?.name || 'Home'} vs ${fx.awayTeam?.name || 'Away'}`
          computed.homeTeamLogo = fx.homeTeam?.logo || null
          computed.awayTeamLogo = fx.awayTeam?.logo || null
          computed.leagueLogo = fx.league?.logo || null
          computed.kickoff = fx.date || null
        } else if (ann && ann.match) {
          computed.title = `${ann.match.homeTeam} vs ${ann.match.awayTeam}`
          computed.homeTeamLogo = ann.match.homeTeamLogo || null
          computed.awayTeamLogo = ann.match.awayTeamLogo || null
          computed.leagueLogo = ann.match.competition?.logo || null
          computed.kickoff = ann.match.date ? new Date(ann.match.date) : null
        }
        const league = (computed.leagueName || computed.leagueLogo)
          ? { name: computed.leagueName || null, logo: computed.leagueLogo || null }
          : undefined
        return { matchId: id, views: r.views, clicks: r.clicks, title: computed.title, kickoff: computed.kickoff, homeTeamLogo: computed.homeTeamLogo, awayTeamLogo: computed.awayTeamLogo, league, _computed: computed }
      })
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.set('Pragma', 'no-cache')
      res.set('Expires', '0')
      res.json({ success: true, data: { items, from, to } })
    } catch (error) {
      console.error('❌ Error in getVenueMatchTraffic:', error)
      res.status(500).json({ success: false, message: 'Errore traffico match per venue' })
    }
  }

  // ===== DEBUG ENDPOINTS =====
  async debugFixture(req, res) {
    try {
      const { id } = req.params
      let fx = await Fixture.findOne({ fixtureId: String(id) }).lean()
      if (!fx && mongoose.Types.ObjectId.isValid(String(id))) {
        fx = await Fixture.findOne({ _id: new mongoose.Types.ObjectId(String(id)) }).lean()
      }
      if (!fx) return res.status(404).json({ success: false, message: 'Fixture not found' })
      res.json({ success: true, data: fx })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error debug fixture' })
    }
  }

  async debugAnnouncementByMatch(req, res) {
    try {
      const { id } = req.params
      const ann = await MatchAnnouncement.findOne({ 'match.id': String(id) }, { match: 1 }).lean()
      if (!ann) return res.status(404).json({ success: false, message: 'Announcement not found' })
      res.json({ success: true, data: ann })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error debug announcement' })
    }
  }

  async debugProviderFixture(req, res) {
    try {
      const { id } = req.params
      const fx = await sportsApiService.getFixtureById(String(id))
      if (!fx) return res.status(404).json({ success: false, message: 'Provider fixture not found' })
      res.json({ success: true, data: fx })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error debug provider fixture' })
    }
  }
}

module.exports = new AnalyticsController();


