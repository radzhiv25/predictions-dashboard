import { formatCurrency, formatPercentFromPrice } from "@/lib/format";
import type { MarketPricePoint } from "@/types/polymarket";
import type { Position } from "@/types/portfolio";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PositionsViewProps {
  positions: Position[];
  currentPrices: Map<string, MarketPricePoint>;
  onNavigateDashboard: () => void;
}

function getCurrentPrice(position: Position, currentPrice: MarketPricePoint | undefined): number {
  if (!currentPrice) {
    return position.averagePrice;
  }

  return position.side === "YES" ? currentPrice.yes : currentPrice.no;
}

function calculatePnl(position: Position, currentPrice: number): number {
  return (currentPrice - position.averagePrice) * position.quantity;
}

export function PositionsView({ positions, currentPrices, onNavigateDashboard }: PositionsViewProps) {
  if (positions.length === 0) {
    return (
      <Card className="animate-fade-up border-slate-200">
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-slate-900">No positions yet</p>
          <p className="mt-2 text-sm text-slate-600">
            You have not bought any contracts. Start trading from Dashboard.
          </p>
          <button className="mt-4 text-sm font-medium text-blue-700 underline" onClick={onNavigateDashboard}>
            Go to Dashboard
          </button>
        </CardContent>
      </Card>
    );
  }

  const groupedByEvent = positions.reduce<Record<string, Position[]>>((groups, position) => {
    const key = `${position.eventId}::${position.eventTitle}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(position);
    return groups;
  }, {});

  const totals = positions.reduce(
    (acc, position) => {
      const currentPrice = getCurrentPrice(position, currentPrices.get(position.marketId));
      const markValue = currentPrice * position.quantity;
      const pnl = calculatePnl(position, currentPrice);

      return {
        invested: acc.invested + position.totalInvested,
        markValue: acc.markValue + markValue,
        unrealizedPnl: acc.unrealizedPnl + pnl,
        winners: acc.winners + (pnl >= 0 ? 1 : 0),
      };
    },
    { invested: 0, markValue: 0, unrealizedPnl: 0, winners: 0 },
  );

  const winRate = (totals.winners / positions.length) * 100;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-up border-slate-200 py-0">
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total invested</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(totals.invested)}</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-up border-slate-200 py-0">
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Mark-to-market</p>
            <p className="text-xl font-semibold text-slate-900">{formatCurrency(totals.markValue)}</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-up border-slate-200 py-0">
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Unrealized P&L</p>
            <p className={`text-xl font-semibold ${totals.unrealizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(totals.unrealizedPnl)}
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-up border-slate-200 py-0">
          <CardContent className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Winning positions</p>
            <p className="text-xl font-semibold text-slate-900">{winRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </section>

      {Object.entries(groupedByEvent).map(([groupKey, eventPositions]) => {
        const [, eventTitle] = groupKey.split("::");

        return (
          <Card key={groupKey} className="animate-fade-up border-slate-200">
            <CardHeader>
              <CardTitle>{eventTitle}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="font-medium">Market</th>
                    <th className="font-medium">Side</th>
                    <th className="font-medium">Avg Entry</th>
                    <th className="font-medium">Current</th>
                    <th className="font-medium">Qty</th>
                    <th className="font-medium">Invested</th>
                    <th className="font-medium">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {eventPositions.map((position) => {
                    const currentPrice = getCurrentPrice(position, currentPrices.get(position.marketId));
                    const pnl = calculatePnl(position, currentPrice);

                    return (
                      <tr
                        key={position.id}
                        className="rounded-md border bg-white transition-colors duration-200 hover:bg-slate-50"
                      >
                        <td className="py-2 pr-3">{position.marketTitle}</td>
                        <td className="py-2 pr-3">{position.side}</td>
                        <td className="py-2 pr-3">{formatPercentFromPrice(position.averagePrice)}</td>
                        <td className="py-2 pr-3">{formatPercentFromPrice(currentPrice)}</td>
                        <td className="py-2 pr-3">{position.quantity.toFixed(3)}</td>
                        <td className="py-2 pr-3">{formatCurrency(position.totalInvested)}</td>
                        <td className={`py-2 pr-3 font-medium ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          <div>{formatCurrency(pnl)}</div>
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${pnl >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                              style={{ width: `${Math.min(100, Math.abs((pnl / Math.max(position.totalInvested, 1)) * 100))}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
