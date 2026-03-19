import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllPlannedPublications } from "../../../../server/features/publication_workflow/PublicationWorkflowService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const publications = await getAllPlannedPublications();
    return NextResponse.json(publications);
}, null, true);
