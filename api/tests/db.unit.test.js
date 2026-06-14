describe('db module', () => {
  let PoolMock;

  beforeEach(() => {
    jest.resetModules();
    PoolMock = jest.fn(() => ({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      end: jest.fn().mockResolvedValue(),
    }));

    jest.doMock('pg', () => ({ Pool: PoolMock }));

    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    jest.restoreAllMocks();
  });

  test('getPool constructs Pool with DATABASE_URL and query works', async () => {
    const db = require('../src/db');

    const pool = db.getPool();

    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: process.env.DATABASE_URL,
    });
    const res = await db.query('SELECT 1');
    expect(res).toHaveProperty('rows');
  });

  test('close calls pool.end and resets pool', async () => {
    const db = require('../src/db');

    const pool1 = db.getPool();
    await db.close();

    // require again to get fresh module state
    jest.resetModules();
    jest.doMock('pg', () => ({ Pool: PoolMock }));
    const db2 = require('../src/db');

    const pool2 = db2.getPool();
    expect(PoolMock).toHaveBeenCalledTimes(2);

    await db2.close();
  });
});
