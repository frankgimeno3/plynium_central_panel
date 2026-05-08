import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Database from "../../../../../server/database/database.js";
import "../../../../../server/database/models.js";

export const runtime = "nodejs";

async function columnExists(sequelize, tableName, columnName) {
    const [results] = await sequelize.query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = :tableName
          AND column_name = :columnName
        `,
        { replacements: { tableName, columnName } }
    );
    return Array.isArray(results) && results.length > 0;
}

export const POST = createEndpoint(async () => {
    const database = Database.getInstance();
    try {
        await database.connect();
        const sequelize = database.getSequelize();

        const actions = [];

        // service_groups.service_specifications
        if (!(await columnExists(sequelize, "service_groups", "service_specifications"))) {
            await sequelize.query(`
                ALTER TABLE public.service_groups
                ADD COLUMN service_specifications TEXT NOT NULL DEFAULT ''::text
            `);
            actions.push("Added column service_groups.service_specifications");
        }

        // service_groups.service_base_description
        if (!(await columnExists(sequelize, "service_groups", "service_base_description"))) {
            await sequelize.query(`
                ALTER TABLE public.service_groups
                ADD COLUMN service_base_description TEXT NOT NULL DEFAULT ''::text
            `);
            actions.push("Added column service_groups.service_base_description");
        }

        return NextResponse.json({
            success: true,
            message: actions.length ? "Migration applied." : "No changes needed (already up to date).",
            actions,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error?.message ?? String(error),
            },
            { status: 500 }
        );
    }
}, null, false);

