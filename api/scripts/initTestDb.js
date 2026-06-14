const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL must be defined to initialize the test database.');
    }

    const client = new Client({ connectionString: databaseUrl });

    await client.connect();

    try {
        const initSql = fs.readFileSync(
            path.resolve(__dirname, '../../database/init.sql'),
            'utf8'
        );

        await client.query(initSql);
        console.log('Test database initialized successfully.');
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
