const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { parseProductId } = require('../src/routes/products');

const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describe('parseProductId', () => {
    test('renvoie un entier pour un id positif', () => {
        expect(parseProductId('10')).toBe(10);
    });

    test('lève une erreur pour un id invalide', () => {
        expect(() => parseProductId('abc')).toThrow('product_id doit être un entier positif');
    });
});

describeIfDatabase('Tests d’intégration produits avec PostgreSQL', () => {
    beforeAll(async () => {
        await db.query('CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK (price_cents > 0));');
        await db.query("INSERT INTO products (name, description, price_cents) VALUES ('Test Product', 'Test description', 1000) ON CONFLICT DO NOTHING;");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await db.query('DROP TABLE IF EXISTS products;');
        await db.close();
    });

    test('GET /products retourne la liste des produits', async () => {
        const response = await request(app).get('/products');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.source).toBe('database');
    });

    test('GET /products/:id retourne un produit existant', async () => {
        const response = await request(app).get('/products/1');

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('id', 1);
    });

    test('GET /products/:id retourne 404 pour un produit inconnu', async () => {
        const response = await request(app).get('/products/99999');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Produit non trouvé');
    });

    test('GET /products/:id retourne 400 pour un id invalide', async () => {
        const response = await request(app).get('/products/abc');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('product_id');
    });

    test('GET /route-absente retourne 404', async () => {
        const response = await request(app).get('/route-absente');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Route not found');
    });

    test('GET /products renvoie 500 quand la base échoue', async () => {
        jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('boom'));

        const response = await request(app).get('/products');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal server error');
    });
});
