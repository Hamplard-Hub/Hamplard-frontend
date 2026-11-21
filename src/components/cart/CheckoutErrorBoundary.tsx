'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, LifeBuoy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const MAX_RETRIES = 4;

interface CheckoutErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface CheckoutErrorBoundaryState {
  hasError: boolean;
  resetKey: number;
  retryCount: number;
  isRetrying: boolean;
  retryCountdown: number;
  isWaiting: boolean;
  waitSecondsLeft: number;
}

export class CheckoutErrorBoundary extends React.Component<
  CheckoutErrorBoundaryProps,
  CheckoutErrorBoundaryState
> {
  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  state: CheckoutErrorBoundaryState = {
    hasError: false,
    resetKey: 0,
    retryCount: 0,
    isRetrying: false,
    retryCountdown: 0,
    isWaiting: false,
    waitSecondsLeft: 0,
  };

  static getDerivedStateFromError(): CheckoutErrorBoundaryState {
    return {
      hasError: true,
      resetKey: 0,
      retryCount: 0,
      isRetrying: false,
      retryCountdown: 0,
      isWaiting: false,
      waitSecondsLeft: 0,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Checkout flow crashed', error, info.componentStack);
  }

  componentWillUnmount() {
    this._clearCountdown();
  }

  private _clearCountdown() {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  /** Exponential backoff delay in seconds: 1, 2, 4, 8 … capped at 16s */
  private _delaySeconds(): number {
    return Math.min(Math.pow(2, this.state.retryCount), 16);
  }

  private handleRetry = () => {
    const { retryCount } = this.state;

    // After max retries just show the support fallback — handled in render
    if (retryCount >= MAX_RETRIES) return;

    const delaySec = this._delaySeconds();

    this.setState({ isWaiting: true, waitSecondsLeft: delaySec });

    this._clearCountdown();
    this.countdownTimer = setInterval(() => {
      this.setState((prev) => {
        if (prev.waitSecondsLeft <= 1) {
          this._clearCountdown();
          // Actually perform the retry
          this.props.onReset?.();
          return {
            ...prev,
            hasError: false,
            isWaiting: false,
            waitSecondsLeft: 0,
            isRetrying: false,
            retryCountdown: 0,
            retryCount: prev.retryCount + 1,
            resetKey: prev.resetKey + 1,
          };
        }
        return { ...prev, waitSecondsLeft: prev.waitSecondsLeft - 1 };
      });
    }, 1000);
  };

  render() {
    const { hasError, retryCount, isWaiting, waitSecondsLeft, resetKey } = this.state;

    if (hasError) {
      const exhausted = retryCount >= MAX_RETRIES;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex h-full min-h-80 flex-col items-center justify-center bg-white px-6 py-12 text-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="h-8 w-8 text-rose-600" aria-hidden="true" />
          </div>

          <h2 className="text-xl font-semibold text-ink-900">Checkout hit a snag</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
            Your cart is safe. Try the checkout again, or contact support if the problem
            continues.
          </p>

          {isWaiting && (
            <p aria-live="polite" className="mt-3 text-sm font-medium text-amber-600">
              Retrying in {waitSecondsLeft}s…
            </p>
          )}

          <div className="mt-6 flex w-full max-w-xs flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              fullWidth
              disabled={isWaiting}
              onClick={this.handleRetry}
              icon={
                <RefreshCw className={`h-4 w-4 ${isWaiting ? 'animate-spin' : ''}`} />
              }
            >
              {isWaiting ? `Retrying in ${waitSecondsLeft}s` : 'Try again'}
            </Button>
            <Link
              href="/help"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-50"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              Contact support
            </Link>
          </div>

          {exhausted ? (
            <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
              We weren&apos;t able to complete checkout after several attempts. Your cart is
              safe — please contact our support team and we&apos;ll sort it out right away.
            </p>
          ) : (
            <>
              {retryCount > 0 && (
                <p className="mt-3 text-xs text-ink-400">
                  Next retry waits {this._delaySeconds()}s (backoff increases each attempt)
                </p>
              )}
            </>
          )}
        </div>
      );
    }

    return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
  }
}
