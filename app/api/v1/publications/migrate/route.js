import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Database from "../../../../../server/database/database.js";
import "../../../../../server/database/models.js";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

export const POST = createEndpoint(async () => {
    const database = Database.getInstance();
    
    try {
        console.log("Conectando a la base de datos...");
        await database.connect();
        console.log("Conectado exitosamente");
        
        const sequelize = database.getSequelize();
        
        // Verificar si la columna ya existe
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'publications' 
            AND column_name = 'publication_main_image_url'
        `);
        
        if (results.length > 0) {
            return NextResponse.json({
                success: true,
                message: "La columna 'publication_main_image_url' ya existe en la tabla 'publications'"
            });
        }
        
        // Agregar la columna
        console.log("Agregando columna 'publication_main_image_url' a la tabla 'publications'...");
        await sequelize.query(`
            ALTER TABLE publications 
            ADD COLUMN publication_main_image_url VARCHAR(255)
        `);
        
        console.log("✅ Columna 'publication_main_image_url' agregada exitosamente");
        
        return NextResponse.json({
            success: true,
            message: "Columna 'publication_main_image_url' agregada exitosamente"
        });
        
    } catch (error) {
        console.error("❌ Error al agregar la columna:", error.message);
        console.error("Detalles:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
}, null, false);

