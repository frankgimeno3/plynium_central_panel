import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  getForecastedItemById,
  updateForecastedItem,
} from "../../../../../server/features/banks_forecast_db/BanksForecastDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(
    /\/api\/v1\/banks-forecasted-items\/([^/]+)$/
  );
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("Item id not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id = getIdFromRequest(request);
    const item = await getForecastedItemById(id);
    if (!item) {
      const err = new Error("Forecasted item not found");
      err.statusCode = 404;
      throw err;
    }
    return NextResponse.json(item);
  },
  null,
  true
);

const putForecastedItemSchema = Joi.object({
  amount_eur: Joi.number().min(0).optional(),
  revenue_expected_amount_eur: Joi.number().min(0).optional(),
  revenue_real_amount_eur: Joi.number().min(0).allow(null).optional(),
  label: Joi.string().max(512).allow("").optional(),
  customer_name: Joi.string().max(255).allow("").optional(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  revenue_real_payment_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
  id_provider: Joi.string().max(64).allow("", null).optional(),
  provider_name: Joi.string().max(512).allow("").optional(),
  payment_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  payment_expected_amount_eur: Joi.number().min(0).optional(),
  payment_real_amount_eur: Joi.number().min(0).allow(null).optional(),
  payment_expected_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  payment_real_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow(null)
    .optional(),
}).or(
  "amount_eur",
  "revenue_expected_amount_eur",
  "revenue_real_amount_eur",
  "label",
  "customer_name",
  "date",
  "revenue_real_payment_date",
  "id_provider",
  "provider_name",
  "payment_date",
  "payment_expected_amount_eur",
  "payment_real_amount_eur",
  "payment_expected_date",
  "payment_real_date"
);

export const PUT = createEndpoint(
  async (request, body) => {
    const id = getIdFromRequest(request);
    const updated = await updateForecastedItem(id, body);
    return NextResponse.json(updated);
  },
  putForecastedItemSchema,
  true
);

