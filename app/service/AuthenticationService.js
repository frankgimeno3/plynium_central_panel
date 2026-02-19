import { Amplify } from "aws-amplify";
import { signIn, confirmSignIn, signOut } from "aws-amplify/auth/cognito";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { CookieStorage, decodeJWT, fetchAuthSession } from "@aws-amplify/core";

let isConfigured = false;

function configureAmplify() {
  // Only configure once
  if (isConfigured) {
    return;
  }

  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;

  // Only configure if env vars are available (skip during build if they're not set)
  if (!userPoolId || !userPoolClientId) {
    // During build time, env vars might not be available, so we'll configure later at runtime
    // This prevents build failures while still allowing runtime configuration
    return;
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          username: true
        }
      }
    }
  });

  isConfigured = true;
}

export default class AuthenticationService {
  static async login(username, password) {
    configureAmplify();
    
    // Verify configuration was successful before proceeding
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
    const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
    if (!userPoolId || !userPoolClientId) {
      throw new Error("Missing Cognito env vars: NEXT_PUBLIC_USER_POOL_ID and/or NEXT_PUBLIC_USER_POOL_CLIENT_ID");
    }
    
    cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

    const response = await signIn({
      username,
      password
    });

    if (response.nextStep?.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
      const newPassword = prompt("Por favor, introduzca nueva contraseña");
      if (!newPassword) {
        throw new Error("Nueva contraseña requerida.");
      }
      await confirmSignIn({
        challengeResponse: newPassword
      });
    }

    const session = await fetchAuthSession();

    const idTokenString = session.tokens?.idToken?.toString();
    if (!idTokenString) {
      throw new Error("Usuario no autenticado.");
    }

    const { payload } = decodeJWT(idTokenString);

    if (typeof window !== "undefined") {
      localStorage.setItem("username", username);
    }

    return payload;
  }

  static async logout() {
    configureAmplify();
    
    // Verify configuration was successful before proceeding
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
    const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
    if (!userPoolId || !userPoolClientId) {
      throw new Error("Missing Cognito env vars: NEXT_PUBLIC_USER_POOL_ID and/or NEXT_PUBLIC_USER_POOL_CLIENT_ID");
    }
    
    cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage());

    if (typeof window !== "undefined") {
      localStorage.removeItem("username");
    }

    await signOut();
  }
}
