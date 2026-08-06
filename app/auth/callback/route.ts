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
      try {
        // Query to check if profile already exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        // If profile doesn't exist, create it (satisfies first-time signup)
        if (!profile) {
          const metadata = session.user.user_metadata || {};
          const fullName = metadata.full_name || metadata.name || session.user.email?.split("@")[0] || "Google User";

          const { error: insertError } = await supabase.from("profiles").insert({
            id: session.user.id,
            full_name: fullName,
            plan: "free",
            credits_used: 0,
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Failed to insert profile row for OAuth user:", insertError);
          }
          
          return NextResponse.redirect(`${origin}/dashboard?auth_success=signup`);
        }
      } catch (profileErr) {
        console.error("Error in verifying/creating profile:", profileErr);
      }
    }

    return NextResponse.redirect(`${origin}/dashboard?auth_success=login`);
  }

  // If accessed directly without OAuth code, redirect to login page
  return NextResponse.redirect(`${origin}/auth/login`);
}
