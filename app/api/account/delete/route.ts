import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // 1. Create authenticated server Supabase client bound to user session cookies
    const supabase = await createClient();

    // 2. Authenticate request using session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to delete your account." },
        { status: 401 }
      );
    }

    const userId = user.id;
    let authDeleted = false;
    let actualErrorMessage = "Account deletion failed.";

    // 3. Primary attempt: Delete via RPC function using authenticated user's session
    const { error: rpcErr } = await supabase.rpc("delete_user_account");

    if (!rpcErr) {
      authDeleted = true;
    } else {
      console.error("ACCOUNT DELETE RPC ERROR", {
        message: rpcErr?.message,
        code: rpcErr?.code,
        details: rpcErr?.details,
        hint: rpcErr?.hint,
      });
      actualErrorMessage = rpcErr?.message || `RPC Error (${rpcErr?.code || "UNKNOWN"})`;
    }

    // 4. Secondary attempt: Service Role Key if configured in server environment
    if (!authDeleted) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (serviceRoleKey && supabaseUrl) {
        try {
          const adminSupabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          // Clean up user application data across all 4 tables
          try { await adminSupabase.from("summaries").delete().eq("user_id", userId); } catch {}
          try { await adminSupabase.from("user_consents").delete().eq("user_id", userId); } catch {}
          try { await adminSupabase.from("feedback").delete().eq("user_id", userId); } catch {}
          try { await adminSupabase.from("profiles").delete().eq("id", userId); } catch {}

          const { error: adminDeleteErr } = await adminSupabase.auth.admin.deleteUser(userId);
          if (!adminDeleteErr) {
            authDeleted = true;
          } else {
            console.error("ACCOUNT DELETE ADMIN API ERROR", {
              message: adminDeleteErr?.message,
              code: adminDeleteErr?.code,
            });
            actualErrorMessage = adminDeleteErr.message;
          }
        } catch (adminErr: unknown) {
          const msg = (adminErr as Error)?.message || String(adminErr);
          console.error("ACCOUNT DELETE ADMIN EXCEPTION", msg);
          actualErrorMessage = msg;
        }
      }
    }

    // 5. CRITICAL CHECK: Return the exact real error message if deletion failed
    if (!authDeleted) {
      return NextResponse.json(
        { error: actualErrorMessage },
        { status: 500 }
      );
    }

    // 6. Sign out server-side session after successful deletion
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (error: unknown) {
    const errMessage = (error as Error)?.message || "Failed to delete account.";
    console.error("ACCOUNT DELETE ROUTE UNHANDLED ERROR:", error);
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
