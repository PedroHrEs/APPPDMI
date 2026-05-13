import { useCallback, useEffect, useState } from "react";
import { getProduct } from "../services/api";
import { Product } from "../types/Product";

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

  return { produtos, loading, error, reload: load };
}
