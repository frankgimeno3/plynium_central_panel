import { COGNITO } from "../../../env.js";
import { NextResponse } from "next/server";
import { decodeJWT } from "@aws-amplify/core";
import {
  getUserByIdOrUsernameFromRds,
  getUserByCognitoSubFromRds,
} from "../../../server/features/user/userRepository.js";

export async function GET(request) {
  try {
    if (!COGNITO || !COGNITO.CLIENT_ID) {
      return NextResponse.json({ user_name: "User" }, { status: 200 });
    }

    const baseKey = `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}`;
    const cognitoUsername = request.cookies.get(`${baseKey}.LastAuthUser`)?.value;

    if (!cognitoUsername) {
      return NextResponse.json({ user_name: "User" }, { status: 200 });
    }

    // 1. Si Cognito devuelve UUID (sub), buscar por cognito_sub en la tabla users
    const dbUserBySub = await getUserByCognitoSubFromRds(cognitoUsername);
    if (dbUserBySub?.user_full_name) {
      return NextResponse.json({ user_name: dbUserBySub.user_full_name }, { status: 200 });
    }

    // 2. Si el username es id_user o user_name (email) de la tabla
    const dbUser = await getUserByIdOrUsernameFromRds(cognitoUsername);
    if (dbUser?.user_full_name) {
      return NextResponse.json({ user_name: dbUser.user_full_name }, { status: 200 });
    }

    // 3. Si es UUID, intentar obtener email del idToken y buscar por email
    const idToken = request.cookies.get(`${baseKey}.${cognitoUsername}.idToken`)?.value;
    if (idToken) {
      try {
        const { payload } = decodeJWT(idToken);
        const email = payload?.email;
        if (email) {
          const dbUserByEmail = await getUserByIdOrUsernameFromRds(email);
          if (dbUserByEmail?.user_full_name) {
            return NextResponse.json({ user_name: dbUserByEmail.user_full_name }, { status: 200 });
          }
        }
      } catch {
        // ignore
      }
    }

    const displayName = cognitoUsername.includes("@")
      ? cognitoUsername.split("@")[0]
      : cognitoUsername;
    return NextResponse.json({ user_name: displayName }, { status: 200 });
  } catch {
    return NextResponse.json({ user_name: "User" }, { status: 200 });
  }
}
