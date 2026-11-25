import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, LogOut, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  AIRPORT_CODES,
  AIRPORT_LABELS,
  CURRENCY_CODES,
  CURRENCY_LABELS,
  formatTargetPrice,
  isDuplicateRouteError,
  routeSubscriptionsQueryKey,
  subscriptionInputSchema,
  type AirportCode,
  type CurrencyCode,
} from "@/lib/subscriptions";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Flight Price Notifier" },
      { name: "description", content: "Watch flights and set the target price you want to pay." },
      { property: "og:title", content: "Dashboard — Flight Price Notifier" },
      { property: "og:description", content: "Watch flights and set the target price you want to pay." },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [origin, setOrigin] = useState<AirportCode>("TPE");
  const [destination, setDestination] = useState<AirportCode>("NRT");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("TWD");
  const [formError, setFormError] = useState<string | null>(null);

  const queryKey = routeSubscriptionsQueryKey(user.id);

  const watches = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("route_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = watches.data ?? [];

  const addWatch = useMutation({
    mutationFn: async (input: {
      origin: AirportCode;
      destination: AirportCode;
      target_price: number;
      currency: CurrencyCode;
    }) => {
      const { error } = await supabase
        .from("route_subscriptions")
        .insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setFormError(null);
      setPrice("");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      setFormError(
        isDuplicateRouteError(error)
          ? "你已經追蹤這條航線 / You're already watching this route."
          : "無法儲存，請稍後再試 / Couldn't save it. Please try again.",
      );
    },
  });

  const removeWatch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("route_subscriptions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = subscriptionInputSchema.safeParse({
      origin,
      destination,
      target_price: price,
      currency,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "請檢查輸入 / Please check your input.");
      return;
    }
    setFormError(null);
    addWatch.mutate(parsed.data);
  }

  function swapAirports() {
    setOrigin(destination);
    setDestination(origin);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader
        right={
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out / 登出
          </Button>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <div className="animate-fade-up rounded-2xl border border-border bg-card p-8 sm:p-10">
          <h1 className="break-all text-3xl font-bold">Hi {user.email}</h1>
          <p className="mt-4 text-lg">追蹤你想買的航線，設定的目標價 — 票價一低於目標就通知你。</p>
          <p className="mt-2 text-muted-foreground">
            Watch the routes you want and set the price you'd pay. We'll email you when a fare drops
            below it.
          </p>
        </div>

        <section className="animate-fade-up mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8 [animation-delay:120ms]">
          <h2 className="text-lg font-semibold">新增追蹤航線 / Add a route to watch</h2>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-2">
                <Label htmlFor="origin">出發 / From</Label>
                <Select value={origin} onValueChange={(v) => setOrigin(v as AirportCode)}>
                  <SelectTrigger id="origin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORT_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {AIRPORT_LABELS[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swapAirports}
                aria-label="Swap origin and destination / 交換出發與抵達"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              <div className="space-y-2">
                <Label htmlFor="destination">抵達 / To</Label>
                <Select value={destination} onValueChange={(v) => setDestination(v as AirportCode)}>
                  <SelectTrigger id="destination">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AIRPORT_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {AIRPORT_LABELS[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <Label htmlFor="target-price">目標價 / Target price</Label>
                <Input
                  id="target-price"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  placeholder="9500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">幣別 / Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {CURRENCY_LABELS[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button type="submit" disabled={addWatch.isPending}>
              <Plus className="h-4 w-4" />
              {addWatch.isPending ? "儲存中… / Saving…" : "開始追蹤 / Watch this route"}
            </Button>
          </form>
        </section>

        <section className="animate-fade-up mt-8 [animation-delay:200ms]">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">你追蹤的航線 / Routes you're watching</h2>
            {!watches.isPending && (
              <span className="text-sm text-muted-foreground">
                {rows.length === 0 ? "還沒有 / none yet" : `${rows.length} 條 / ${rows.length} tracked`}
              </span>
            )}
          </div>

          {watches.isPending && <p className="mt-4 text-sm text-muted-foreground">載入中… / Loading…</p>}

          {watches.isError && (
            <p className="mt-4 text-sm text-destructive">
              無法載入你的追蹤 / Couldn't load your watched routes.
            </p>
          )}

          {watches.isSuccess && rows.length === 0 && (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
              你還沒有追蹤任何航線 — 用上面的表單加一條。 / You're not watching any routes yet. Add one
              above.
            </p>
          )}

          {watches.isSuccess && rows.length > 0 && (
            <ul className="mt-4 space-y-3">
              {rows.map((watch) => (
                <li
                  key={watch.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div>
                    <p className="font-semibold tracking-tight">
                      {watch.origin} <span className="text-muted-foreground">→</span> {watch.destination}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      目標價 / target {formatTargetPrice(watch.target_price, watch.currency)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeWatch.mutate(watch.id)}
                    disabled={removeWatch.isPending}
                    aria-label={`停止追蹤 ${watch.origin} 到 ${watch.destination} / stop watching ${watch.origin} to ${watch.destination}`}
                  >
                    <Trash2 className="h-4 w-4" /> 移除 / Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
