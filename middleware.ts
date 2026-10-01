import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { API_URL } from '@/lib/config';

// Define the routes that the middleware should run on.
// We apply it to all pages except the login, next internals, api, etc.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|Login).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Read tokens from the incoming request cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // 2. Helper to check if a JWT is expired
  // Since we're in Edge Runtime, we use 'atob' to decode the base64 payload
  const isTokenExpired = (token: string) => {
    try {
      const payloadBase64 = token.split('.')[1];
      // JWT uses base64url, so we need to replace '-' with '+' and '_' with '/'
      let base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if necessary
      while (base64.length % 4) {
        base64 += '=';
      }
      const decodedPayload = JSON.parse(atob(base64));
      // Give a 30 second buffer before actual expiration
      return (decodedPayload.exp * 1000) - 30000 < Date.now();
    } catch (e) {
      return true; // If parsing fails, treat as expired
    }
  };

  // 3. If access token is valid, just proceed normally
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // 4. If access token is missing or expired, attempt to refresh
  if (refreshToken) {
    try {
      const response = await fetch(`${API_URL}/admin/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass the refresh token in the cookie header as expected by backend
          'Cookie': `refreshToken=${refreshToken}`
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();

        // As per the response payload provided: data.data.accessToken
        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken || refreshToken; // Fallback if backend doesn't rotate

        if (newAccessToken) {
          // 5. Create a new request headers object and set the updated cookies
          // This ensures any Server Components down the line see the NEW tokens when calling cookies().get(...)
          const requestHeaders = new Headers(request.headers);

          // Rebuild the cookie header string for subsequent Server Components/Actions
          const cookieStrings = request.cookies
            .getAll()
            .filter(c => c.name !== 'accessToken' && c.name !== 'refreshToken')
            .map(c => `${c.name}=${c.value}`);

          cookieStrings.push(`accessToken=${newAccessToken}`);
          cookieStrings.push(`refreshToken=${newRefreshToken}`);

          requestHeaders.set('cookie', cookieStrings.join('; '));

          // 6. Forward the request with the updated headers
          const nextResp = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          // 7. Finally, update the response cookies so the browser stores the new tokens
          nextResp.cookies.set('accessToken', newAccessToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 15, // 15 minutes
          });

          nextResp.cookies.set('refreshToken', newRefreshToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });

          return nextResp;
        }
      }
    } catch (error) {
      console.error('Middleware token refresh error:', error);
    }
  }

  // 8. If refreshing fails or there is no refresh token, redirect to login
  const loginUrl = new URL('/Login', request.url);
  // Optionally, you could append ?redirect=${pathname} to redirect them back after login
  return NextResponse.redirect(loginUrl);
}
