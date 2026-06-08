import axios from "axios";

import { CartItem, CartStore, Coupon, Product } from "../types/Product";

import { API_KEY, URL, WRITE_URL } from "../constants/config";

const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY,
};

export type StoreData = {
  products: Product[];
  cart: CartStore;
  coupons: Coupon[];
};

export function createEmptyStore(): StoreData {
  return {
    products: [],
    cart: {
      items: [],
      subtotal: 0,
      cartTotal: 0,
      couponUsed: null,
      cep: "",
      shippingValue: 0,
    },
    coupons: [],
  };
}

function parseProducts(data: any): Product[] {
  if (Array.isArray(data?.record?.products)) {
    return data.record.products as Product[];
  }

  if (Array.isArray(data?.record?.record)) {
    return data.record.record as Product[];
  }

  if (Array.isArray(data?.record)) {
    return data.record as Product[];
  }

  return [];
}

function parseCart(data: any): CartStore {
  const cart = data?.record?.cart;

  if (Array.isArray(cart)) {
    return {
      items: cart as CartItem[],
      subtotal: 0,
      cartTotal: Number(data?.record?.cartTotal || 0),
      couponUsed: null,
      cep: "",
      shippingValue: 0,
    };
  }

  if (Array.isArray(cart?.items)) {
    return {
      items: cart.items as CartItem[],
      subtotal: Number(cart.subtotal || 0),
      cartTotal: Number(cart.cartTotal || 0),
      couponUsed: cart.couponUsed
        ? {
            ...cart.couponUsed,
            codigo: String(cart.couponUsed.codigo || "").toUpperCase(),
            desconto: Number(cart.couponUsed.desconto || 0),
          }
        : null,
      cep: String(cart.cep || ""),
      shippingValue: Number(cart.shippingValue || 0),
    };
  }

  return {
    items: [],
    subtotal: 0,
    cartTotal: 0,
    couponUsed: null,
    cep: "",
    shippingValue: 0,
  };
}

function parseCoupons(data: any): Coupon[] {
  if (Array.isArray(data?.record?.coupons)) {
    return (data.record.coupons as Coupon[]).map((coupon) => ({
      ...coupon,
      codigo: coupon.codigo.toUpperCase(),
    }));
  }

  return [];
}

export async function getStore(): Promise<StoreData> {
  const response = await axios.get(URL, { headers });

  return {
    products: parseProducts(response.data),
    cart: parseCart(response.data),
    coupons: parseCoupons(response.data),
  };
}

export async function saveStore(store: StoreData): Promise<StoreData> {
  await axios.put(WRITE_URL, store, { headers });
  return store;
}
