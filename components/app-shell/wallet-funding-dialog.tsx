"use client";

import { DollarSign, Loader2, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

interface WalletFundingDialogProps {
  onAddFunds: (amount: number) => { success: true } | { success: false; reason: string };
}

const quickAmounts = [50, 100, 250, 500];

export function WalletFundingDialog({ onAddFunds }: WalletFundingDialogProps) {
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("100");
  const [isProcessing, setIsProcessing] = useState(false);

  const parsedAmount = useMemo(() => Number(amountInput), [amountInput]);
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const selectedPresetIndex = quickAmounts.findIndex((amount) => amount === parsedAmount);

  async function handleSubmit() {
    if (!isAmountValid || isProcessing) {
      return;
    }

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 320));

    const result = onAddFunds(parsedAmount);
    setIsProcessing(false);

    if (!result.success) {
      toast.error(result.reason);
      return;
    }

    toast.success(`Added ${formatCurrency(parsedAmount)} to wallet.`);
    setOpen(false);
    setAmountInput("100");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="transition-transform active:scale-95 dark:border-white/20 dark:bg-black dark:text-white">
          <PlusCircle className="size-4" />
          Add Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund your simulated wallet</DialogTitle>
          <DialogDescription>
            Add virtual balance to continue placing trades. This does not use real money.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 dark:bg-white/10">
            <div
              className={`pointer-events-none absolute h-[calc(50%-0.5rem)] w-[calc(50%-0.5rem)] rounded-md bg-slate-900 shadow-sm transition-all duration-300 ease-out ${
                selectedPresetIndex === -1
                  ? "opacity-0"
                  : selectedPresetIndex === 0
                    ? "top-1 left-1 opacity-100"
                    : selectedPresetIndex === 1
                      ? "top-1 left-[calc(50%+0.25rem)] opacity-100"
                      : selectedPresetIndex === 2
                        ? "top-[calc(50%+0.25rem)] left-1 opacity-100"
                        : "top-[calc(50%+0.25rem)] left-[calc(50%+0.25rem)] opacity-100"
              }`}
            />
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setAmountInput(String(amount))}
                className={`relative z-10 rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  parsedAmount === amount
                    ? "border-transparent bg-transparent text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/20 dark:bg-black dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="fund-amount" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              Custom amount
            </label>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 dark:text-gray-500" />
              <Input
                id="fund-amount"
                type="number"
                min={1}
                step={1}
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!isAmountValid || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Add to wallet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
