const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateVenue } = require('../middlewares/auth');
const TenantQuery = require('../utils/tenantQuery');
const OfferTemplate = require('../models/OfferTemplate');

const router = express.Router();

// Autenticazione richiesta per tutte le operazioni
router.use(authenticateVenue);

// Lista template del tenant
router.get('/',
  [
    query('q').optional().isString().trim(),
    query('onlyActive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { q = '', onlyActive = 'true' } = req.query;
      const filter = { tenantId: req.tenantId };
      if (onlyActive === 'true') filter.isActive = true;
      if (q) filter.title = { $regex: q, $options: 'i' };

      const templates = await TenantQuery.find(OfferTemplate, req.tenantId, filter);
      res.json({ success: true, data: templates });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Errore nel recupero template' });
    }
  }
);

// Crea template
router.post('/',
  [
    body('title').isString().trim().isLength({ min: 1, max: 100 }),
    body('description').isString().trim().isLength({ min: 1, max: 500 }),
    body('price').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray({ max: 10 })
  ],
  async (req, res) => {
    try {
      const tpl = new OfferTemplate({
        tenantId: req.tenantId,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        tags: req.body.tags || [],
        createdBy: req.user?._id
      });
      await tpl.save();
      res.status(201).json({ success: true, data: tpl });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Errore creazione template' });
    }
  }
);

// Aggiorna template
router.put('/:id',
  [
    param('id').isMongoId(),
    body('title').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().trim().isLength({ min: 1, max: 500 }),
    body('price').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray({ max: 10 }),
    body('isActive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const tpl = await TenantQuery.findOne(OfferTemplate, req.tenantId, { _id: req.params.id });
      if (!tpl) return res.status(404).json({ success: false, message: 'Template non trovato' });
      Object.assign(tpl, req.body);
      await tpl.save();
      res.json({ success: true, data: tpl });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Errore aggiornamento template' });
    }
  }
);

// Elimina template
router.delete('/:id', [param('id').isMongoId()], async (req, res) => {
  try {
    const tpl = await TenantQuery.findOne(OfferTemplate, req.tenantId, { _id: req.params.id });
    if (!tpl) return res.status(404).json({ success: false, message: 'Template non trovato' });
    await OfferTemplate.deleteOne({ _id: tpl._id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Errore eliminazione template' });
  }
});

module.exports = router;


