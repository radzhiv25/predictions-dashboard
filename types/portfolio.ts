export type PositionSide = "YES" | "NO";

export interface Position {
  id: string;
  eventId: string;
  eventTitle: string;
  marketId: string;
  marketTitle: string;
  side: PositionSide;
  averagePrice: number;
  quantity: number;
  totalInvested: number;
  lastTradeAt: string;
}

export interface PortfolioState {
  balance: number;
  positions: Position[];
}

export interface BuyInput {
  eventId: string;
  eventTitle: string;
  marketId: string;
  marketTitle: string;
  side: PositionSide;
  price: number;
  amount: number;
  timestamp: string;
}
