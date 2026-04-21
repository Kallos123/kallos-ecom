"use client";

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface PublicStoreSettings {
  store_name: string;
  support_email: string;
  maintenance_mode: boolean;
  razorpay_enabled: boolean;
  cod_enabled: boolean;
  wallet_enabled: boolean;
  free_shipping_above: number;
  return_window_days: number;
  max_cart_quantity: number;
}

export const DEFAULT_STORE_SETTINGS: PublicStoreSettings = {
  store_name: 'KALLOS',
  support_email: 'support@kallos.in',
  maintenance_mode: false,
  razorpay_enabled: true,
  cod_enabled: true,
  wallet_enabled: true,
  free_shipping_above: 999,
  return_window_days: 7,
  max_cart_quantity: 10,
};

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeStoreSettings(
  settings?: Record<string, unknown>
): PublicStoreSettings {
  return {
    store_name: String(settings?.store_name ?? DEFAULT_STORE_SETTINGS.store_name),
    support_email: String(settings?.support_email ?? DEFAULT_STORE_SETTINGS.support_email),
    maintenance_mode: parseBoolean(
      settings?.maintenance_mode,
      DEFAULT_STORE_SETTINGS.maintenance_mode
    ),
    razorpay_enabled: parseBoolean(
      settings?.razorpay_enabled,
      DEFAULT_STORE_SETTINGS.razorpay_enabled
    ),
    cod_enabled: parseBoolean(settings?.cod_enabled, DEFAULT_STORE_SETTINGS.cod_enabled),
    wallet_enabled: parseBoolean(
      settings?.wallet_enabled,
      DEFAULT_STORE_SETTINGS.wallet_enabled
    ),
    free_shipping_above: parseNumber(
      settings?.free_shipping_above,
      DEFAULT_STORE_SETTINGS.free_shipping_above
    ),
    return_window_days: parseNumber(
      settings?.return_window_days,
      DEFAULT_STORE_SETTINGS.return_window_days
    ),
    max_cart_quantity: parseNumber(
      settings?.max_cart_quantity,
      DEFAULT_STORE_SETTINGS.max_cart_quantity
    ),
  };
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const settings = await api.get<Record<string, string>>('/settings/public');
      return normalizeStoreSettings(settings);
    },
    staleTime: 5 * 60 * 1000,
  });
}