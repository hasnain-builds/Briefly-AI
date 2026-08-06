import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Razorpay keys are missing from environment variables.");
      return NextResponse.json({ error: "Razorpay payment processing is currently unavailable." }, { status: 500 });
    }

    // @ts-ignore
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const receiptId = crypto.randomUUID().substring(0, 8);
    const options = {
      amount: 69900, // ₹699.00 in paise
      currency: "INR",
      receipt: `receipt_${receiptId}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ orderId: order.id, keyId: key_id });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
