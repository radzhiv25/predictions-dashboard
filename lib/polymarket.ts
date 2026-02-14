import { POLYMARKET_EVENTS_QUERY } from "@/lib/constants";
import type {
  MarketPricePoint,
  NormalizedEvent,
  NormalizedMarket,
  PolymarketEventResponse,
} from "@/types/polymarket";

function parseJsonArray(value?: string): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch {
    return [];
  }

  return [];
}

function normalizePrice(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(1, parsed));
}

function getMarketTitle(market: { title?: string; groupItemTitle?: string; question?: string }): string {
  return (
    market.groupItemTitle?.trim() ||
    market.question?.trim() ||
    market.title?.trim() ||
    "Untitled market"
  );
}

function normalizeMarketPrice(outcomePricesRaw?: string): MarketPricePoint {
  const outcomePrices = parseJsonArray(outcomePricesRaw);

  const yesPrice = normalizePrice(outcomePrices.at(0));
  const noPrice = normalizePrice(outcomePrices.at(1));

  return {
    yes: yesPrice,
    no: noPrice,
  };
}

function normalizeMarkets(event: PolymarketEventResponse): NormalizedMarket[] {
  return (event.markets ?? []).map((market) => ({
    id: market.id,
    title: getMarketTitle(market),
    price: normalizeMarketPrice(market.outcomePrices),
  }));
}

function normalizeEvent(event: PolymarketEventResponse): NormalizedEvent {
  const volumeValue = Number(event.volume);

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    image: event.image ?? null,
    volume: Number.isFinite(volumeValue) ? volumeValue : 0,
    endDate: event.endDate ?? null,
    markets: normalizeMarkets(event),
  };
}

export function normalizeEvents(events: PolymarketEventResponse[]): NormalizedEvent[] {
  return events.map(normalizeEvent);
}

export async function fetchTopPoliticsEvents(): Promise<NormalizedEvent[]> {
  const response = await fetch(`/api/events?${POLYMARKET_EVENTS_QUERY}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  const data = (await response.json()) as NormalizedEvent[];
  return data;
}

export function buildCurrentPriceIndex(events: NormalizedEvent[]): Map<string, MarketPricePoint> {
  const index = new Map<string, MarketPricePoint>();

  for (const event of events) {
    for (const market of event.markets) {
      index.set(market.id, market.price);
    }
  }

  return index;
}
