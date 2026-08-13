"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

export type RealtimeTable =
  | "categories"
  | "products"
  | "product_variants"
  | "product_reviews"
  | "banners"
  | "store_settings"
  | "orders"
  | "order_items"
  | "pages"
  | "staff";

/**
 * Channel names must be unique per subscription.
 *
 * supabase-js returns an *existing* channel when the topic matches, and adding
 * listeners to one that has already subscribed throws. A deterministic name
 * therefore breaks whenever two components subscribe to the same tables — or
 * when an effect remounts before the old channel has finished unsubscribing.
 */
let channelSeq = 0;

/**
 * Keeps a Server Component page live: any change to `tables` re-renders it.
 * Bursts are coalesced so a bulk catalog import triggers one refresh.
 *
 * Renders nothing.
 */
export function RealtimeRefresh({ tables }: { tables: RealtimeTable[] }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = tables.join(",");

  useEffect(() => {
    if (tables.length === 0) return;

    const supabase = createClient();
    const channel = supabase.channel(`store:${key}:${(channelSeq += 1)}`);

    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 300);
    };

    for (const table of tables) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }

    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the stable form of tables
  }, [key, router]);

  return null;
}
