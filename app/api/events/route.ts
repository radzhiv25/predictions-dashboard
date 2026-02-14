import { NextResponse } from "next/server";

import { POLYMARKET_EVENTS_QUERY } from "@/lib/constants";
import { normalizeEvents } from "@/lib/polymarket";
import type { PolymarketEventResponse } from "@/types/polymarket";

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const query = search ? search.slice(1) : POLYMARKET_EVENTS_QUERY;

  try {
    const response = await fetch(`https://gamma-api.polymarket.com/events?${query}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Polymarket request failed" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as PolymarketEventResponse[];
    return NextResponse.json(normalizeEvents(data));
  } catch {
    return NextResponse.json({ message: "Unable to fetch events" }, { status: 500 });
  }
}
