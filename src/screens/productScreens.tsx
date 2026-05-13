import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Platform,
} from "react-native";

import AppHeader from "../components/AppHeader";
import ProductCard from "../components/ProductCard";
import { useProduct } from "../hooks/useProduct";
import { getCart, saveCart, saveProducts } from "../services/api";
import { CartItem, Product } from "../types/Product";

type ProductItem = Product & {
  localId: string;
};

export default function ProductsListScreen() {
  const { produtos, loading, error, reload } = useProduct();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartMenuVisible, setCartMenuVisible] = useState(false);
  const [selectedCartProduct, setSelectedCartProduct] =
    useState<ProductItem | null>(null);
  const [cartQuantity, setCartQuantity] = useState("1");

  const horizontalPadding = width < 480 ? 16 : 24;
  const maxContentWidth = 1080;
  const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
  const numColumns = width >= 900 ? 3 : width >= 620 ? 2 : 1;
  const cardGap = 14;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;
  const isFormValid = useMemo(() => {
    const precoNumero = Number(preco.replace(",", "."));
    return (
      nome.trim().length >= 2 &&
      tipo.trim().length >= 2 &&
      descricao.trim().length >= 5 &&
      !Number.isNaN(precoNumero) &&
      precoNumero > 0 &&
      (imagemUrl.trim().length === 0 ||
        /^https?:\/\/.+/i.test(imagemUrl.trim()))
    );
  }, [descricao, imagemUrl, nome, preco, tipo]);

  useEffect(() => {
    const mapped = produtos.map((produto, index) => ({
      ...produto,
      localId: `${produto.nome}-${index}-${produto.preco}`,
    }));
    setItems(mapped);
  }, [produtos]);

  const toApiProducts = (list: ProductItem[]): Product[] =>
    list.map(({ localId, ...product }) => product);

  const toCartProduct = ({ localId, ...product }: ProductItem): Product =>
    product;

  const productCartId = (produto: Product) =>
    `${produto.nome}-${produto.tipo}-${produto.preco}`;

  const loadCart = useCallback(async () => {
    try {
      const cart = await getCart();
      setCartItems(cart);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar o carrinho.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      void loadCart();
    }, [loadCart, reload]),
  );

  const persistCart = async (nextCart: CartItem[]) => {
    setCartItems(nextCart);

    try {
      await saveCart(nextCart);
      Alert.alert("Carrinho", "Produto adicionado ao carrinho.");
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar o carrinho na API.");
      await loadCart();
    } finally {
      setAddingProductId(null);
    }
  };

  const openCartMenu = (produto: ProductItem) => {
    setSelectedCartProduct(produto);
    setCartQuantity("1");
    setCartMenuVisible(true);
  };

  const closeCartMenu = () => {
    setCartMenuVisible(false);
    setSelectedCartProduct(null);
    setCartQuantity("1");
  };

  const updateCartQuantity = (nextQuantity: number) => {
    setCartQuantity(String(Math.max(1, nextQuantity)));
  };

  const onConfirmAddToCart = async () => {
    if (!selectedCartProduct) {
      return;
    }

    const quantity = Math.max(1, Number(cartQuantity) || 1);
    const id = productCartId(selectedCartProduct);
    const product = toCartProduct(selectedCartProduct);
    setAddingProductId(selectedCartProduct.localId);

    let currentCart = cartItems;

    try {
      currentCart = await getCart();
      setCartItems(currentCart);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar o carrinho atualizado.");
      setAddingProductId(null);
      return;
    }

    const existingItem = currentCart.find((item) => item.id === id);
    const nextCart = existingItem
      ? currentCart.map((item) =>
          item.id === id
            ? {
                ...item,
                quantidade: item.quantidade + quantity,
                produto: product,
              }
            : item,
        )
      : [
          ...currentCart,
          {
            id,
            produto: product,
            quantidade: quantity,
          },
        ];

    closeCartMenu();
    await persistCart(nextCart);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setNome("");
    setTipo("");
    setDescricao("");
    setPreco("");
    setImagemUrl("");
  };

  const onCreate = () => {
    setEditingId(null);
    setNome("");
    setTipo("");
    setDescricao("");
    setPreco("");
    setImagemUrl("");
    setModalVisible(true);
  };

  const onEdit = (item: ProductItem) => {
    setEditingId(item.localId);
    setNome(item.nome);
    setTipo(item.tipo);
    setDescricao(item.descricao);
    setPreco(String(item.preco));
    setImagemUrl(item.imagemUrl ?? "");
    setModalVisible(true);
  };

  const onDelete = (localId: string) => {
    const confirmDelete = async () => {
      const nextItems = items.filter((item) => item.localId !== localId);

      try {
        setSaving(true);
        await saveProducts(toApiProducts(nextItems));
        setItems(nextItems);
        await reload();
      } catch {
        Alert.alert("Erro", "Nao foi possivel excluir o produto na API.");
      } finally {
        setSaving(false);
      }
    };

    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Deseja excluir este produto?")) {
        void confirmDelete();
      }
      return;
    }

    Alert.alert("Excluir produto", "Deseja excluir este produto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void confirmDelete();
        },
      },
    ]);
  };

  const onSaveProduct = async () => {
    if (!isFormValid) {
      return;
    }

    const precoNumero = Number(preco.replace(",", "."));
    let nextItems: ProductItem[] = [];

    if (editingId) {
      nextItems = items.map((item) =>
          item.localId === editingId
            ? {
                ...item,
                nome: nome.trim(),
                tipo: tipo.trim(),
                descricao: descricao.trim(),
                preco: precoNumero,
                imagemUrl: imagemUrl.trim(),
              }
            : item,
        );
    } else {
      const newItem: ProductItem = {
        localId: `local-${Date.now()}`,
        nome: nome.trim(),
        tipo: tipo.trim(),
        descricao: descricao.trim(),
        preco: precoNumero,
        imagemUrl: imagemUrl.trim(),
      };
      nextItems = [newItem, ...items];
    }
    try {
      setSaving(true);
      await saveProducts(toApiProducts(nextItems));
      setItems(nextItems);
      await reload();
      closeModal();
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o produto na API.");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: ProductItem }) => (
    <ProductCard
      produto={item}
      cardWidth={cardWidth}
      onAddToCart={() => {
        openCartMenu(item);
      }}
      addingToCart={addingProductId === item.localId}
      onEdit={() => onEdit(item)}
      onDelete={() => onDelete(item.localId)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Carregando produtos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />

      <FlatList
        key={numColumns}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.localId}
        ListHeaderComponent={
          <View style={styles.headerActions}>
            <Text style={styles.pageTitle}>Produtos</Text>
            <TouchableOpacity style={styles.newButton} onPress={onCreate}>
              <Text style={styles.newButtonText}>Cadastrar novo produto</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { width: Math.min(width - 32, 560) }]}>
            <Text style={styles.modalTitle}>
              {editingId ? "Editar produto" : "Novo produto"}
            </Text>

            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Nome"
              placeholderTextColor="#8da2af"
            />
            <TextInput
              style={styles.input}
              value={tipo}
              onChangeText={setTipo}
              placeholder="Tipo"
              placeholderTextColor="#8da2af"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descricao"
              placeholderTextColor="#8da2af"
              multiline
              textAlignVertical="top"
            />
            <TextInput
              style={styles.input}
              value={preco}
              onChangeText={setPreco}
              placeholder="Preco"
              placeholderTextColor="#8da2af"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              value={imagemUrl}
              onChangeText={setImagemUrl}
              placeholder="URL da imagem (opcional)"
              placeholderTextColor="#8da2af"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (!isFormValid || saving) && styles.buttonDisabled,
                ]}
                onPress={onSaveProduct}
                disabled={!isFormValid || saving}
              >
                <Text style={styles.modalButtonText}>
                  {saving ? "Salvando..." : editingId ? "Salvar" : "Cadastrar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={cartMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCartMenu}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.quantityCard, { width: Math.min(width - 32, 420) }]}>
            <Text style={styles.modalTitle}>Adicionar ao carrinho</Text>

            <Text numberOfLines={2} style={styles.quantityProductName}>
              {selectedCartProduct?.nome}
            </Text>

            <Text style={styles.quantityLabel}>Quantidade</Text>

            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateCartQuantity(Number(cartQuantity) - 1)}
                disabled={addingProductId !== null}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.quantityInput}
                value={cartQuantity}
                onChangeText={(value) =>
                  setCartQuantity(value.replace(/[^0-9]/g, ""))
                }
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor="#8da2af"
                textAlign="center"
              />

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateCartQuantity(Number(cartQuantity) + 1)}
                disabled={addingProductId !== null}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeCartMenu}
                disabled={addingProductId !== null}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  addingProductId !== null && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void onConfirmAddToCart();
                }}
                disabled={addingProductId !== null}
              >
                <Text style={styles.modalButtonText}>
                  {addingProductId !== null ? "Adicionando..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030d13",
  },
  listContent: {
    width: "100%",
    maxWidth: 1080,
    alignSelf: "center",
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerActions: {
    marginBottom: 14,
    gap: 10,
  },
  pageTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  newButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  newButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  columnWrapper: {
    gap: 14,
  },
  loadingText: {
    color: "#9ba1a6",
    marginTop: 10,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    color: "#9ba1a6",
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#11202a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 16,
    gap: 10,
  },
  quantityCard: {
    backgroundColor: "#11202a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  quantityProductName: {
    color: "#b7c0c8",
    fontSize: 15,
    lineHeight: 20,
  },
  quantityLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#20313c",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  quantityInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#0b1820",
    borderWidth: 1,
    borderColor: "#1f2e39",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0b1820",
    borderWidth: 1,
    borderColor: "#1f2e39",
    color: "#ffffff",
  },
  textArea: {
    minHeight: 96,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#2b3a44",
  },
  saveButton: {
    backgroundColor: "#0a7ea4",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
