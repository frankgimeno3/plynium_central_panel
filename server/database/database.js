import { Sequelize } from "sequelize";
import * as fs from "node:fs";
import path from "node:path";
import pg from "pg";
import {
    assertDatabaseEnvConfigured,
    getMissingDatabaseEnvVars,
    isNextBuildPhase,
    logDatabaseEnvDiagnostics,
} from "./databaseEnv.js";

const caPath = path.resolve(process.cwd(), "certs", "rds-ca.pem");
let sslCA = null;

try {
    if (fs.existsSync(caPath)) {
        sslCA = fs.readFileSync(caPath, "utf8");
    }
} catch (error) {
    console.warn(`Certificate file not found at ${caPath}. SSL will be disabled.`);
}

class Database {
    static #instance;
    /** @type {Sequelize | null} */
    #sequelize = null;
    /** @type {boolean} */
    #usingBuildPlaceholders = false;

    constructor() {
        // Lazy: no env reads or Sequelize init here (safe during `next build` module graph).
    }

    #buildDialectOptions(forRuntime) {
        const dialectOptions = {};
        if (!forRuntime) {
            return dialectOptions;
        }
        if (sslCA) {
            dialectOptions.ssl = {
                require: true,
                ca: sslCA.toString(),
                rejectUnauthorized: process.env.NODE_ENV !== "development",
            };
            console.log(`[Database] SSL enabled with certificate from ${caPath}`);
        } else {
            dialectOptions.ssl = {
                require: true,
                rejectUnauthorized: false,
            };
            console.log("[Database] SSL enabled without certificate (rejectUnauthorized: false)");
        }
        return dialectOptions;
    }

    #initializeSequelize({ usePlaceholders }) {
        this.#usingBuildPlaceholders = usePlaceholders;

        const host = usePlaceholders ? "localhost" : process.env.DATABASE_HOST;
        const port = usePlaceholders ? "5432" : process.env.DATABASE_PORT;
        const databaseName = usePlaceholders ? "build_placeholder" : process.env.DATABASE_NAME;
        const user = usePlaceholders ? "build_user" : process.env.DATABASE_USER;
        const password = usePlaceholders ? "build_placeholder" : process.env.DATABASE_PASSWORD;

        if (usePlaceholders) {
            console.warn(
                "[Database] Next.js build phase — using placeholder Sequelize config (no real connection)."
            );
        } else {
            console.log(
                `[Database] Initializing Sequelize: ${host}:${port}/${databaseName} (user: ${user})`
            );
        }

        this.#sequelize = new Sequelize(databaseName, user, password, {
            logging: usePlaceholders ? false : process.env.NODE_ENV === "development" ? this.log : false,
            host,
            port: parseInt(String(port), 10),
            dialect: "postgres",
            dialectModule: pg,
            dialectOptions: this.#buildDialectOptions(!usePlaceholders),
            pool: {
                max: usePlaceholders ? 1 : 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        });
    }

    #ensureInitialized() {
        if (this.#sequelize) {
            return;
        }

        if (isNextBuildPhase()) {
            this.#initializeSequelize({ usePlaceholders: true });
            return;
        }

        assertDatabaseEnvConfigured("lazy-init");
        this.#initializeSequelize({ usePlaceholders: false });
    }

    #resetIfPlaceholder() {
        if (this.#usingBuildPlaceholders || this.#sequelize?.config?.database === "build_placeholder") {
            this.#sequelize = null;
            this.#usingBuildPlaceholders = false;
        }
    }

    log(message) {
        console.debug(`[Sequelize]: ${message}`);
    }

    static getInstance() {
        if (!this.#instance) {
            this.#instance = new Database();
        }
        return this.#instance;
    }

    isConfigured() {
        if (isNextBuildPhase()) {
            return true;
        }
        return getMissingDatabaseEnvVars().length === 0;
    }

    getSequelize() {
        this.#resetIfPlaceholder();
        this.#ensureInitialized();
        if (!this.#sequelize) {
            throw new Error("Database Sequelize instance failed to initialize.");
        }
        return this.#sequelize;
    }

    async connect() {
        if (isNextBuildPhase()) {
            console.warn("[Database] Skipping connect() during Next.js build phase.");
            return;
        }

        logDatabaseEnvDiagnostics("connect");
        this.#resetIfPlaceholder();
        assertDatabaseEnvConfigured("connect");
        this.#ensureInitialized();

        const startTime = Date.now();
        try {
            console.log(
                `[Database] Attempting connection to ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}...`
            );
            await this.#sequelize.authenticate();
            console.log(`[Database] Connection established successfully in ${Date.now() - startTime}ms`);
        } catch (error) {
            console.error(`[Database] Connection failed after ${Date.now() - startTime}ms`);
            console.error(`[Database] Host: ${process.env.DATABASE_HOST}, Port: ${process.env.DATABASE_PORT}`);
            console.error(`[Database] Error: ${error.name} - ${error.message}`);
            throw error;
        }
    }

    async sync() {
        if (isNextBuildPhase()) {
            return;
        }
        this.getSequelize();
        await this.#sequelize.sync();
    }
}

export default Database;
export { isNextBuildPhase, logDatabaseEnvDiagnostics } from "./databaseEnv.js";
