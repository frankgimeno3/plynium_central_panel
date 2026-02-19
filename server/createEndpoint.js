import {COGNITO} from "../env.js";
import {fetchNewTokens, verifyAccessToken, verifyIdToken} from "./features/authentication/AuthenticationService.js";
import {NextResponse} from "next/server.js";
import {getUserRoles} from "./features/authorization/AuthorizationService.js";
import {errorHandler} from "./errorHandler.js";
import {decodeJWT} from "@aws-amplify/core";

// Cap cookie lifetime so sessions expire (same as proxy.js)
const SESSION_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours

async function validate(request, schema) {
    if (!schema) return;
    const contentType = request.headers.get('content-type') ?? '';
    const method = request.method
    let data;
    let body;

    if (method === "GET") {
        const url = new URL(request.url);
        const params = url.searchParams;
        data = Object.fromEntries(params)
        body = data;
    } else if (contentType.includes('application/json')) {
        body = await request.json();
        data = body;
    } else if (contentType.includes('multipart/form-data')) {
        body = await request.formData();
        data = Object.fromEntries(body);
    } else {
        throw Error('Solicitud incorrecta');
    }
    const {value, error} = schema.validate(data);
    if (error) {
        throw new Error(`Solicitud no paso validacion: ${error}`);
    }

    return body;
}

async function checkTokens(request, response) {
    const baseKey = `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}`;
    const username = request.cookies.get(`${baseKey}.LastAuthUser`)?.value;

    if (!username) {
        throw new Error('Falta  cookie con el nombre de usuario')
    }

    let isRefreshed = false;
    let idToken = request.cookies.get(`${baseKey}.${username}.idToken`)?.value;
    let accessToken = request.cookies.get(`${baseKey}.${username}.accessToken`)?.value;

    const cookieKeys = {
        id: `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}.${username}.idToken`,
        access: `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}.${username}.accessToken`,
        refresh: `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}.${username}.refreshToken`
    }

    let expiresIn;
    try {
        await Promise.all([verifyIdToken(idToken), verifyAccessToken(accessToken)]);
    } catch (e) {
        const refreshToken = request.cookies.get(cookieKeys.refresh)?.value
        const data = await fetchNewTokens(refreshToken);
        expiresIn = data.expires_in;
        idToken = data.id_token;
        accessToken = data.access_token;
        isRefreshed = true;
    }
    const {payload} = decodeJWT(idToken);
    const {email} = payload;
    return [username, email, payload.sub, isRefreshed, accessToken, idToken, cookieKeys, expiresIn];
}

export function createEndpoint(callback, schema = null, isProtected = false, roles = []) {
    return async (request) => {
        const response = NextResponse.next();
        let body;
        try {
            body = await validate(request, schema);
        } catch (e) {
            return new Response(e.message, {status: 400});
        }
        let username, sub, email, isRefreshed, accessToken, idToken, cookieKeys, cookieExpiresIn;
        if (isProtected) {
            try {
                [username, email, sub, isRefreshed, accessToken, idToken, cookieKeys, cookieExpiresIn] = await checkTokens(request, response);
                request.email = email;
                request.sub = sub;
            } catch (error) {
                console.error(error);

                return new Response(error.message, {status: 400});
            }
        }

        if (isProtected && roles.length > 0) {
            try {
                const userRoles = await getUserRoles(username);
                const hasAccess = userRoles.some(role => roles.includes(role));
                console.log(userRoles);
                if(!hasAccess) return new Response("Prohibido ", {status: 403});
            } catch (e) {
                console.log(e);
                return new Response("Prohibido ", {status: 403});
            }
        }

        try {
            const response = await callback(request, body);
            if (isRefreshed) {
                const maxAge = Math.min(cookieExpiresIn ?? 3600, SESSION_COOKIE_MAX_AGE);
                response.cookies.set({
                    name: cookieKeys.access,
                    value: accessToken,
                    secure: true,
                    maxAge
                });
                response.cookies.set({
                    name: cookieKeys.id,
                    value: idToken,
                    secure: true,
                    maxAge
                });
            }
            return response;
        } catch (error) {
            return errorHandler(error);
        }
    }
}