import { useCallback, useEffect, useState } from "react";

import { createEmptyStore, getStore, saveStore } from "../services/api";
import { Product } from "../types/Product";

export const getProduct = async (): Promise<Product[]> => {
  const store = await getStore();
  return store.products;
};

export const saveProducts = async (products: Product[]): Promise<Product[]> => {
  let store = createEmptyStore();

  try {
    store = await getStore();
  } catch {
    store = createEmptyStore();
  }

  await saveStore({
    ...store,
    products,
  });

  return products;
};

export function useProduct() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProduct();
      setProdutos(data);
    } catch {
      setError("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { produtos, loading, error, reload: load, saveProducts };
}
