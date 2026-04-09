import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getAllCategories, createCategory } from "../../../../server/features/company_category/CompanyCategoryService.js";

export const runtime = "nodejs";

const postSchema = Joi.object({
  name: Joi.string().required().trim().min(1),
  description: Joi.string().allow("").optional(),
  // Relations moved to company_categories_portal table; create category without portal binding here.
});

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
