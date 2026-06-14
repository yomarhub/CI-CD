const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.status(200).json({ status: 'ready', api: 'ok', database: 'ok' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', api: 'ok', database: 'error', error: error.message });
  }
});

module.exports = router;
