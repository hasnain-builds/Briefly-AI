import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: cancelResult, error: dbError } = await supabase.rpc("cancel_user_subscription");

    if (dbError || !cancelResult) {
      console.error("Database cancellation error:", dbError);
      return NextResponse.json({ error: dbError?.message || "Failed to cancel subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in subscription cancellation:", error);
    return NextResponse.json({ error: error.message || "Cancellation error" }, { status: 500 });
  }
}
