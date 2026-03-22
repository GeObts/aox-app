'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { leads as hardcodedLeads, type Lead } from '@/lib/leads';

const API_URL = '/api/leads';
const POLL_INTERVAL = 60_000;

export interface UseLeadsReturn {
  leads: Lead[];
  newLeadIds: Set<string>;
  clearNewFlag: (id: string) => void;
  isLive: boolean;
}

function normalizeLead(raw: Record<string, unknown>): Lead {
  const meta = (raw.metadata as Record<string, unknown>) ?? {};
  return {
    id: (raw.id as string) ?? (raw._id as string) ?? '',
    category: (raw.category as string) ?? 'Misc',
    title: (raw.title as string) ?? '',
    desc: (raw.desc as string) ?? (raw.description as string) ?? '',
    score: Number(raw.score) || 0,
    price: Number(raw.price) || 0,
    tier: (['standard', 'premium', 'enterprise', 'elite'] as const).includes(raw.tier as 'standard' | 'premium' | 'enterprise' | 'elite')
      ? (raw.tier as 'standard' | 'premium' | 'enterprise' | 'elite')
      : 'standard',
    wallet_age: (raw.wallet_age as string) ?? '',
    liquidity: (raw.liquidity as string) ?? (meta.liquidity_reserve ? `$${Number(meta.liquidity_reserve).toLocaleString()}` : ''),
    contacts: Number(raw.contacts) || Number(meta.unique_buyers) || 0,
    chain: (raw.chain as string) ?? (meta.chain as string) ?? 'Base',
    timestamp: (raw.timestamp as string) ?? (raw.listed_at as string) ?? new Date().toISOString(),
    win_rate: raw.win_rate as string | undefined,
    volume: (raw.volume as string) ?? (meta.volume_24h ? `$${Number(meta.volume_24h).toLocaleString()}` : undefined),
    markets: raw.markets !== undefined ? Number(raw.markets) : (meta.transactions !== undefined ? Number(meta.transactions) : undefined),
  };
}

function sortByTimestamp(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>(() => sortByTimestamp(hardcodedLeads));
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const [isLive, setIsLive] = useState(false);
  const knownIds = useRef<Set<string>>(new Set(hardcodedLeads.map((l) => l.id)));

  const fetchLeads = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.leads ?? data.listings ?? []);
      const apiLeads: Lead[] = raw.map((r: Record<string, unknown>) => normalizeLead(r));

      if (apiLeads.length === 0) return;

      const freshIds = new Set<string>();
      for (const lead of apiLeads) {
        if (!knownIds.current.has(lead.id)) {
          freshIds.add(lead.id);
          knownIds.current.add(lead.id);
        }
      }

      // Merge: API leads + hardcoded leads (API wins on duplicate IDs)
      const apiIdSet = new Set(apiLeads.map((l) => l.id));
      const kept = hardcodedLeads.filter((l) => !apiIdSet.has(l.id));
      setLeads(sortByTimestamp([...apiLeads, ...kept]));
      if (freshIds.size > 0) {
        setNewLeadIds((prev) => {
          const merged = new Set(Array.from(prev));
          freshIds.forEach((id) => merged.add(id));
          return merged;
        });
      }
      setIsLive(true);
    } catch {
      setIsLive(false);
    }
  }, []);

  const clearNewFlag = useCallback((id: string) => {
    setNewLeadIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  return { leads, newLeadIds, clearNewFlag, isLive };
}
