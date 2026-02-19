import {CognitoJwtVerifier} from "aws-jwt-verify";
import {COGNITO} from "../../../env.js";

let idVerifier = null;
let accessVerifier = null;

function getIdVerifier() {
    if (!idVerifier) {
        const userPoolId = COGNITO.USER_POOL_ID;
        const clientId = COGNITO.CLIENT_ID;
        
        if (!userPoolId || !clientId) {
            throw new Error("Missing Cognito env vars: USER_POOL_ID and/or CLIENT_ID");
        }
        
        idVerifier = CognitoJwtVerifier.create({
            userPoolId,
            clientId,
            tokenUse: "id",
        });
    }
    return idVerifier;
}

function getAccessVerifier() {
    if (!accessVerifier) {
        const userPoolId = COGNITO.USER_POOL_ID;
        const clientId = COGNITO.CLIENT_ID;
        
        if (!userPoolId || !clientId) {
            throw new Error("Missing Cognito env vars: USER_POOL_ID and/or CLIENT_ID");
        }
        
        accessVerifier = CognitoJwtVerifier.create({
            userPoolId,
            clientId,
            tokenUse: "access",
        });
    }
    return accessVerifier;
}

export async function verifyIdToken(idToken){
    const verifier = getIdVerifier();
    return await verifier.verify(idToken);
}

export async function verifyAccessToken(accessToken){
    const verifier = getAccessVerifier();
    return await verifier.verify(accessToken);
}

export async function fetchNewTokens(refresh_token) {
    const domain = COGNITO.DOMAIN;
    const region = COGNITO.REGION;
    const clientId = COGNITO.CLIENT_ID;
    
    if (!domain || !region || !clientId) {
        throw new Error("Missing Cognito env vars: DOMAIN, REGION, and/or CLIENT_ID");
    }
    
    const tokenEndpoint = `https://${domain}.auth.${region}.amazoncognito.com/oauth2/token`;

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token,
    })

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch tokens: ${response.status} ${errorText}`)
    }

    return await response.json();
}