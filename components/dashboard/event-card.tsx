"use client";

import { useMemo, useState } from "react";

import Image from "next/image";

import { formatCompactCurrency, formatDate } from "@/lib/format";
import type { PositionSide } from "@/types/portfolio";
import type { NormalizedEvent } from "@/types/polymarket";

import { MarketRow } from "@/components/dashboard/market-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EventCardProps {
  event: NormalizedEvent;
  canTrade: boolean;
  onBuy: (
    event: NormalizedEvent,
    marketId: string,
    marketTitle: string,
    side: PositionSide,
    amount: number,
    price: number,
  ) => Promise<boolean>;
}

export function EventCard({ event, canTrade, onBuy }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { visibleMarkets, hiddenCount, actionableCount } = useMemo(() => {
    const sorted = [...event.markets].sort((a, b) => b.price.yes - a.price.yes);
    const actionable = sorted.filter((market) => market.price.yes > 0 || market.price.no > 0);
    const fallback = actionable.length > 0 ? actionable : sorted;
    const maxVisible = 12;

    return {
      actionableCount: actionable.length,
      visibleMarkets: isExpanded ? fallback : fallback.slice(0, maxVisible),
      hiddenCount: Math.max(0, fallback.length - maxVisible),
    };
  }, [event.markets, isExpanded]);

  return (
    <Card className="gap-4 overflow-hidden border-slate-200 py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <CardHeader className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-4 md:px-6">
        <div>
          <CardTitle className="text-base leading-tight md:text-lg">{event.title}</CardTitle>
          <p className="mt-2 text-xs text-slate-500">Volume {formatCompactCurrency(event.volume)}</p>
          <p className="mt-1 text-xs text-slate-500">Ends {formatDate(event.endDate)}</p>
          <p className="mt-1 text-xs text-slate-500">
            Active markets {actionableCount}/{event.markets.length}
          </p>
        </div>
        <div className="group relative h-16 w-16 overflow-hidden rounded-md border bg-slate-100">
          {event.image ? (
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 md:px-6 md:pb-6">
        {visibleMarkets.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600">No active markets found.</div>
        ) : (
          visibleMarkets.map((market) => (
            <MarketRow
              key={market.id}
              market={market}
              canTrade={canTrade}
              onBuy={(side, amount, price) => onBuy(event, market.id, market.title, side, amount, price)}
            />
          ))
        )}
        {hiddenCount > 0 ? (
          <button
            className="text-left text-sm font-medium text-blue-700 transition-colors hover:text-blue-800"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? "Show fewer markets" : `Show ${hiddenCount} more markets`}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
