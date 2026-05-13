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
