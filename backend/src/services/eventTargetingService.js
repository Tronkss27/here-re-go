const Offer = require('../models/Offer')
const Fixture = require('../models/Fixture')

class EventTargetingService {
  /**
   * Check and auto-activate offers based on upcoming fixtures
   */
  async processAutoActivation() {
    try {
      // Get all offers with auto-activation enabled
      const offers = await Offer.findForAutoActivation()
      
      // Get upcoming fixtures for the next 2 hours
      const now = new Date()
      const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000))
      
      const upcomingFixtures = await Fixture.find({
        date: { $gte: now, $lte: twoHoursFromNow },
        status: 'scheduled',
        isActive: true
      })

      const activatedOffers = []
      const deactivatedOffers = []

      for (const offer of offers) {
        let shouldActivate = false
        let shouldDeactivate = false

        // Check each upcoming fixture
        for (const fixture of upcomingFixtures) {
          if (offer.shouldAutoActivate(fixture)) {
            shouldActivate = true
            break
          }
        }

        // Check if offer should be deactivated (match ended)
        if (offer.status === 'active' && offer.eventTargeting.autoActivation.enabled) {
          const relevantFixtures = await this.getRelevantFixtures(offer)
          shouldDeactivate = relevantFixtures.every(fixture => {
            const matchTime = new Date(fixture.date)
            const deactivationTime = new Date(matchTime.getTime() + (offer.eventTargeting.autoActivation.minutesAfter * 60 * 1000))
            return now > deactivationTime || fixture.status === 'finished'
          })
        }

        // Update offer status
        if (shouldActivate && offer.status === 'draft') {
          offer.status = 'active'
          await offer.save()
          activatedOffers.push(offer)
        } else if (shouldDeactivate && offer.status === 'active') {
          offer.status = 'paused'
          await offer.save()
          deactivatedOffers.push(offer)
        }
      }

      return {
        activated: activatedOffers.length,
        deactivated: deactivatedOffers.length,
        activatedOffers,
        deactivatedOffers
      }
    } catch (error) {
      console.error('Error in auto-activation process:', error)
      throw error
    }
  }

  /**
   * Get fixtures relevant to an offer's targeting settings
   */
  async getRelevantFixtures(offer) {
    const query = { isActive: true }

    if (offer.eventTargeting.fixtures.length > 0) {
      query._id = { $in: offer.eventTargeting.fixtures }
    } else {
      const orConditions = []

      if (offer.eventTargeting.leagues.length > 0) {
        orConditions.push({
          'league.id': { $in: offer.eventTargeting.leagues.map(l => l.id) }
        })
      }

      if (offer.eventTargeting.teams.length > 0) {
        const teamIds = offer.eventTargeting.teams.map(t => t.id)
        orConditions.push({
          $or: [
            { 'homeTeam.id': { $in: teamIds } },
            { 'awayTeam.id': { $in: teamIds } }
          ]
        })
      }

      if (orConditions.length > 0) {
        query.$or = orConditions
      }
    }

    return await Fixture.find(query).sort({ date: 1 })
  }

  /**
   * Get offers active for a specific fixture
   */
  async getOffersForFixture(venueId, fixtureId) {
    try {
      const fixture = await Fixture.findById(fixtureId)
      if (!fixture) {
        throw new Error('Fixture not found')
      }

      const offers = await Offer.findByEvent(venueId, fixture)
      
      // Filter offers that are actually active for this event
      const activeOffers = offers.filter(offer => offer.isActiveForEvent(fixture))

      return activeOffers
    } catch (error) {
      console.error('Error getting offers for fixture:', error)
      throw error
    }
  }

  /**
   * Get available leagues for targeting
   */
  async getAvailableLeagues() {
    try {
      const leagues = await Fixture.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$league.id',
            name: { $first: '$league.name' },
            country: { $first: '$league.country' },
            logo: { $first: '$league.logo' },
            fixtureCount: { $sum: 1 }
          }
        },
        { $sort: { fixtureCount: -1 } }
      ])

      return leagues.map(league => ({
        id: league._id,
        name: league.name,
        country: league.country,
        logo: league.logo,
        fixtureCount: league.fixtureCount
      }))
    } catch (error) {
      console.error('Error getting available leagues:', error)
      throw error
    }
  }

  /**
   * Get available teams for targeting
   */
  async getAvailableTeams() {
    try {
      const teams = await Fixture.aggregate([
        { $match: { isActive: true } },
        {
          $facet: {
            homeTeams: [
              {
                $group: {
                  _id: '$homeTeam.id',
                  name: { $first: '$homeTeam.name' },
                  logo: { $first: '$homeTeam.logo' },
                  fixtureCount: { $sum: 1 }
                }
              }
            ],
            awayTeams: [
              {
                $group: {
                  _id: '$awayTeam.id',
                  name: { $first: '$awayTeam.name' },
                  logo: { $first: '$awayTeam.logo' },
                  fixtureCount: { $sum: 1 }
                }
              }
            ]
          }
        },
        {
          $project: {
            teams: { $concatArrays: ['$homeTeams', '$awayTeams'] }
          }
        },
        { $unwind: '$teams' },
        {
          $group: {
            _id: '$teams._id',
            name: { $first: '$teams.name' },
            logo: { $first: '$teams.logo' },
            fixtureCount: { $sum: '$teams.fixtureCount' }
          }
        },
        { $sort: { fixtureCount: -1 } }
      ])

      return teams.map(team => ({
        id: team._id,
        name: team.name,
        logo: team.logo,
        fixtureCount: team.fixtureCount
      }))
    } catch (error) {
      console.error('Error getting available teams:', error)
      throw error
    }
  }

  /**
   * Schedule auto-activation check (to be called by cron job)
   */
  scheduleAutoActivation() {
    // Run every 5 minutes
    setInterval(async () => {
      try {
        const result = await this.processAutoActivation()
        if (result.activated > 0 || result.deactivated > 0) {
          console.log(`Auto-activation: ${result.activated} activated, ${result.deactivated} deactivated`)
        }
      } catch (error) {
        console.error('Scheduled auto-activation failed:', error)
      }
    }, 5 * 60 * 1000) // 5 minutes
  }
}

module.exports = new EventTargetingService() 