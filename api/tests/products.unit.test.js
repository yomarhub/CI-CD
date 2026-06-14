const request = require('supertest');
const express = require('express');
const productsModule = require('../src/routes/products');
const db = require('../src/db');

const app = express();
app.use(express.json());
app.use('/products', productsModule.router);

// Attach a JSON error handler like in src/app.js so tests receive JSON errors
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const errorResponse =
    status === 500
      ? { error: 'Internal server error' }
      : { error: err.message };
  res.status(status).json(errorResponse);
});

afterEach(() => jest.restoreAllMocks());

test('GET /products retourne données mockées', async () => {
  jest.spyOn(db, 'query').mockResolvedValueOnce({
    rows: [{ id: 1, name: 'X', description: 'Y', price_cents: 100 }],
    rowCount: 1,
  });

  const res = await request(app).get('/products');

  expect(res.status).toBe(200);
  expect(res.body.source).toBe('database');
  expect(Array.isArray(res.body.data)).toBe(true);
});

test('GET /products renvoie 500 si la DB rejette', async () => {
  jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('boom'));

  const res = await request(app).get('/products');

  expect(res.status).toBe(500);
  expect(res.body.error).toBe('Internal server error');
});

test('GET /products/:id renvoie 404 si introuvable', async () => {
  jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const res = await request(app).get('/products/42');

  expect(res.status).toBe(404);
  expect(res.body.error).toBe('Produit non trouvé');
});

test('GET /products/:id renvoie 400 si id invalide', async () => {
  const res = await request(app).get('/products/abc');

  expect(res.status).toBe(400);
  expect(res.body.error).toContain('product_id');
});
