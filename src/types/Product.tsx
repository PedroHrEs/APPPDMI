export interface Product {
  id?: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_anterior?: number;
  desconto?: ProductDiscount;
  data_ultima_alteracao?: number;
  tipo: string;
  imagemUrl?: string;
}

export interface ProductDiscount {
  tipo: "percentage" | "fixed";
  valor: number;
  precoOriginal: number;
  precoComDesconto: number;
  criadoEm: number;
}

export interface CartItem {
  id: string;
  produto: Product;
  quantidade: number;
}

export interface Coupon {
  codigo: string;
  desconto: number;
}

export interface JSONBinResponse {
  record: Product[] | {
    products?: Product[];
    cart?: CartItem[];
    coupons?: Coupon[];
  };
  metadata: any;
}
