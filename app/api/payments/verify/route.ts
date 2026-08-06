import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json({ error: "Razorpay configuration is missing" }, { status: 500 });
    }

    // Double verify signature in the route handler using node's crypto
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature. Verification failed." }, { status: 400 });
    }

    // Call the database function to securely upgrade the user.
    // This executes in the database as owner (SECURITY DEFINER), bypassing RLS block on client updates.
    const { data: upgradeResult, error: dbError } = await supabase.rpc("upgrade_user_to_pro", {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature: razorpay_signature,
      key_secret: key_secret,
    });

    if (dbError || !upgradeResult) {
      console.error("Database upgrade error:", dbError);
      return NextResponse.json({ error: dbError?.message || "Verification passed, but database upgrade failed." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in signature verification:", error);
    return NextResponse.json({ error: error.message || "Verification error" }, { status: 500 });
  }
}
