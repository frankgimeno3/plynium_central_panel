import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getCategoryById, deleteCategory } from "../../../../../server/features/company_category/CompanyCategoryService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/company-categories\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_category not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_category = getIdFromRequest(request);
    try {
      const category = await getCategoryById(id_category);
      return NextResponse.json(category);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Category not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);

export const DELETE = createEndpoint(
  async (request) => {
    const id_category = getIdFromRequest(request);
    try {
      await deleteCategory(id_category);
      return NextResponse.json({ message: "Category deleted" });
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Category not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);
