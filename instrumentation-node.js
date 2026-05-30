import Database from "./server/database/database.js";

import './server/database/models.js';

const database = Database.getInstance();

// Try to connect to database, but don't crash the app if it fails
// This allows the app to start in development even if the database is unavailable
try {
    console.debug('Connecting to database');
    await database.connect();
    console.debug('Connected');
    // Tables are created only via SQL migrations (server/database/migrations/), not by Sequelize sync.
} catch (error) {
    console.error("[Database] Startup initialization failed:", error.message);
    console.error(
        "[Database] The site will still load, but API routes need DATABASE_* env vars and RDS network access."
    );
}