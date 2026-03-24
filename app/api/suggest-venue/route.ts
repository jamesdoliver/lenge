import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  let body: { suggestion?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { suggestion } = body;

  if (!suggestion || !suggestion.trim()) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const { error } = await supabase
    .from("venue_suggestions")
    .insert({ suggestion: suggestion.trim() });

  if (error) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
