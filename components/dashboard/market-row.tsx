"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { DEFAULT_TRADE_AMOUNT } from "@/lib/constants";
import { formatPercentFromPrice } from "@/lib/format";
import type { PositionSide } from "@/types/portfolio";
import type { NormalizedMarket } from "@/types/polymarket";

import { Button } from "@/components/ui/button";

interface MarketRowProps {
  market: NormalizedMarket;
  canTrade: boolean;
  onBuy: (side: PositionSide, amount: number, price: number) => Promise<boolean>;
}

export function MarketRow({ market, canTrade, onBuy }: MarketRowProps) {
  const canBuyYes = canTrade && market.price.yes > 0;
  const canBuyNo = canTrade && market.price.no > 0;
  const [pendingSide, setPendingSide] = useState<PositionSide | null>(null);
  const [lastFilledSide, setLastFilledSide] = useState<PositionSide | null>(null);

  async function handleBuy(side: PositionSide, price: number) {
    if (pendingSide) {
      return;
    }

    setPendingSide(side);
    await new Promise((resolve) => setTimeout(resolve, 280));
    const success = await onBuy(side, DEFAULT_TRADE_AMOUNT, price);
    setPendingSide(null);

    if (!success) {
      return;
    }

    setLastFilledSide(side);
    setTimeout(() => setLastFilledSide(null), 700);
  }

  return (
    <div
      className={`grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm md:grid-cols-[1fr_auto_auto] md:items-center ${
        lastFilledSide === "YES" ? "ring-2 ring-emerald-200" : ""
      } ${lastFilledSide === "NO" ? "ring-2 ring-rose-200" : ""}`}
    >
      <div>
        <p className="text-sm font-medium text-slate-950">{market.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            Yes {formatPercentFromPrice(market.price.yes)}
          </span>
          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
            No {formatPercentFromPrice(market.price.no)}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        className="transition-transform active:scale-95"
        disabled={!canBuyYes || !!pendingSide}
        onClick={() => void handleBuy("YES", market.price.yes)}
      >
        {pendingSide === "YES" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Placing...
          </>
        ) : (
          `Buy Yes ($${DEFAULT_TRADE_AMOUNT})`
        )}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="transition-transform active:scale-95"
        disabled={!canBuyNo || !!pendingSide}
        onClick={() => void handleBuy("NO", market.price.no)}
      >
        {pendingSide === "NO" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Placing...
          </>
        ) : (
          `Buy No ($${DEFAULT_TRADE_AMOUNT})`
        )}
      </Button>
    </div>
  );
}
