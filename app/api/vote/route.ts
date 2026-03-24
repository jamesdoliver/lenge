import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  let body: { email?: string; design?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { email, design } = body;

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !design ||
    (design !== "A" && design !== "B")
  ) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { error } = await supabase
    .from("votes")
    .insert({ email, design });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "ALREADY_VOTED" }, { status: 409 });
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
