import axios from "axios";

import { CartItem, Coupon, Product } from "../types/Product";

import { API_KEY, URL, WRITE_URL } from "../constants/config";

const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY,
};

type StoreData = {
  products: Product[];
  cart: CartItem[];
  coupons: Coupon[];
};

function createEmptyStore(): StoreData {
  return {
    products: [],
    cart: [],
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

function parseCart(data: any): CartItem[] {
  if (Array.isArray(data?.record?.cart)) {
    return data.record.cart as CartItem[];
  }

  return [];
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

async function getStore(): Promise<StoreData> {
  const response = await axios.get(URL, { headers });

  return {
    products: parseProducts(response.data),
    cart: parseCart(response.data),
    coupons: parseCoupons(response.data),
  };
}

async function saveStore(store: StoreData): Promise<StoreData> {
  await axios.put(WRITE_URL, store, { headers });
  return store;
}

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

export const getCart = async (): Promise<CartItem[]> => {
  const store = await getStore();
  return store.cart;
};

export const saveCart = async (cart: CartItem[]): Promise<CartItem[]> => {
  const store = await getStore();

  await saveStore({
    ...store,
    cart,
  });

  return cart;
};

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
