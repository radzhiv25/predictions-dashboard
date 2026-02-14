export interface PolymarketEventResponse {
  id: string;
  title: string;
  slug: string;
  image?: string;
  volume?: number | string;
  endDate?: string;
  markets?: PolymarketMarketResponse[];
}

export interface PolymarketMarketResponse {
  id: string;
  title?: string;
  question?: string;
  groupItemTitle?: string;
  outcomes?: string;
  outcomePrices?: string;
}

export interface MarketPricePoint {
  yes: number;
  no: number;
}

export interface NormalizedMarket {
  id: string;
  title: string;
  price: MarketPricePoint;
}

export interface NormalizedEvent {
  id: string;
  title: string;
  slug: string;
  image: string | null;
  volume: number;
  endDate: string | null;
  markets: NormalizedMarket[];
}
