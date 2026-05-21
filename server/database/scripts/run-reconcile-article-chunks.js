/**
 * One-off: reconcile chunks for a publication article (dedupe + renumber positions).
 *
 * Usage:
 *   node --env-file=.env server/database/scripts/run-reconcile-article-chunks.js <publication_article_id>
 */
import { reconcilePublicationArticleChunks } from "../../features/publication_workflow/PublicationArticleService.js";
import "../../database/models.js";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node --env-file=.env server/database/scripts/run-reconcile-article-chunks.js <publication_article_id>");
  process.exit(1);
}

const result = await reconcilePublicationArticleChunks(id);
console.log("[reconcile]", result);
