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
    console.warn('Warning: Could not connect to database during startup');
    console.warn('The application will continue, but database operations may fail');
    console.warn('Error details:', error.message);
    
    // Only exit in production to ensure database is available
    if (process.env.NODE_ENV === 'production') {
        console.error('Database connection is required in production. Exiting...');
        process.exit(1);
    }
}