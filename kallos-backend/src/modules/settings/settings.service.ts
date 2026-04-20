import { prisma } from '../../config/database';

// ─── Default settings (seeded on first GET if missing) ───────────────────────

export const SETTING_DEFAULTS: Record<string, string> = {
  // Store
  store_name:              'KALLOS',
  support_email:           'support@kallos.in',
  maintenance_mode:        'false',

  // Payments
  razorpay_enabled:        'true',
  cod_enabled:             'true',
  wallet_enabled:          'true',

  // Shipping
  free_shipping_above:     '499',

  // Orders
  return_window_days:      '7',
  max_cart_quantity:       '10',

  // Inventory
  low_stock_threshold:     '10',
};

export const settingsService = {
  async getAll(): Promise<Record<string, string>> {
    const rows = await prisma.adminSetting.findMany();
    const map: Record<string, string> = { ...SETTING_DEFAULTS };
    for (const row of rows) map[row.key] = row.value;
    return map;
  },

  async updateBatch(updates: Record<string, string>): Promise<Record<string, string>> {
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.adminSetting.upsert({
          where:  { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return this.getAll();
  },

  async update(key: string, value: string): Promise<Record<string, string>> {
    await prisma.adminSetting.upsert({
      where:  { key },
      update: { value },
      create: { key, value },
    });
    return this.getAll();
  },
};
