import { useCallback, useEffect, useState } from "react";

import { getStore, saveStore } from "../services/api";
import { Coupon } from "../types/Product";

export const getCoupons = async (): Promise<Coupon[]> => {
  const store = await getStore();
  return store.coupons;
};

export const saveCoupons = async (coupons: Coupon[]): Promise<Coupon[]> => {
  const store = await getStore();
  const normalizedCoupons = coupons.map((coupon) => ({
    ...coupon,
    codigo: coupon.codigo.trim().toUpperCase(),
  }));

  await saveStore({
    ...store,
    coupons: normalizedCoupons,
  });

  return normalizedCoupons;
};

export function useCoupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCoupons();
      setCoupons(data);
    } catch {
      setError("Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { coupons, loading, error, reload: load, saveCoupons };
}
