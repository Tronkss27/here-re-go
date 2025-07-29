const GlobalMatch = require('../models/GlobalMatch');

const matchController = {
    /**
     * Cerca le partite globali basandosi su una query testuale.
     */
    async search(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 3) {
                return res.status(400).json({ 
                    message: 'La query di ricerca deve contenere almeno 3 caratteri.' 
                });
            }

            const matches = await GlobalMatch.find(
                { $text: { $search: q } },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .limit(10);

            res.json(matches);

        } catch (error) {
            console.error('Errore durante la ricerca delle partite:', error);
            res.status(500).json({ message: 'Errore del server durante la ricerca.' });
        }
    }
};

module.exports = matchController; 