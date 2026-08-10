import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle OAuth errors redirected from Supabase
  if (error) {
    console.error("OAuth callback error:", error, error_description);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    if (session?.user) {
      // The auth.users AFTER INSERT trigger automatically creates the public.profiles row.
      // Check if user was created in the last 10 seconds to set auth_success flag.
      const createdAt = new Date(session.user.created_at || Date.now()).getTime();
      const isNewUser = Date.now() - createdAt < 10000;
      return NextResponse.redirect(
        `${origin}/dashboard?auth_success=${isNewUser ? "signup" : "login"}`
      );
    }

    return NextResponse.redirect(`${origin}/dashboard?auth_success=login`);
  }

  // If accessed directly without OAuth code, redirect to login page
  return NextResponse.redirect(`${origin}/auth/login`);
}
