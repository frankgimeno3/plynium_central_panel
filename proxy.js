import {NextResponse} from "next/server";
import {COGNITO} from "./env.js";
import {fetchNewTokens, verifyIdToken, verifyAccessToken} from "./server/features/authentication/AuthenticationService.js";

// Simple in-memory cache for token validation (TTL: 5 minutes)
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedValidation(tokenKey) {
    const cached = tokenCache.get(tokenKey);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.valid;
    }
    tokenCache.delete(tokenKey);
    return null;
}

function setCachedValidation(tokenKey, isValid) {
    tokenCache.set(tokenKey, {
        valid: isValid,
        expiresAt: Date.now() + CACHE_TTL
    });
    // Clean up old entries periodically
    if (tokenCache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of tokenCache.entries()) {
            if (now >= value.expiresAt) {
                tokenCache.delete(key);
            }
        }
    }
}

// Max age for session cookies: 24 hours so cookies don't accumulate indefinitely
const SESSION_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

export async function proxy(request) {
    const response = NextResponse.next();
    const {pathname} = request.nextUrl;
    const baseKey = `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}`;
    const lastAuthUserKey = `${baseKey}.LastAuthUser`;

    /** Redirect to login and clear auth cookies to prevent redirect loop (ERR_TOO_MANY_REDIRECTS)
     * when LastAuthUser exists but tokens are expired/missing. */
    const goToLogin = (cookieKeys = null) => {
        if (pathname === '/') {
            return response;
        }
        const redirectResponse = NextResponse.redirect(new URL('/', request.url));
        // Clear auth cookies so / doesn't see LastAuthUser and redirect back to /logged
        redirectResponse.cookies.set(lastAuthUserKey, '', { maxAge: 0, path: '/' });
        if (cookieKeys) {
            redirectResponse.cookies.set(cookieKeys.id, '', { maxAge: 0, path: '/' });
            redirectResponse.cookies.set(cookieKeys.access, '', { maxAge: 0, path: '/' });
            redirectResponse.cookies.set(cookieKeys.refresh, '', { maxAge: 0, path: '/' });
        }
        return redirectResponse;
    };

    const goToPanel = () => {
        return NextResponse.redirect(new URL('/logged', request.url));
    };

    // Early return for login page if no auth
    if (pathname === '/') {
        const username = request.cookies.get(lastAuthUserKey)?.value;
        if (username) {
            return goToPanel();
        }
        return response;
    }

    const username = request.cookies.get(lastAuthUserKey)?.value;
    if (!username) return goToLogin(null);
    
    const cookieKeys = {
        id: `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}.${username}.idToken`,
        access: `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}.${username}.accessToken`,
        refresh: `CognitoIdentityServiceProvider.${COGNITO.CLIENT_ID}.${username}.refreshToken`
    }
    
    const refreshToken = request.cookies.get(cookieKeys.refresh)?.value;
    if (!refreshToken) {
        return goToLogin(cookieKeys);
    }

    let idToken = request.cookies.get(cookieKeys.id)?.value
    let accessToken = request.cookies.get(cookieKeys.access)?.value

    // Check cache first
    const cacheKey = `${idToken?.substring(0, 50)}_${accessToken?.substring(0, 50)}`;
    const cachedResult = getCachedValidation(cacheKey);
    
    if (cachedResult === true) {
        // Token is valid from cache
        return response;
    }

    // Validate tokens directly (no internal fetch)
    if (idToken && accessToken) {
        try {
            // Validate tokens in parallel
            await Promise.all([
                verifyIdToken(idToken),
                verifyAccessToken(accessToken)
            ]);
            
            // Cache successful validation
            setCachedValidation(cacheKey, true);
            return response;
        } catch (e) {
            // Token validation failed, try to refresh
            setCachedValidation(cacheKey, false);
        }
    }

    // If validation failed or tokens missing, try to refresh
    try {
        const data = await fetchNewTokens(refreshToken);
        idToken = data.id_token;
        accessToken = data.access_token;
        
        // Cap cookie lifetime so sessions expire and cookies don't accumulate
        const maxAge = Math.min(data.expires_in || 3600, SESSION_COOKIE_MAX_AGE);
        response.cookies.set({
            name: cookieKeys.access,
            value: accessToken,
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            maxAge
        });

        response.cookies.set({
            name: cookieKeys.id,
            value: idToken,
            secure: true,
            httpOnly: false,
            sameSite: 'lax',
            maxAge
        });
        
        // Cache new tokens
        const newCacheKey = `${idToken.substring(0, 50)}_${accessToken.substring(0, 50)}`;
        setCachedValidation(newCacheKey, true);
        
        return response;
    } catch (e) {
        return goToLogin(cookieKeys);
    }
}

export const config = {
    // More specific matcher to exclude static assets
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
    ],
}


