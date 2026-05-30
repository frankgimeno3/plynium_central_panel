/** Server-only DATABASE_* env helpers (never use NEXT_PUBLIC_ for DB). */

export const REQUIRED_DATABASE_ENV_VARS = [
    "DATABASE_NAME",
    "DATABASE_USER",
    "DATABASE_PASSWORD",
    "DATABASE_HOST",
    "DATABASE_PORT",
];

/** True only during `next build` workers — not Amplify/Lambda runtime. */
export function isNextBuildPhase() {
    return (
        process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.NEXT_PHASE === "phase-development-build"
    );
}

export function getMissingDatabaseEnvVars() {
    return REQUIRED_DATABASE_ENV_VARS.filter((name) => {
        const value = process.env[name];
        return value === undefined || value === null || String(value).trim() === "";
    });
}

/** Safe diagnostics: presence only, no secret values. */
export function logDatabaseEnvDiagnostics(context = "runtime") {
    const missing = getMissingDatabaseEnvVars();
    const present = REQUIRED_DATABASE_ENV_VARS.filter((n) => !missing.includes(n));
    console.log(
        `[Database] Env diagnostics (${context}): NEXT_PHASE=${process.env.NEXT_PHASE ?? "(unset)"}, ` +
            `NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}, ` +
            `NEXT_RUNTIME=${process.env.NEXT_RUNTIME ?? "(unset)"}, ` +
            `buildPhase=${isNextBuildPhase()}`
    );
    console.log(
        `[Database] Env present: ${present.join(", ") || "(none)"}; missing: ${missing.join(", ") || "(none)"}`
    );
    if (process.env.DATABASE_HOST) {
        console.log(
            `[Database] Target (non-secret): ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT ?? "?"} / ${process.env.DATABASE_NAME ?? "?"}`
        );
    }
}

export function assertDatabaseEnvConfigured(context = "runtime") {
    const missing = getMissingDatabaseEnvVars();
    if (missing.length === 0) {
        return;
    }
    logDatabaseEnvDiagnostics(context);
    throw new Error(
        `Missing required database environment variables: ${missing.join(", ")}. ` +
            "Set them in Amplify Console and ensure amplify.yml writes .env.production before build."
    );
}
