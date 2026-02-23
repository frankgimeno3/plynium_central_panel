import {createEndpoint} from "../../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {createUser, updateUser} from "../../../../../server/features/user/UserSerivce.js";
import {getUsersFromRds} from "../../../../../server/features/user/userRepository.js";
import Joi from "joi";

// GET: cualquier usuario autenticado puede ver la lista (datos desde RDS)
export const GET = createEndpoint(async () => {
    const users = await getUsersFromRds();
    return NextResponse.json(users);
}, null, true, []);

export const PUT = createEndpoint(async (request, body) => {
    const result = await updateUser(body)

    return NextResponse.json(result);
}, Joi.object({
    username: Joi.string().required(),
    name: Joi.string().optional(),
    email: Joi.string().optional(),
    enabled: Joi.boolean().optional(),
    password: Joi.any().optional()
}), true, ['admin']);

export const POST = createEndpoint(async (request, body) => {
    const {name, email, password} = body;

    const result = await createUser(name, email, password);

    return NextResponse.json(result);
}, Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.any().required()
}), true, ['admin']);