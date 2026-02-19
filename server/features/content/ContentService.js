import ContentModel from "./ContentModel.js";
// Ensure models are initialized by importing models.js
import "../../database/models.js";

export async function getAllContents() {
    try {
        const contents = await ContentModel.findAll({
            order: [['created_at', 'DESC']]
        });
        
        // Transform database format to API format
        return contents.map(content => ({
            content_id: content.content_id,
            content_type: content.content_type,
            content_content: content.content_content
        }));
    } catch (error) {
        console.error('Error fetching contents from database:', error);
        throw error;
    }
}

export async function getContentById(contentId) {
    try {
        const content = await ContentModel.findByPk(contentId);
        if (!content) {
            throw new Error(`Content with id ${contentId} not found`);
        }
        
        // Transform database format to API format
        return {
            content_id: content.content_id,
            content_type: content.content_type,
            content_content: content.content_content
        };
    } catch (error) {
        console.error('Error fetching content from database:', error);
        throw error;
    }
}

export async function createContent(contentData) {
    const requestId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[ContentService] [${requestId}] Starting createContent`);
    
    try {
        // Check if model is initialized
        if (!ContentModel.sequelize) {
            console.error(`[ContentService] [${requestId}] ContentModel not initialized`);
            throw new Error('ContentModel not initialized');
        }

        const dbConfig = ContentModel.sequelize.config;
        console.log(`[ContentService] [${requestId}] Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        console.log(`[ContentService] [${requestId}] Creating content with data:`, JSON.stringify(contentData, null, 2));
        
        const content = await ContentModel.create({
            content_id: contentData.content_id,
            content_type: contentData.content_type,
            content_content: contentData.content_content
        });
        
        console.log(`[ContentService] [${requestId}] Content created successfully:`, content.toJSON());
        
        // Transform database format to API format
        return {
            content_id: content.content_id,
            content_type: content.content_type,
            content_content: content.content_content
        };
    } catch (error) {
        console.error(`[ContentService] [${requestId}] Error creating content in database`);
        console.error(`[ContentService] [${requestId}] Error name:`, error.name);
        console.error(`[ContentService] [${requestId}] Error message:`, error.message);
        console.error(`[ContentService] [${requestId}] Error stack:`, error.stack);
        
        // Log connection details if it's a connection error
        if (error.name === 'SequelizeConnectionError' || error.message?.includes('ETIMEDOUT')) {
            const dbConfig = ContentModel.sequelize?.config;
            if (dbConfig) {
                console.error(`[ContentService] [${requestId}] Attempted connection to: ${dbConfig.host}:${dbConfig.port}`);
            }
        }
        
        // Provide more detailed error information
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
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            throw new Error(`Database table does not exist. Please ensure the database is synced: ${error.message}`);
        }
        if (error.name === 'SequelizeValidationError') {
            throw new Error(`Validation error: ${error.message}`);
        }
        
        throw error;
    }
}

export async function updateContent(contentId, contentData) {
    try {
        const content = await ContentModel.findByPk(contentId);
        if (!content) {
            throw new Error(`Content with id ${contentId} not found`);
        }
        
        // Update fields
        if (contentData.content_type !== undefined) content.content_type = contentData.content_type;
        if (contentData.content_content !== undefined) content.content_content = contentData.content_content;
        
        await content.save();
        
        // Transform database format to API format
        return {
            content_id: content.content_id,
            content_type: content.content_type,
            content_content: content.content_content
        };
    } catch (error) {
        console.error('Error updating content in database:', error);
        throw error;
    }
}

export async function deleteContent(contentId) {
    try {
        const content = await ContentModel.findByPk(contentId);
        if (!content) {
            throw new Error(`Content with id ${contentId} not found`);
        }
        
        await content.destroy();
        
        // Transform database format to API format
        return {
            content_id: content.content_id,
            content_type: content.content_type,
            content_content: content.content_content
        };
    } catch (error) {
        console.error('Error deleting content from database:', error);
        throw error;
    }
}



