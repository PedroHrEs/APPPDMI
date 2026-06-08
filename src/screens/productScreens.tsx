import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import AppHeader from "../components/AppHeader";
import ProductCard from "../components/ProductCard";
import { getCart, saveCart } from "../hooks/useCart";
import { useProduct } from "../hooks/useProduct";
import {
  notifyProductPriceDrop,
  publishProductCreatedNotification,
  publishProductDiscountNotification,
  publishProductUpdatedNotification,
} from "../services/priceNotificationListener";
import { CartItem, Product, ProductDiscount } from "../types/Product";

type ProductItem = Product & {
  localId: string;
};

type PriceSortOrder = "none" | "asc" | "desc";

function normalizeFilterText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ProductsListScreen() {
  const { produtos, loading, error, reload, saveProducts } = useProduct();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceSortOrder, setPriceSortOrder] = useState<PriceSortOrder>("none");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [createDiscountEnabled, setCreateDiscountEnabled] = useState(false);
  const [createDiscountType, setCreateDiscountType] =
    useState<ProductDiscount["tipo"]>("percentage");
  const [createDiscountValue, setCreateDiscountValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [cartMenuVisible, setCartMenuVisible] = useState(false);
  const [selectedCartProduct, setSelectedCartProduct] =
    useState<ProductItem | null>(null);
  const [cartQuantity, setCartQuantity] = useState("1");
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedDiscountProduct, setSelectedDiscountProduct] =
    useState<ProductItem | null>(null);
  const [discountType, setDiscountType] =
    useState<ProductDiscount["tipo"]>("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountSavingId, setDiscountSavingId] = useState<string | null>(null);

  const horizontalPadding = width < 480 ? 16 : 24;
  const maxContentWidth = 1080;
  const contentWidth = Math.min(width - horizontalPadding * 2, maxContentWidth);
  const numColumns = width >= 900 ? 3 : width >= 620 ? 2 : 1;
  const cardGap = 14;
  const cardWidth = (contentWidth - cardGap * (numColumns - 1)) / numColumns;
  const productFormPrice = useMemo(
    () => Number(preco.replace(",", ".")),
    [preco],
  );
  const parsedCreateDiscountValue = useMemo(() => {
    const parsed = Number(createDiscountValue.replace(",", "."));

    return Number.isNaN(parsed) ? null : parsed;
  }, [createDiscountValue]);
  const createDiscountPreviewPrice = useMemo(() => {
    if (!createDiscountEnabled || parsedCreateDiscountValue === null) {
      return null;
    }

    if (createDiscountType === "percentage") {
      return Math.max(
        0,
        productFormPrice * (1 - parsedCreateDiscountValue / 100),
      );
    }

    return Math.max(0, productFormPrice - parsedCreateDiscountValue);
  }, [
    createDiscountEnabled,
    createDiscountType,
    parsedCreateDiscountValue,
    productFormPrice,
  ]);
  const isCreateDiscountFormValid =
    !createDiscountEnabled ||
    (parsedCreateDiscountValue !== null &&
      parsedCreateDiscountValue > 0 &&
      !Number.isNaN(productFormPrice) &&
      productFormPrice > 0 &&
      (createDiscountType === "fixed" || parsedCreateDiscountValue <= 100) &&
      createDiscountPreviewPrice !== null &&
      createDiscountPreviewPrice < productFormPrice);
  const isFormValid = useMemo(
    () =>
      nome.trim().length >= 2 &&
      tipo.trim().length >= 2 &&
      descricao.trim().length >= 5 &&
      !Number.isNaN(productFormPrice) &&
      productFormPrice > 0 &&
      (imagemUrl.trim().length === 0 ||
        /^https?:\/\/.+/i.test(imagemUrl.trim())) &&
      isCreateDiscountFormValid,
    [
      descricao,
      imagemUrl,
      isCreateDiscountFormValid,
      nome,
      productFormPrice,
      tipo,
    ],
  );
  const parsedDiscountValue = useMemo(() => {
    const parsed = Number(discountValue.replace(",", "."));

    return Number.isNaN(parsed) ? null : parsed;
  }, [discountValue]);
  const discountBasePrice =
    selectedDiscountProduct?.desconto?.precoOriginal ??
    selectedDiscountProduct?.preco_anterior ??
    selectedDiscountProduct?.preco ??
    0;
  const discountPreviewPrice = useMemo(() => {
    if (!selectedDiscountProduct || parsedDiscountValue === null) {
      return null;
    }

    if (discountType === "percentage") {
      return Math.max(0, discountBasePrice * (1 - parsedDiscountValue / 100));
    }

    return Math.max(0, discountBasePrice - parsedDiscountValue);
  }, [
    discountBasePrice,
    discountType,
    parsedDiscountValue,
    selectedDiscountProduct,
  ]);
  const isDiscountFormValid =
    !!selectedDiscountProduct &&
    parsedDiscountValue !== null &&
    parsedDiscountValue > 0 &&
    (discountType === "fixed" || parsedDiscountValue <= 100) &&
    discountPreviewPrice !== null &&
    discountPreviewPrice < discountBasePrice;
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.tipo.trim())
            .filter((category) => category.length > 0),
        ),
      ).sort((current, next) => current.localeCompare(next, "pt-BR")),
    [items],
  );
  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeFilterText(appliedSearchTerm);

    const filteredProducts = items.filter((item) => {
      const matchesName =
        !normalizedSearch ||
        normalizeFilterText(item.nome).includes(normalizedSearch);
      const matchesCategory =
        !selectedCategory || item.tipo.trim() === selectedCategory;

      return matchesName && matchesCategory;
    });

    if (priceSortOrder === "none") {
      return filteredProducts;
    }

    return [...filteredProducts].sort((current, next) =>
      priceSortOrder === "asc"
        ? current.preco - next.preco
        : next.preco - current.preco,
    );
  }, [appliedSearchTerm, items, priceSortOrder, selectedCategory]);
  const hasActiveFilters =
    appliedSearchTerm.trim().length > 0 ||
    selectedCategory !== null ||
    priceSortOrder !== "none";

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

  const notifySavedDiscount = async (product: Product) => {
    try {
      await publishProductDiscountNotification(product);
      await notifyProductPriceDrop(product);
    } catch (error) {
      console.error("Erro ao publicar notificacao de desconto:", error);
      Alert.alert(
        "Desconto salvo",
        "O desconto foi salvo, mas nao foi possivel notificar os usuarios na web.",
      );
    }
  };

  const notifyUpdatedProduct = async (product: Product) => {
    try {
      await publishProductUpdatedNotification(product);
    } catch (error) {
      console.error("Erro ao publicar notificacao de atualizacao:", error);
      Alert.alert(
        "Produto atualizado",
        "O produto foi salvo, mas nao foi possivel notificar os usuarios.",
      );
    }
  };

  const notifyCreatedProduct = async (product: Product) => {
    try {
      await publishProductCreatedNotification(product);
    } catch (error) {
      console.error("Erro ao publicar notificacao de produto:", error);
      Alert.alert(
        "Produto cadastrado",
        "O produto foi salvo, mas nao foi possivel notificar os usuarios na web.",
      );
    }
  };

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

  const openDiscountMenu = (produto: ProductItem) => {
    setSelectedDiscountProduct(produto);
    setDiscountType(produto.desconto?.tipo ?? "percentage");
    setDiscountValue(
      produto.desconto?.valor ? String(produto.desconto.valor) : "",
    );
    setDiscountModalVisible(true);
  };

  const closeDiscountMenu = () => {
    setDiscountModalVisible(false);
    setSelectedDiscountProduct(null);
    setDiscountType("percentage");
    setDiscountValue("");
  };

  const clearProductFilters = () => {
    setPendingSearchTerm("");
    setAppliedSearchTerm("");
    setSelectedCategory(null);
    setPriceSortOrder("none");
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
    setCreateDiscountEnabled(false);
    setCreateDiscountType("percentage");
    setCreateDiscountValue("");
  };

  const onCreate = () => {
    setEditingId(null);
    setNome("");
    setTipo("");
    setDescricao("");
    setPreco("");
    setImagemUrl("");
    setCreateDiscountEnabled(false);
    setCreateDiscountType("percentage");
    setCreateDiscountValue("");
    setModalVisible(true);
  };

  const onEdit = (item: ProductItem) => {
    setEditingId(item.localId);
    setNome(item.nome);
    setTipo(item.tipo);
    setDescricao(item.descricao);
    setPreco(String(item.preco));
    setImagemUrl(item.imagemUrl ?? "");
    setCreateDiscountEnabled(false);
    setCreateDiscountType("percentage");
    setCreateDiscountValue("");
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

    const precoNumero = productFormPrice;
    let nextItems: ProductItem[] = [];
    let updatedProduct: ProductItem | null = null;
    let createdProduct: ProductItem | null = null;

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

      updatedProduct =
        nextItems.find((item) => item.localId === editingId) ?? null;
    } else {
      const createdAt = Date.now();
      const createDiscount: ProductDiscount | undefined =
        createDiscountEnabled &&
        createDiscountPreviewPrice !== null &&
        parsedCreateDiscountValue !== null
          ? {
              tipo: createDiscountType,
              valor: parsedCreateDiscountValue,
              precoOriginal: precoNumero,
              precoComDesconto: createDiscountPreviewPrice,
              criadoEm: createdAt,
            }
          : undefined;
      const newItem: ProductItem = {
        localId: `local-${Date.now()}`,
        nome: nome.trim(),
        tipo: tipo.trim(),
        descricao: descricao.trim(),
        preco: createDiscount?.precoComDesconto ?? precoNumero,
        preco_anterior: createDiscount ? precoNumero : undefined,
        desconto: createDiscount,
        data_ultima_alteracao: createdAt,
        imagemUrl: imagemUrl.trim(),
      };
      createdProduct = newItem;
      nextItems = [newItem, ...items];
    }
    try {
      setSaving(true);
      await saveProducts(toApiProducts(nextItems));
      setItems(nextItems);

      if (updatedProduct) {
        await notifyUpdatedProduct(updatedProduct);
      }

      if (createdProduct) {
        await notifyCreatedProduct(createdProduct);
      }

      await reload();
      closeModal();
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o produto na API.");
    } finally {
      setSaving(false);
    }
  };

  const onSaveDiscount = async () => {
    if (
      !isDiscountFormValid ||
      !selectedDiscountProduct ||
      discountPreviewPrice === null ||
      parsedDiscountValue === null
    ) {
      return;
    }

    const createdAt = Date.now();
    const discount: ProductDiscount = {
      tipo: discountType,
      valor: parsedDiscountValue,
      precoOriginal: discountBasePrice,
      precoComDesconto: discountPreviewPrice,
      criadoEm: createdAt,
    };
    const nextItems = items.map((item) =>
      item.localId === selectedDiscountProduct.localId
        ? {
            ...item,
            preco: discount.precoComDesconto,
            preco_anterior: discount.precoOriginal,
            desconto: discount,
            data_ultima_alteracao: createdAt,
          }
        : item,
    );
    const discountedProduct = nextItems.find(
      (item) => item.localId === selectedDiscountProduct.localId,
    );

    try {
      setDiscountSavingId(selectedDiscountProduct.localId);
      await saveProducts(toApiProducts(nextItems));
      setItems(nextItems);

      if (discountedProduct) {
        await notifySavedDiscount(discountedProduct);
      }

      await reload();
      closeDiscountMenu();
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o desconto na API.");
    } finally {
      setDiscountSavingId(null);
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
      onCreateDiscount={() => openDiscountMenu(item)}
      applyingDiscount={discountSavingId === item.localId}
    />
  );

  const listHeader = (
    <View style={styles.headerActions}>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Produtos</Text>
        <TouchableOpacity style={styles.newButton} onPress={onCreate}>
          <Text style={styles.newButtonText}>Cadastrar novo produto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersPanel}>
        <Text style={styles.filterLabel}>Nome</Text>
        <TextInput
          style={styles.input}
          value={pendingSearchTerm}
          onChangeText={setPendingSearchTerm}
          onSubmitEditing={() => setAppliedSearchTerm(pendingSearchTerm)}
          placeholder="Buscar por nome"
          placeholderTextColor="#8da2af"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        <Text style={styles.filterLabel}>Preco</Text>
        <View style={styles.priceSortRow}>
          <TouchableOpacity
            style={[
              styles.priceSortButton,
              priceSortOrder === "asc" && styles.priceSortButtonActive,
            ]}
            onPress={() => setPriceSortOrder("asc")}
          >
            <Text style={styles.priceSortText}>Menor preco</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priceSortButton,
              priceSortOrder === "desc" && styles.priceSortButtonActive,
            ]}
            onPress={() => setPriceSortOrder("desc")}
          >
            <Text style={styles.priceSortText}>Maior preco</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.filterLabel}>Categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterRow}
        >
          <TouchableOpacity
            style={[
              styles.categoryFilterButton,
              selectedCategory === null && styles.categoryFilterButtonActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.categoryFilterText}>Todos</Text>
          </TouchableOpacity>

          {categoryOptions.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilterButton,
                selectedCategory === category &&
                  styles.categoryFilterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={styles.categoryFilterText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterSummaryRow}>
          <Text style={styles.filterSummaryText}>
            {filteredItems.length} de {items.length} produtos
          </Text>

          {hasActiveFilters ? (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearProductFilters}
            >
              <Text style={styles.clearFiltersText}>Limpar filtros</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {items.length === 0
          ? "Nenhum produto encontrado"
          : "Nenhum produto corresponde aos filtros"}
      </Text>
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
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.localId}
        ListHeaderComponent={listHeader}
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
          <View
            style={[styles.modalCard, { width: Math.min(width - 32, 560) }]}
          >
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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

              {!editingId ? (
                <View style={styles.createDiscountBox}>
                  <View style={styles.switchRow}>
                    <Text style={styles.quantityLabel}>Adicionar desconto</Text>
                    <Switch
                      value={createDiscountEnabled}
                      onValueChange={setCreateDiscountEnabled}
                      disabled={saving}
                      trackColor={{ false: "#2b3a44", true: "#0a7ea4" }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  {createDiscountEnabled ? (
                    <>
                      <Text style={styles.quantityLabel}>Tipo de desconto</Text>
                      <View style={styles.discountTypeRow}>
                        <TouchableOpacity
                          style={[
                            styles.discountTypeButton,
                            createDiscountType === "percentage" &&
                              styles.discountTypeButtonActive,
                          ]}
                          onPress={() => setCreateDiscountType("percentage")}
                          disabled={saving}
                        >
                          <Text style={styles.discountTypeText}>
                            Percentual
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.discountTypeButton,
                            createDiscountType === "fixed" &&
                              styles.discountTypeButtonActive,
                          ]}
                          onPress={() => setCreateDiscountType("fixed")}
                          disabled={saving}
                        >
                          <Text style={styles.discountTypeText}>
                            Valor fixo
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TextInput
                        style={styles.input}
                        value={createDiscountValue}
                        onChangeText={(value) =>
                          setCreateDiscountValue(value.replace(/[^0-9.,]/g, ""))
                        }
                        placeholder={
                          createDiscountType === "percentage"
                            ? "Ex.: 10"
                            : "Ex.: 25,90"
                        }
                        placeholderTextColor="#8da2af"
                        keyboardType="decimal-pad"
                      />

                      {createDiscountPreviewPrice !== null ? (
                        <View style={styles.discountPreview}>
                          <Text style={styles.discountPreviewLabel}>
                            Novo preco
                          </Text>
                          <Text style={styles.discountPreviewValue}>
                            {createDiscountPreviewPrice.toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )}
                          </Text>
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </View>
              ) : null}

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
                    {saving
                      ? "Salvando..."
                      : editingId
                        ? "Salvar"
                        : "Cadastrar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
          <View
            style={[styles.quantityCard, { width: Math.min(width - 32, 420) }]}
          >
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

      <Modal
        visible={discountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDiscountMenu}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.discountCard, { width: Math.min(width - 32, 460) }]}
          >
            <Text style={styles.modalTitle}>Desconto</Text>

            <Text numberOfLines={2} style={styles.quantityProductName}>
              {selectedDiscountProduct?.nome}
            </Text>

            <View style={styles.discountBaseBox}>
              <Text style={styles.discountBaseLabel}>Preco original</Text>
              <Text style={styles.discountBaseValue}>
                {discountBasePrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </Text>
            </View>

            <Text style={styles.quantityLabel}>Tipo de desconto</Text>
            <View style={styles.discountTypeRow}>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  discountType === "percentage" &&
                    styles.discountTypeButtonActive,
                ]}
                onPress={() => setDiscountType("percentage")}
                disabled={discountSavingId !== null}
              >
                <Text style={styles.discountTypeText}>Percentual</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  discountType === "fixed" && styles.discountTypeButtonActive,
                ]}
                onPress={() => setDiscountType("fixed")}
                disabled={discountSavingId !== null}
              >
                <Text style={styles.discountTypeText}>Valor fixo</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={discountValue}
              onChangeText={(value) =>
                setDiscountValue(value.replace(/[^0-9.,]/g, ""))
              }
              placeholder={
                discountType === "percentage" ? "Ex.: 10" : "Ex.: 25,90"
              }
              placeholderTextColor="#8da2af"
              keyboardType="decimal-pad"
            />

            {discountPreviewPrice !== null ? (
              <View style={styles.discountPreview}>
                <Text style={styles.discountPreviewLabel}>Novo preco</Text>
                <Text style={styles.discountPreviewValue}>
                  {discountPreviewPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeDiscountMenu}
                disabled={discountSavingId !== null}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (!isDiscountFormValid || discountSavingId !== null) &&
                    styles.buttonDisabled,
                ]}
                onPress={() => {
                  void onSaveDiscount();
                }}
                disabled={!isDiscountFormValid || discountSavingId !== null}
              >
                <Text style={styles.modalButtonText}>
                  {discountSavingId !== null ? "Salvando..." : "Salvar"}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
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
  filtersPanel: {
    borderRadius: 10,
    backgroundColor: "#0b1820",
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 12,
    gap: 10,
  },
  filterLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  priceSortRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  priceSortButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: "#20313c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  priceSortButtonActive: {
    backgroundColor: "#0a7ea4",
  },
  priceSortText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryFilterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryFilterButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: "#20313c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  categoryFilterButtonActive: {
    backgroundColor: "#0a7ea4",
  },
  categoryFilterText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  filterSummaryRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  filterSummaryText: {
    color: "#9ba1a6",
    fontSize: 13,
    fontWeight: "600",
  },
  clearFiltersButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: "#2b3a44",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  clearFiltersText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
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
    maxHeight: "90%",
    backgroundColor: "#11202a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 16,
    gap: 10,
  },
  modalScrollContent: {
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
  discountCard: {
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
  discountBaseBox: {
    borderRadius: 10,
    backgroundColor: "#0b1820",
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 12,
    gap: 4,
  },
  discountBaseLabel: {
    color: "#9ba1a6",
    fontSize: 12,
    fontWeight: "700",
  },
  discountBaseValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  createDiscountBox: {
    borderRadius: 10,
    backgroundColor: "#0b1820",
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 12,
    gap: 10,
  },
  switchRow: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  discountTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  discountTypeButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#20313c",
    alignItems: "center",
    justifyContent: "center",
  },
  discountTypeButtonActive: {
    backgroundColor: "#0a7ea4",
  },
  discountTypeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  discountPreview: {
    borderRadius: 10,
    backgroundColor: "#10271f",
    borderWidth: 1,
    borderColor: "#1f6f55",
    padding: 12,
    gap: 4,
  },
  discountPreviewLabel: {
    color: "#7ce0b8",
    fontSize: 12,
    fontWeight: "700",
  },
  discountPreviewValue: {
    color: "#7ce0b8",
    fontSize: 20,
    fontWeight: "800",
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
