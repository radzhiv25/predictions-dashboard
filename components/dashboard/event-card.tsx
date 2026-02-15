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
  marketQuery?: string;
  onBuy: (
    event: NormalizedEvent,
    marketId: string,
    marketTitle: string,
    side: PositionSide,
    amount: number,
    price: number,
  ) => Promise<boolean>;
}

export function EventCard({ event, canTrade, marketQuery = "", onBuy }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { visibleMarkets, hiddenCount, actionableCount } = useMemo(() => {
    const sorted = [...event.markets].sort((a, b) => b.price.yes - a.price.yes);
    const actionable = sorted.filter((market) => market.price.yes > 0 || market.price.no > 0);
    const fallback = actionable.length > 0 ? actionable : sorted;
    const query = marketQuery.trim().toLowerCase();
    const searched = query ? fallback.filter((market) => market.title.toLowerCase().includes(query)) : fallback;
    const maxVisible = 12;

    return {
      actionableCount: actionable.length,
      visibleMarkets: isExpanded ? searched : searched.slice(0, maxVisible),
      hiddenCount: Math.max(0, searched.length - maxVisible),
    };
  }, [event.markets, isExpanded, marketQuery]);

  return (
    <Card className="gap-4 overflow-hidden border-slate-200 py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-white/20 dark:bg-black/70">
      <CardHeader className="grid grid-cols-[1fr_auto] gap-4 border-b px-4 py-4 dark:border-white/15 md:px-6">
        <div>
          <CardTitle className="text-base leading-tight text-slate-900 dark:text-white md:text-lg">{event.title}</CardTitle>
          <p className="mt-2 text-xs text-slate-500 dark:text-gray-500">Volume {formatCompactCurrency(event.volume)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">Ends {formatDate(event.endDate)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">
            Active markets {actionableCount}/{event.markets.length}
          </p>
        </div>
        <div className="group relative h-16 w-16 overflow-hidden rounded-full border bg-slate-100 dark:border-white/20 dark:bg-black">
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
            <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-gray-500">No image</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4 md:px-6 md:pb-6">
        {visibleMarkets.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-slate-600 dark:border-white/20 dark:text-gray-400">
            {marketQuery ? "No markets match your search in this event." : "No active markets found."}
          </div>
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
            className="text-left text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 dark:text-gray-300 dark:hover:text-white"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? "Show fewer markets" : `Show ${hiddenCount} more markets`}
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}
