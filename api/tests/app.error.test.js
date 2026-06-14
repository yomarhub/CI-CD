const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

afterEach(() => jest.restoreAllMocks());

test("middleware d'erreur global renvoie 500 pour erreur DB", async () => {
  jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('boom from db'));

  const res = await request(app).get('/products');

  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty('error', 'Internal server error');
});

test("middleware d'erreur global renvoie 400 pour erreur de validation", async () => {
  const res = await request(app).get('/products/abc');

  expect(res.status).toBe(400);
  expect(res.body.error).toContain('product_id');
});
