export interface Product {
  nome: string;
  descricao: string;
  preco: number;
  tipo: string;
  imagemUrl: string;
}
export interface JSONBinResponse {
  record: Product;
  metadata: any;
}
