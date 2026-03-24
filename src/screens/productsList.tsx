import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

import AppHeader from "../components/AppHeader";
import { database } from "../services/connectionFirebase";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function ProductsListScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const productsRef = ref(database, "products");

    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productsList = Object.values(data as Record<string, Product>)
        .filter((item) => item && item.id)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      setProducts(productsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const horizontalPadding = width < 480 ? 16 : 24;
  const contentWidth = Math.min(width - horizontalPadding * 2, 1080);
  const isCompactScreen = width < 720;
  const cardGap = 16;
  const cardWidth = isCompactScreen
    ? Math.min(contentWidth, 420)
    : Math.max(280, (contentWidth - cardGap) / 2);

  return (
    <View style={styles.screen}>
      <AppHeader />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { width: "100%", maxWidth: contentWidth }]}>
          <Text style={styles.title}>Produtos</Text>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
          ) : null}

          {!loading && products.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
              <Text style={styles.emptyText}>
                Cadastre um produto pelo menu para ele aparecer aqui.
              </Text>
            </View>
          ) : null}

          {!loading ? (
            <View style={styles.grid}>
              {products.map((product) => (
                <View
                  key={product.id}
                  style={[styles.card, { width: cardWidth }]}
                >
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardPrice}>
                    R$ {product.price.toFixed(2).replace(".", ",")}
                  </Text>
                  <Text style={styles.cardDescription}>{product.description}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 24,
    paddingBottom: 32,
  },
  content: {
    width: "100%",
  },
  title: {
    color: "#FFF",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  stateContainer: {
    minHeight: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: "#121c24",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#24333f",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: "#B7C1C8",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  card: {
    minHeight: 200,
    backgroundColor: "#101820",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1F3240",
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardPrice: {
    color: "#5CE1A8",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  cardDescription: {
    color: "#D8E0E5",
    fontSize: 16,
    lineHeight: 24,
  },
});
