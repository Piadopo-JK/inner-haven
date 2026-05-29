import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // skip proxy when env vars not set
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // create fresh client per request for fluid compute
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // do not run code between createserverclient and getclaims — causes random logouts; getclaims() required for ssr
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const isAuthPath =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/sign-up" ||
    request.nextUrl.pathname === "/sign-up-success" ||
    request.nextUrl.pathname === "/forgot-password" ||
    request.nextUrl.pathname === "/update-password" ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/api");

  if (
    !user &&
    request.nextUrl.pathname !== "/" &&
    !isAuthPath
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // always return original supabaseresponse to prevent session desync; if creating new response, pass request and copy cookies

  return supabaseResponse;
}
