import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  getEmployeeRelations,
  createEmployeeRelation,
  endEmployeeRelation,
} from "../../../../server/features/employee_relation/EmployeeRelationService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (_request, body) => {
    const { companyId, userId, status } = body ?? {};
    const rows = await getEmployeeRelations({
      companyId: companyId || undefined,
      userId: userId || undefined,
      status: status || "active",
    });
    return NextResponse.json(rows);
  },
  Joi.object({
    companyId: Joi.string().allow("").optional(),
    userId: Joi.string().allow("").optional(),
    status: Joi.string().allow("").optional(),
  }),
  true
);

export const POST = createEndpoint(
  async (_request, body) => {
    const created = await createEmployeeRelation({
      userId: body.userId,
      companyId: body.companyId,
      role: body.role,
    });
    return NextResponse.json(created);
  },
  Joi.object({
    userId: Joi.string().required(),
    companyId: Joi.string().required(),
    role: Joi.string().allow("").optional(),
  }),
  true,
  ["admin"]
);

export const DELETE = createEndpoint(
  async (_request, body) => {
    const updated = await endEmployeeRelation({ employeeRelId: body.employeeRelId });
    return NextResponse.json(updated);
  },
  Joi.object({
    employeeRelId: Joi.string().required(),
  }),
  true,
  ["admin"]
);

