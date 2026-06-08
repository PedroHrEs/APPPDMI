export interface Product {
  nome: string;
  descricao: string;
  preco: number;
  tipo: string;
  imagemUrl: string;
}

export interface CartItem {
  id: string;
  produto: Product;
  quantidade: number;
}

export interface CartStore {
  items: CartItem[];
  subtotal: number;
  cartTotal: number;
  couponUsed: Coupon | null;
  cep: string;
  shippingValue: number;
}

export interface Coupon {
  codigo: string;
  desconto: number;
}

export interface JSONBinResponse {
  record: Product[] | {
    products?: Product[];
    cart?: CartItem[] | CartStore;
    coupons?: Coupon[];
  };
  metadata: any;
}
