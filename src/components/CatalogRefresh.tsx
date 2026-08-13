"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";

/**
 * Keeps the storefront live without paying for it.
 *
 * The obvious approach — subscribe every shopper to every catalog table — is
 * ruinously expensive. Each change fans out to every open browser, and each one
 * answers by refetching the whole catalog, so one bulk import multiplies into
 * thousands of queries.
 *
 * Instead the database keeps a single `catalog_version` counter that a
 * statement-level trigger bumps when anything in the catalog changes. Shoppers
 * watch that one row. A hundred-row import is one bump, so it costs one refresh
 * per visitor rather than a hundred.
 */
export function CatalogRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Unique per subscriber: supabase-js hands back an existing channel when
    // the topic matches, and adding listeners after subscribe throws.
    const channel = supabase.channel(`catalog:${Math.random().toString(36).slice(2)}`);

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "store_settings" },
      () => {
        // Coalesce: a burst of writes should cost one refresh, not one each.
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), 600);
      }
    );

    channel.subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
