"use client";

import { Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Honest trust-model disclosure. Ace must not oversell its privacy.
 */
export function TrustModel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          Trust &amp; privacy model
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-200">
            <EyeOff className="h-4 w-4" /> What Ace hides
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• User&apos;s private application activity</li>
            <li>• Private transaction history inside Ace</li>
            <li>
              • Direct association between the user and Ace&apos;s executor, where
              applicable
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-200">
            <Eye className="h-4 w-4" /> What Ace does NOT hide
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Public blockchain transactions made by Ace&apos;s executor</li>
            <li>• Amounts / positions visible in the external prediction protocol</li>
            <li>• Information inherently exposed by the external protocol</li>
          </ul>
        </div>

        <div className="md:col-span-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <div className="text-xs font-medium uppercase tracking-wider text-amber-300">
            Trust assumption
          </div>
          <p className="mt-1 text-sm text-amber-100/80">
            This MVP trusts Ace&apos;s executor to execute private intents
            correctly. A future version can replace this trusted executor with
            cryptographic verification / ZK execution. Ace does not currently
            provide cryptographic position privacy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
