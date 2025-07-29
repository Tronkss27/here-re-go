const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { auth } = require('../middlewares/auth');

router.get('/search', auth, matchController.search);

module.exports = router; 