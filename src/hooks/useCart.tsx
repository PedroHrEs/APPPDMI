import { useCallback, useEffect, useState } from "react";

import { getStore, saveStore } from "../services/api";
import { CartItem, CartStore, Coupon } from "../types/Product";

export const getCart = async (): Promise<CartItem[]> => {
  const store = await getStore();
  return store.cart.items;
};

export const getCartStore = async (): Promise<CartStore> => {
  const store = await getStore();
  return store.cart;
};

export const saveCart = async (
  cart: CartItem[],
  subtotal = 0,
  cartTotal = 0,
  couponUsed: Coupon | null = null,
  cep = "",
  shippingValue = 0,
): Promise<CartItem[]> => {
  const store = await getStore();

  await saveStore({
    ...store,
    cart: {
      items: cart,
      subtotal,
      cartTotal,
      couponUsed: couponUsed
        ? {
            ...couponUsed,
            codigo: couponUsed.codigo.trim().toUpperCase(),
          }
        : null,
      cep,
      shippingValue,
    },
  });

  return cart;
};

export function useCart() {
  const [cart, setCart] = useState<CartStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCartStore();
      setCart(data);
    } catch {
      setError("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { cart, loading, error, reload: load, saveCart };
}
