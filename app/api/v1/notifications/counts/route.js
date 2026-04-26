import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNotificationCounts } from "../../../../../server/features/notification_db/NotificationDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
  const counts = await getNotificationCounts();
  return NextResponse.json(counts);
}, null, true);

