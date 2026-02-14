"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

import { INITIAL_WALLET_BALANCE } from "@/lib/constants";
import type { BuyInput, PortfolioState, Position } from "@/types/portfolio";

const STORAGE_PREFIX = "predictions-dashboard";

interface PortfolioContextValue {
  state: PortfolioState;
  buyPosition: (input: BuyInput) => { success: true } | { success: false; reason: string };
  addFunds: (amount: number) => { success: true } | { success: false; reason: string };
  clearPortfolio: () => void;
}

const defaultState: PortfolioState = {
  balance: INITIAL_WALLET_BALANCE,
  positions: [],
};

type Action =
  | { type: "LOAD"; payload: PortfolioState }
  | { type: "BUY"; payload: BuyInput }
  | { type: "ADD_FUNDS"; payload: { amount: number } }
  | { type: "RESET" };

function createStorageKey(userKey: string): string {
  return `${STORAGE_PREFIX}:${userKey}:portfolio`;
}

function createPositionId(marketId: string, side: Position["side"]): string {
  return `${marketId}:${side}`;
}

function reducer(state: PortfolioState, action: Action): PortfolioState {
  if (action.type === "LOAD") {
    return action.payload;
  }

  if (action.type === "RESET") {
    return defaultState;
  }

  if (action.type === "ADD_FUNDS") {
    return {
      ...state,
      balance: state.balance + action.payload.amount,
    };
  }

  const { amount, eventId, eventTitle, marketId, marketTitle, price, side, timestamp } = action.payload;

  const quantity = amount / price;
  const nextBalance = state.balance - amount;
  const existing = state.positions.find((position) => position.marketId === marketId && position.side === side);

  if (!existing) {
    const nextPosition: Position = {
      id: createPositionId(marketId, side),
      eventId,
      eventTitle,
      marketId,
      marketTitle,
      side,
      averagePrice: price,
      quantity,
      totalInvested: amount,
      lastTradeAt: timestamp,
    };

    return {
      balance: nextBalance,
      positions: [...state.positions, nextPosition],
    };
  }

  const nextTotalInvested = existing.totalInvested + amount;
  const nextQuantity = existing.quantity + quantity;

  const updatedPosition: Position = {
    ...existing,
    averagePrice: nextTotalInvested / nextQuantity,
    totalInvested: nextTotalInvested,
    quantity: nextQuantity,
    lastTradeAt: timestamp,
  };

  return {
    balance: nextBalance,
    positions: state.positions.map((position) =>
      position.id === existing.id ? updatedPosition : position,
    ),
  };
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

interface PortfolioProviderProps {
  children: React.ReactNode;
  userKey: string;
}

export function PortfolioProvider({ children, userKey }: PortfolioProviderProps) {
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    if (!userKey) {
      dispatch({ type: "RESET" });
      return;
    }

    const storageKey = createStorageKey(userKey);
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      dispatch({ type: "LOAD", payload: defaultState });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PortfolioState>;
      const balance = Number(parsed.balance);
      const positions = Array.isArray(parsed.positions) ? parsed.positions : [];

      dispatch({
        type: "LOAD",
        payload: {
          balance: Number.isFinite(balance) ? balance : INITIAL_WALLET_BALANCE,
          positions,
        },
      });
    } catch {
      dispatch({ type: "LOAD", payload: defaultState });
    }
  }, [userKey]);

  useEffect(() => {
    if (!userKey) {
      return;
    }

    const storageKey = createStorageKey(userKey);
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, userKey]);

  const value = useMemo<PortfolioContextValue>(
    () => ({
      state,
      clearPortfolio: () => dispatch({ type: "RESET" }),
      buyPosition: (input) => {
        if (input.price <= 0 || input.amount <= 0) {
          return { success: false, reason: "Invalid order values." };
        }

        if (state.balance < input.amount) {
          return { success: false, reason: "Insufficient wallet balance." };
        }

        dispatch({ type: "BUY", payload: input });
        return { success: true };
      },
      addFunds: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) {
          return { success: false, reason: "Enter a valid amount." };
        }

        dispatch({ type: "ADD_FUNDS", payload: { amount } });
        return { success: true };
      },
    }),
    [state],
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within PortfolioProvider");
  }

  return context;
}
