import type { Product, ProductPayload } from "../models/products";
import { database } from "./connectionFirebase";

import {
    get,
    push,
    ref,
    remove,
    set,
    update
} from "firebase/database";

const PATH = "products";

class ProductService {
  async inserir(product: ProductPayload) {
    const produtosRef = ref(database, PATH);
    const novoRef = push(produtosRef);

    await set(novoRef, {
      ...product,
      id: novoRef.key,
    });
  }

  async listar(): Promise<Product[]> {
    const produtosRef = ref(database, PATH);
    const snapshot = await get(produtosRef);

    if (!snapshot.exists()) return [];

    const data = snapshot.val() as Record<string, Product>;

    return Object.keys(data).map((key) => ({
      ...data[key],
      id: data[key].id ?? key,
    }));
  }

  async alterar(id: string, product: Partial<ProductPayload>) {
    const produtoRef = ref(database, `${PATH}/${id}`);
    await update(produtoRef, product);
  }

  async excluir(id: string) {
    const produtoRef = ref(database, `${PATH}/${id}`);
    await remove(produtoRef);
  }
}

export const productService = new ProductService();
