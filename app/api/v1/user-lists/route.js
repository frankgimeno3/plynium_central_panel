import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getUserListsFromRds } from "../../../../server/features/user/userRepository.js";

export const GET = createEndpoint(
  async () => {
    const lists = await getUserListsFromRds();
    return NextResponse.json(lists);
  },
  null,
  true,
  []
);
