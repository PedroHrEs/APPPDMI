import type { Product, ProductPayload } from "../models/products";
import { database } from "./connectionFirebase";

import { get, onValue, push, ref, remove, set, update } from "firebase/database";

const PATH = "products";

class ProductService {
  async inserir(product: ProductPayload) {
    const produtosRef = ref(database, PATH);
    const novoRef = push(produtosRef);

    await set(novoRef, {
      ...product,
      preco_anterior: product.preco,
      data_ultima_alteracao: Date.now(),
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

    // Se está alterando o preço, guarda o anterior
    if (product.preco !== undefined) {
      const snapshot = await get(produtoRef);
      const produtoAtual = snapshot.val() as Product | null;

      await update(produtoRef, {
        ...product,
        preco_anterior: produtoAtual?.preco ?? product.preco,
        data_ultima_alteracao: Date.now(),
      });
    } else {
      await update(produtoRef, {
        ...product,
        data_ultima_alteracao: Date.now(),
      });
    }
  }

  async excluir(id: string) {
    const produtoRef = ref(database, `${PATH}/${id}`);
    await remove(produtoRef);
  }

  subscribeToProductChanges(callback: (products: Product[]) => void) {
    const produtosRef = ref(database, PATH);

    const unsubscribe = onValue(produtosRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const data = snapshot.val() as Record<string, Product>;
      const products = Object.keys(data).map((key) => ({
        ...data[key],
        id: data[key].id ?? key,
      }));

      callback(products);
    });

    return unsubscribe;
  }
}

export const productService = new ProductService();
