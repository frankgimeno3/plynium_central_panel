import {Sequelize} from "sequelize";
import * as fs from "node:fs";
import path from "node:path";
import pg from "pg";

const caPath = path.resolve(process.cwd(), 'certs', 'rds-ca.pem');
let sslCA = null;

// Try to load the certificate file if it exists
try {
    if (fs.existsSync(caPath)) {
        sslCA = fs.readFileSync(caPath, 'utf8');
    }
} catch (error) {
    console.warn(`Certificate file not found at ${caPath}. SSL will be disabled.`);
}

class Database {
    static #instance;
    #sequelize;


    constructor() {
        // Validate required environment variables
        const requiredEnvVars = ['DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD', 'DATABASE_HOST', 'DATABASE_PORT'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
        }

        const host = process.env.DATABASE_HOST;
        const port = process.env.DATABASE_PORT;
        const databaseName = process.env.DATABASE_NAME;
        const user = process.env.DATABASE_USER;

        // Log connection details (without sensitive data)
        console.log(`[Database] Initializing connection to: ${host}:${port}/${databaseName} (user: ${user})`);
        console.log(`[Database] Runtime: ${typeof process !== 'undefined' ? 'Node.js' : 'Unknown'}`);
        
        const dialectOptions = {};
        
        // Configure SSL - always enable for RDS connections
        if (sslCA) {
            // Use certificate if available
            dialectOptions.ssl = {
                require: true,
                ca: sslCA.toString(),
                rejectUnauthorized: process.env.NODE_ENV !== 'development',
            };
            console.log(`[Database] SSL enabled with certificate from ${caPath}`);
        } else {
            // Enable SSL without certificate (for RDS compatibility)
            dialectOptions.ssl = {
                require: true,
                rejectUnauthorized: false,
            };
            console.log(`[Database] SSL enabled without certificate (rejectUnauthorized: false)`);
        }

        this.#sequelize = new Sequelize(
            databaseName,
            user,
            process.env.DATABASE_PASSWORD,
            {
                logging: process.env.NODE_ENV === 'development' ? this.log : false,
                host: host,
                port: parseInt(port, 10),
                dialect: 'postgres',
                dialectModule: pg,
                dialectOptions,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        )
    }

    log(message){
        console.debug(`[Sequelize]: ${message}`)
    }


    static getInstance() {
        if (!this.#instance) {
            this.#instance = new this();
        }
        return this.#instance;
    }

    getSequelize() {
        return this.#sequelize;
    }

    async connect() {
        const startTime = Date.now();
        try {
            console.log(`[Database] Attempting connection to ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}...`);
            await this.#sequelize.authenticate();
            const duration = Date.now() - startTime;
            console.log(`[Database] Connection established successfully in ${duration}ms`);
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[Database] Connection failed after ${duration}ms`);
            console.error(`[Database] Host: ${process.env.DATABASE_HOST}, Port: ${process.env.DATABASE_PORT}`);
            console.error(`[Database] Error: ${error.name} - ${error.message}`);
            throw error;
        }
    }

    async sync() {
        // sync() without options will create tables if they don't exist
        // but won't alter or drop existing tables
        await this.#sequelize.sync()
    }
}

export default Database;