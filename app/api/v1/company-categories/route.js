import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getAllCategories, createCategory } from "../../../../server/features/company_category/CompanyCategoryService.js";

export const runtime = "nodejs";

const postSchema = Joi.object({
  category_name: Joi.string().trim().min(1),
  category_description: Joi.string().allow("").optional(),
  // Backward-compatible payload keys
  name: Joi.string().trim().min(1),
  description: Joi.string().allow("").optional(),
  // Bridge table: company_categories_portal (category_id, portal_id)
  // Note: portal_id can be 0 in portals_db
  portal_ids: Joi.array().items(Joi.number().integer().min(0)).optional(),
  // Backward-compatible key (old UI sent portal names; ignored by backend now)
  portals_array: Joi.array().items(Joi.string().trim().min(1)).optional(),
})
  .or("category_name", "name")
  .unknown(true);

export const GET = createEndpoint(
  async () => {
    const list = await getAllCategories();
    return NextResponse.json(list);
  },
  null,
  true
);

export const POST = createEndpoint(
  async (request, body) => {
    try {
      const category = await createCategory(body);
      return NextResponse.json(category);
    } catch (err) {
      if (err.status === 400 || (err.message && err.message.includes("already exists"))) {
        return NextResponse.json(
          { message: err.message || "A company category with this name already exists" },
          { status: 400 }
        );
      }
      throw err;
    }
  },
  postSchema,
  false
);
