import PublicationModel from "./PublicationModel.js";
// Ensure models are initialized by importing models.js
import "../../database/models.js";

export async function getAllPublications() {
    try {
        // Check if model is initialized
        if (!PublicationModel.sequelize) {
            console.warn('PublicationModel not initialized, returning empty array');
            return [];
        }

        const publications = await PublicationModel.findAll({
            order: [['date', 'DESC']]
        });
        
        // Transform database format to API format
        return publications.map(publication => ({
            id_publication: publication.id_publication,
            redirectionLink: publication.redirection_link,
            date: publication.date ? new Date(publication.date).toISOString().split('T')[0] : null,
            revista: publication.revista,
            número: publication.número,
            publication_main_image_url: publication.publication_main_image_url || ""
        }));
    } catch (error) {
        console.error('Error fetching publications from database:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // If it's a connection error, table doesn't exist, or model not initialized, 
        // return empty array instead of throwing to prevent frontend crashes
        if (error.name === 'SequelizeConnectionError' || 
            error.name === 'SequelizeDatabaseError' ||
            error.name === 'SequelizeConnectionRefusedError' ||
            error.message?.includes('ETIMEDOUT') ||
            error.message?.includes('ECONNREFUSED') ||
            (error.message?.includes('relation') && error.message?.includes('does not exist')) ||
            error.message?.includes('not initialized') ||
            error.message?.includes('Model not found')) {
            console.warn('Database connection issue, returning empty array');
            return [];
        }
        // For other errors, still throw to maintain error visibility
        throw error;
    }
}

export async function getPublicationById(idPublication) {
    try {
        const publication = await PublicationModel.findByPk(idPublication);
        if (!publication) {
            throw new Error(`Publication with id ${idPublication} not found`);
        }
        
        // Transform database format to API format
        return {
            id_publication: publication.id_publication,
            redirectionLink: publication.redirection_link,
            date: publication.date ? new Date(publication.date).toISOString().split('T')[0] : null,
            revista: publication.revista,
            número: publication.número,
            publication_main_image_url: publication.publication_main_image_url || ""
        };
    } catch (error) {
        console.error('Error fetching publication from database:', error);
        throw error;
    }
}

export async function createPublication(publicationData) {
    const requestId = `publication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[PublicationService] [${requestId}] Starting createPublication`);
    
    try {
        // Check if model is initialized
        if (!PublicationModel.sequelize) {
            console.error(`[PublicationService] [${requestId}] PublicationModel not initialized`);
            throw new Error('PublicationModel not initialized');
        }

        const dbConfig = PublicationModel.sequelize.config;
        console.log(`[PublicationService] [${requestId}] Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        console.log(`[PublicationService] [${requestId}] Creating publication with data:`, JSON.stringify(publicationData, null, 2));
        
        // Check if publication_main_image_url column exists, if not, add it
        try {
            const [results] = await PublicationModel.sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'publications' 
                AND column_name = 'publication_main_image_url'
            `);
            
            if (results.length === 0) {
                console.log(`[PublicationService] [${requestId}] Column 'publication_main_image_url' does not exist, adding it...`);
                await PublicationModel.sequelize.query(`
                    ALTER TABLE publications 
                    ADD COLUMN publication_main_image_url VARCHAR(255)
                `);
                console.log(`[PublicationService] [${requestId}] Column 'publication_main_image_url' added successfully`);
            }
        } catch (migrationError) {
            // If migration fails, log but continue - the column might already exist or there's a different issue
            console.warn(`[PublicationService] [${requestId}] Could not check/add column:`, migrationError.message);
        }
        
        // Transform API format to database format (magazine → revista, número as number)
        const publication = await PublicationModel.create({
            id_publication: publicationData.id_publication,
            redirection_link: publicationData.redirectionLink,
            date: publicationData.date,
            revista: publicationData.magazine,
            número: publicationData.número != null ? String(publicationData.número) : publicationData.número,
            publication_main_image_url: publicationData.publication_main_image_url || ""
        });
        
        console.log(`[PublicationService] [${requestId}] Publication created successfully:`, publication.toJSON());
        
        // Transform database format to API format
        return {
            id_publication: publication.id_publication,
            redirectionLink: publication.redirection_link,
            date: publication.date ? new Date(publication.date).toISOString().split('T')[0] : null,
            revista: publication.revista,
            número: publication.número,
            publication_main_image_url: publication.publication_main_image_url || ""
        };
    } catch (error) {
        console.error(`[PublicationService] [${requestId}] Error creating publication in database`);
        console.error(`[PublicationService] [${requestId}] Error name:`, error.name);
        console.error(`[PublicationService] [${requestId}] Error message:`, error.message);
        console.error(`[PublicationService] [${requestId}] Error stack:`, error.stack);
        
        // Check if error is about missing publication_main_image_url column
        if (error.message?.includes('publication_main_image_url') && error.message?.includes('does not exist')) {
            console.log(`[PublicationService] [${requestId}] Column missing, attempting to add it...`);
            try {
                await PublicationModel.sequelize.query(`
                    ALTER TABLE publications 
                    ADD COLUMN publication_main_image_url VARCHAR(255)
                `);
                console.log(`[PublicationService] [${requestId}] Column added, retrying publication creation...`);
                
                // Retry creating the publication
                const publication = await PublicationModel.create({
                    id_publication: publicationData.id_publication,
                    redirection_link: publicationData.redirectionLink,
                    date: publicationData.date,
                    revista: publicationData.revista,
                    número: publicationData.número,
                    publication_main_image_url: publicationData.publication_main_image_url || ""
                });
                
                console.log(`[PublicationService] [${requestId}] Publication created successfully after migration:`, publication.toJSON());
                
                // Transform database format to API format
                return {
                    id_publication: publication.id_publication,
                    redirectionLink: publication.redirection_link,
                    date: publication.date ? new Date(publication.date).toISOString().split('T')[0] : null,
                    revista: publication.revista,
                    número: publication.número,
                    publication_main_image_url: publication.publication_main_image_url || ""
                };
            } catch (retryError) {
                console.error(`[PublicationService] [${requestId}] Failed to add column or retry:`, retryError.message);
                throw new Error(`Database error: Could not add missing column. ${retryError.message}`);
            }
        }
        
        // Log connection details if it's a connection error
        if (error.name === 'SequelizeConnectionError' || error.message?.includes('ETIMEDOUT')) {
            const dbConfig = PublicationModel.sequelize?.config;
            if (dbConfig) {
                console.error(`[PublicationService] [${requestId}] Attempted connection to: ${dbConfig.host}:${dbConfig.port}`);
            }
        }
        
        // Provide more detailed error information for connection errors
        if (error.name === 'SequelizeConnectionError' || 
            error.name === 'SequelizeDatabaseError' ||
            error.name === 'SequelizeConnectionRefusedError' ||
            error.message?.includes('ETIMEDOUT') ||
            error.message?.includes('ECONNREFUSED')) {
            const errorMsg = error.message || '';
            let helpfulMsg = `Database connection error: ${errorMsg}`;
            
            if (errorMsg.includes('ETIMEDOUT') || errorMsg.includes('ECONNREFUSED')) {
                helpfulMsg += '\n\nPossible solutions:\n';
                helpfulMsg += '1. Check if your IP is allowed in RDS Security Group\n';
                helpfulMsg += '2. Verify DATABASE_HOST, DATABASE_PORT in .env file\n';
                helpfulMsg += '3. Ensure RDS instance is running and publicly accessible\n';
                helpfulMsg += '4. Check your network/firewall settings\n';
                helpfulMsg += '5. Consider using SSH tunnel for secure connection';
            }
            
            throw new Error(helpfulMsg);
        }
        
        throw error;
    }
}

export async function updatePublication(idPublication, publicationData) {
    try {
        const publication = await PublicationModel.findByPk(idPublication);
        if (!publication) {
            throw new Error(`Publication with id ${idPublication} not found`);
        }
        
        // Update fields
        if (publicationData.redirectionLink !== undefined) publication.redirection_link = publicationData.redirectionLink;
        if (publicationData.date !== undefined) publication.date = publicationData.date;
        if (publicationData.revista !== undefined) publication.revista = publicationData.revista;
        if (publicationData.número !== undefined) publication.número = publicationData.número;
        if (publicationData.publication_main_image_url !== undefined) publication.publication_main_image_url = publicationData.publication_main_image_url;
        
        await publication.save();
        
        // Transform database format to API format
        return {
            id_publication: publication.id_publication,
            redirectionLink: publication.redirection_link,
            date: publication.date ? new Date(publication.date).toISOString().split('T')[0] : null,
            revista: publication.revista,
            número: publication.número,
            publication_main_image_url: publication.publication_main_image_url || ""
        };
    } catch (error) {
        console.error('Error updating publication in database:', error);
        throw error;
    }
}

export async function deletePublication(idPublication) {
    try {
        const publication = await PublicationModel.findByPk(idPublication);
        if (!publication) {
            throw new Error(`Publication with id ${idPublication} not found`);
        }
        
        await publication.destroy();
        
        // Transform database format to API format
        return {
            id_publication: publication.id_publication,
            redirectionLink: publication.redirection_link,
            date: publication.date ? new Date(publication.date).toISOString().split('T')[0] : null,
            revista: publication.revista,
            número: publication.número,
            publication_main_image_url: publication.publication_main_image_url || ""
        };
    } catch (error) {
        console.error('Error deleting publication from database:', error);
        throw error;
    }
}



