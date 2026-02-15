"use client";

import { Activity, BarChart3, Loader2, Search, Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AuthControls } from "@/components/auth/auth-controls";
import { WalletFundingDialog } from "@/components/app-shell/wallet-funding-dialog";
import { ThemeToggle } from "@/components/app-shell/theme-toggle";
import { EventCard } from "@/components/dashboard/event-card";
import { PositionsView } from "@/components/positions/positions-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PortfolioProvider, usePortfolio } from "@/contexts/portfolio-context";
import { PRICE_REFRESH_INTERVAL_MS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { buildCurrentPriceIndex, fetchTopPoliticsEvents } from "@/lib/polymarket";
import type { NormalizedEvent } from "@/types/polymarket";
import type { PositionSide } from "@/types/portfolio";

type ActiveTab = "DASHBOARD" | "POSITIONS";
type DashboardFilter = "ALL" | "HAS_ACTIONABLE";
const DEMO_MODE_STORAGE_KEY = "predictions-dashboard:demo-mode";

interface TradingContentProps {
  isDemoMode: boolean;
  onExitDemoMode?: () => void;
}

function TradingContent({ isDemoMode, onExitDemoMode }: TradingContentProps) {
  const { state, buyPosition, addFunds } = usePortfolio();
  const [activeTab, setActiveTab] = useState<ActiveTab>("DASHBOARD");
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<DashboardFilter>("ALL");
  const [animateWallet, setAnimateWallet] = useState(false);
  const previousBalanceRef = useRef(state.balance);

  const refreshEvents = useCallback(async () => {
    setError(null);

    try {
      const response = await fetchTopPoliticsEvents();
      setEvents(response);
    } catch {
      setError("Could not load live events from Polymarket.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void refreshEvents();
    }, PRICE_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [refreshEvents]);

  useEffect(() => {
    if (previousBalanceRef.current === state.balance) {
      return;
    }

    setAnimateWallet(true);
    previousBalanceRef.current = state.balance;

    const timeoutId = setTimeout(() => setAnimateWallet(false), 450);
    return () => clearTimeout(timeoutId);
  }, [state.balance]);

  const currentPriceIndex = useMemo(() => buildCurrentPriceIndex(events), [events]);
  const actionableMarketCount = useMemo(
    () =>
      events.reduce(
        (count, event) =>
          count + event.markets.filter((market) => market.price.yes > 0 || market.price.no > 0).length,
        0,
      ),
    [events],
  );

  const onBuy = useCallback(
    async (
      event: NormalizedEvent,
      marketId: string,
      marketTitle: string,
      side: PositionSide,
      amount: number,
      price: number,
    ): Promise<boolean> => {
      const result = buyPosition({
        eventId: event.id,
        eventTitle: event.title,
        marketId,
        marketTitle,
        side,
        amount,
        price,
        timestamp: new Date().toISOString(),
      });

      if (!result.success) {
        toast.error(result.reason);
        return false;
      }

      toast.success(
        `Bought ${side} for ${marketTitle} at ${(price * 100).toFixed(1)} cents with ${formatCurrency(amount)}.`,
      );
      return true;
    },
    [buyPosition],
  );

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const hasActionable = event.markets.some((market) => market.price.yes > 0 || market.price.no > 0);
      if (filterMode === "HAS_ACTIONABLE" && !hasActionable) {
        return false;
      }

      if (!query) {
        return true;
      }

      const eventMatch = event.title.toLowerCase().includes(query);
      const marketMatch = event.markets.some((market) => market.title.toLowerCase().includes(query));
      return eventMatch || marketMatch;
    });
  }, [events, filterMode, searchQuery]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(71,85,105,0.08),transparent_35%)] pb-10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.04),transparent_35%)]">
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 md:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/90 p-4 backdrop-blur-sm dark:border-white/20 dark:bg-black/70 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <BarChart3 className="size-5" />
              <h1 className="text-xl font-semibold">Predictions Dashboard</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">Live politics events with a simulated trading wallet</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthControls bypassAuth={isDemoMode} />
            {isDemoMode ? (
              <Button size="sm" variant="outline" onClick={onExitDemoMode}>
                Exit Demo
              </Button>
            ) : null}
          </div>
        </header>

        <section className="sticky top-3 z-20 mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm dark:border-white/20 dark:bg-black/70 md:flex-row md:items-center md:justify-between">
          <div className="relative grid w-full max-w-xs grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-white/10">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-md bg-slate-900 shadow-sm transition-transform duration-300 ease-out dark:bg-white ${
                activeTab === "DASHBOARD" ? "translate-x-0" : "translate-x-full"
              }`}
            />
            <button
              type="button"
              onClick={() => setActiveTab("DASHBOARD")}
              className={`relative z-10 h-8 rounded-md text-sm font-medium transition-colors ${
                activeTab === "DASHBOARD" ? "text-white dark:text-black" : "text-slate-700 dark:text-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("POSITIONS")}
              className={`relative z-10 h-8 rounded-md text-sm font-medium transition-colors ${
                activeTab === "POSITIONS" ? "text-white dark:text-black" : "text-slate-700 dark:text-gray-300"
              }`}
            >
              Positions ({state.positions.length})
            </button>
          </div>

          <div
            className={`flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 transition-shadow dark:border-white/20 dark:bg-black dark:text-white ${
              animateWallet ? "animate-pop-soft shadow-md shadow-emerald-100" : ""
            }`}
          >
            <Wallet className="size-4" />
            <span className="text-sm text-slate-600 dark:text-gray-400">Wallet</span>
            <strong className="text-sm">{formatCurrency(state.balance)}</strong>
            <WalletFundingDialog onAddFunds={addFunds} />
          </div>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 py-0 dark:border-white/20 dark:bg-black/70">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">Active Events</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{events.length}</p>
              </div>
              <Activity className="size-5 text-slate-400 dark:text-gray-500" />
            </CardContent>
          </Card>
          <Card className="border-slate-200 py-0 dark:border-white/20 dark:bg-black/70">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">Tradable Markets</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">{actionableMarketCount}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 py-0 dark:border-white/20 dark:bg-black/70">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">Open Positions</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">{state.positions.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 py-0 dark:border-white/20 dark:bg-black/70">
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-500">Refresh cadence</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-white">{PRICE_REFRESH_INTERVAL_MS / 1000}s</p>
            </CardContent>
          </Card>
        </section>

        {activeTab === "DASHBOARD" ? (
          <section className="animate-fade-up space-y-4">
            <Card className="border-slate-200 py-0 dark:border-white/20 dark:bg-black/70">
              <CardContent className="space-y-3 py-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-gray-500" />
                    <Input
                      placeholder="Search events or markets..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="relative grid w-full grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-white/10 lg:w-72">
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-md bg-slate-900 shadow-sm transition-transform duration-300 ease-out dark:bg-white ${
                        filterMode === "ALL" ? "translate-x-0" : "translate-x-full"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFilterMode("ALL")}
                      className={`relative z-10 h-8 rounded-md text-sm font-medium transition-colors ${
                        filterMode === "ALL" ? "text-white dark:text-black" : "text-slate-700 dark:text-gray-300"
                      }`}
                    >
                      All Events
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("HAS_ACTIONABLE")}
                      className={`relative z-10 h-8 rounded-md text-sm font-medium transition-colors ${
                        filterMode === "HAS_ACTIONABLE" ? "text-white dark:text-black" : "text-slate-700 dark:text-gray-300"
                      }`}
                    >
                      Tradable Only
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-500">
                  Showing {filteredEvents.length} of {events.length} events
                </p>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="border-slate-200">
                    <CardContent className="space-y-3 py-6">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
                      <div className="h-16 animate-pulse rounded bg-slate-100" />
                      <div className="h-16 animate-pulse rounded bg-slate-100" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}

            {error ? (
              <Card className="border-rose-200">
                <CardContent className="flex flex-col items-start gap-3 py-8">
                  <p className="text-sm text-rose-600">{error}</p>
                  <Button size="sm" onClick={() => void refreshEvents()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && !error && filteredEvents.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="py-10 text-center text-sm text-slate-600">
                  No events match your filters. Try a different search or switch to All Events.
                </CardContent>
              </Card>
            ) : null}

            {!isLoading && !error && filteredEvents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(index * 65, 260)}ms` }}
                  >
                    <EventCard
                      event={event}
                      canTrade={state.balance > 0}
                      marketQuery={searchQuery}
                      onBuy={onBuy}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <div className="animate-fade-up">
            <PositionsView
              positions={state.positions}
              currentPrices={currentPriceIndex}
              onNavigateDashboard={() => setActiveTab("DASHBOARD")}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export function DashboardApp() {
  const { data: session, status } = useSession();
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
  });

  const enableDemoMode = () => {
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    setIsDemoMode(true);
  };

  const disableDemoMode = () => {
    localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    setIsDemoMode(false);
  };

  if (isDemoMode) {
    return (
      <PortfolioProvider userKey="dev-user">
        <TradingContent isDemoMode onExitDemoMode={disableDemoMode} />
      </PortfolioProvider>
    );
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin" />
          Loading session...
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-base font-medium">Sign in is required</p>
            <p className="text-sm text-slate-600">Use Google authentication to access dashboard and positions.</p>
            <div className="flex justify-center">
              <AuthControls />
            </div>
            <Button variant="outline" onClick={enableDemoMode}>
              Continue in Demo Mode
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const userKey = session.user.email ?? session.user.name ?? "anonymous";

  return (
    <PortfolioProvider userKey={userKey}>
      <TradingContent isDemoMode={false} />
    </PortfolioProvider>
  );
}
