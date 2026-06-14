const request = require('supertest');
const express = require('express');
const healthRoutes = require('../src/routes/health');
const db = require('../src/db');

const app = express();
app.use('/health', healthRoutes);

afterEach(() => jest.restoreAllMocks());

test('GET /health retourne ok quand DB accessible', async () => {
  jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

  const res = await request(app).get('/health');

  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
  expect(res.body.checks.database).toBe('ok');
});

test('GET /health renvoie 503 quand DB en erreur', async () => {
  jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('db down'));

  const res = await request(app).get('/health');

  expect(res.status).toBe(503);
  expect(res.body.status).toBe('error');
  expect(res.body.checks.database).toBe('error');
});
