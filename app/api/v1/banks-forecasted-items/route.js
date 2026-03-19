import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  createForecastedItem,
  getAllForecastedItems,
} from "../../../../server/features/banks_forecast_db/BanksForecastDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllForecastedItems();
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  type: Joi.string().valid("revenue", "payment").required(),
  amount_eur: Joi.number().required().min(0),
  forecast_date: Joi.date().required(),
  related_id: Joi.string().optional().allow(null).allow(""),
  label: Joi.string().optional().allow(null).allow(""),
  reference: Joi.string().optional().allow(null).allow(""),
});

export const POST = createEndpoint(
  async (request, body) => {
    const created = await createForecastedItem(body);
    return NextResponse.json(created);
  },
  postSchema,
  true,
  []
);

