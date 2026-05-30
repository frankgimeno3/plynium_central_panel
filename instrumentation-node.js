import Database, { isNextBuildPhase, logDatabaseEnvDiagnostics } from "./server/database/database.js";

import "./server/database/models.js";

// Skip DB work during `next build` static/page-data collection — only run on SSR Lambda runtime.
if (isNextBuildPhase()) {
    console.warn("[Database] instrumentation-node: build phase — skipping database connect.");
} else {
    const database = Database.getInstance();
    try {
        logDatabaseEnvDiagnostics("instrumentation-startup");
        console.debug("[Database] Connecting at Node startup…");
        await database.connect();
        console.debug("[Database] Connected at startup.");
    } catch (error) {
        console.error("[Database] Startup initialization failed:", error.message);
        console.error(
            "[Database] API routes will fail until DATABASE_* env vars are available at Lambda runtime."
        );
    }
}
