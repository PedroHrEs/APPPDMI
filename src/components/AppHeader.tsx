import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import ShoppingCart from "./ShoppingCart";
import { auth } from "../services/connectionFirebase";
import { getCart, getCoupons, saveCart, saveCoupons } from "../services/api";
import { CartItem, Coupon } from "../types/Product";

export default function AppHeader() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSaving, setCartSaving] = useState(false);
  const [couponVisible, setCouponVisible] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [couponSaving, setCouponSaving] = useState(false);
  const [editingCouponCode, setEditingCouponCode] = useState<string | null>(null);
  const [couponFormError, setCouponFormError] = useState("");
  const [couponApplyError, setCouponApplyError] = useState("");

  const totalCartItems = cartItems.reduce(
    (total, item) => total + item.quantidade,
    0,
  );

  const loadCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const cart = await getCart();
      setCartItems(cart);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar o carrinho.");
    } finally {
      setCartLoading(false);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    try {
      const loadedCoupons = await getCoupons();
      setCoupons(loadedCoupons);
    } catch {
      Alert.alert("Erro", "Nao foi possivel carregar os cupons.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    void loadCart();
    void loadCoupons();
  }, [loadCart, loadCoupons]);

  const openCart = () => {
    setShowMenu(false);
    setCartVisible(true);
    void loadCart();
  };

  const persistCart = async (nextCart: CartItem[]) => {
    setCartItems(nextCart);
    if (nextCart.length === 0) {
      setAppliedCoupon(null);
    }
    setCartSaving(true);

    try {
      await saveCart(nextCart);
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar o carrinho.");
      await loadCart();
    } finally {
      setCartSaving(false);
    }
  };

  const openCouponMenu = () => {
    setShowMenu(false);
    setCouponVisible(true);
    void loadCoupons();
  };

  const closeCouponMenu = () => {
    setCouponVisible(false);
    setCouponCode("");
    setCouponDiscount("");
    setEditingCouponCode(null);
    setCouponFormError("");
  };

  const resetCouponForm = () => {
    setCouponCode("");
    setCouponDiscount("");
    setEditingCouponCode(null);
    setCouponFormError("");
  };

  const handleSaveCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    const discount = Number(couponDiscount.replace(",", "."));

    if (code.length < 2 || Number.isNaN(discount) || discount <= 0) {
      setCouponFormError("Informe um codigo sem espacos e um desconto valido.");
      return;
    }

    setCouponFormError("");

    const normalizedDiscount = Math.min(discount, 100);
    const nextCoupons = [
      ...coupons.filter(
        (coupon) =>
          coupon.codigo.toUpperCase() !== code &&
          coupon.codigo.toUpperCase() !== editingCouponCode,
      ),
      {
        codigo: code,
        desconto: normalizedDiscount,
      },
    ];

    try {
      setCouponSaving(true);
      await saveCoupons(nextCoupons);
      setCoupons(nextCoupons);
      if (
        appliedCoupon &&
        (appliedCoupon.codigo.toUpperCase() === editingCouponCode ||
          appliedCoupon.codigo.toUpperCase() === code)
      ) {
        setAppliedCoupon({
          codigo: code,
          desconto: normalizedDiscount,
        });
      }
      resetCouponForm();
      Alert.alert("Cupom", editingCouponCode ? "Cupom alterado com sucesso." : "Cupom salvo com sucesso.");
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o cupom.");
    } finally {
      setCouponSaving(false);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    const normalizedCode = code.trim().replace(/\s/g, "").toUpperCase();

    if (normalizedCode.length < 2) {
      setCouponApplyError("Informe um cupom valido, sem espacos.");
      return;
    }

    let currentCoupons = coupons;

    try {
      currentCoupons = await getCoupons();
      setCoupons(currentCoupons);
    } catch {
      setCouponApplyError("Nao foi possivel validar o cupom.");
      return;
    }

    const coupon = currentCoupons.find(
      (item) => item.codigo.toUpperCase() === normalizedCode,
    );

    if (!coupon) {
      setCouponApplyError("Cupom nao encontrado.");
      return;
    }

    setCouponApplyError("");
    setAppliedCoupon(coupon);
    Alert.alert("Cupom", "Cupom aplicado ao carrinho.");
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCouponCode(coupon.codigo.toUpperCase());
    setCouponCode(coupon.codigo.toUpperCase());
    setCouponDiscount(String(coupon.desconto));
  };

  const handleRemoveCoupon = (couponCodeToRemove: string) => {
    const normalizedCode = couponCodeToRemove.toUpperCase();

    confirmAction(
      "Remover cupom",
      `Deseja remover o cupom ${normalizedCode}?`,
      async () => {
        const nextCoupons = coupons.filter(
          (coupon) => coupon.codigo.toUpperCase() !== normalizedCode,
        );

        try {
          setCouponSaving(true);
          const savedCoupons = await saveCoupons(nextCoupons);
          setCoupons(savedCoupons);

          if (appliedCoupon?.codigo.toUpperCase() === normalizedCode) {
            setAppliedCoupon(null);
          }

          if (editingCouponCode === normalizedCode) {
            resetCouponForm();
          }

          Alert.alert("Cupom", "Cupom removido com sucesso.");
        } catch {
          Alert.alert("Erro", "Nao foi possivel remover o cupom.");
        } finally {
          setCouponSaving(false);
        }
      },
    );
  };

  const confirmAction = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) {
        onConfirm();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  };

  const handleIncreaseCartItem = async (id: string) => {
    const nextCart = cartItems.map((item) =>
      item.id === id ? { ...item, quantidade: item.quantidade + 1 } : item,
    );

    await persistCart(nextCart);
  };

  const handleDecreaseCartItem = async (id: string) => {
    const nextCart = cartItems
      .map((item) =>
        item.id === id
          ? { ...item, quantidade: Math.max(item.quantidade - 1, 0) }
          : item,
      )
      .filter((item) => item.quantidade > 0);

    await persistCart(nextCart);
  };

  const handleRemoveCartItem = async (id: string) => {
    const item = cartItems.find((cartItem) => cartItem.id === id);
    const productName = item?.produto.nome ?? "este produto";

    confirmAction(
      "Remover produto",
      `Deseja remover ${productName} do carrinho?`,
      () => {
        void persistCart(cartItems.filter((cartItem) => cartItem.id !== id));
      },
    );
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) {
      return;
    }

    confirmAction(
      "Limpar carrinho",
      "Deseja remover todos os itens do carrinho?",
      () => {
        void persistCart([]);
      },
    );
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowMenu(false);
    Alert.alert("Logout", "Voce foi desconectado.");
  };

  const handleProfileNavigation = () => {
    setShowMenu(false);
    router.push("/(tabs)/user");
  };

  const handleProductRegisterNavigation = () => {
    setShowMenu(false);

    if (!isLoggedIn) {
      Alert.alert(
        "Login necessario",
        "Entre na sua conta para cadastrar produtos."
      );
      router.push("/(tabs)/user");
      return;
    }

    router.push("/products");
  };

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Text style={styles.headerTitle}>Tech Store</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={openCart}>
            <Ionicons name="cart-outline" size={24} color="#FFF" />
            {totalCartItems > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {totalCartItems > 99 ? "99+" : totalCartItems}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowMenu((current) => !current)}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showMenu ? (
        <View style={styles.menu}>
          {isLoggedIn ? (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProfileNavigation}
              >
                <Text style={styles.menuText}>Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProductRegisterNavigation}
              >
                <Text style={styles.menuText}>Novo produto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={openCouponMenu}
              >
                <Text style={styles.menuText}>Cupons</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push("/(tabs)/user");
                }}
              >
                <Text style={styles.menuText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push("/register");
                }}
              >
                <Text style={styles.menuText}>Cadastro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}

      <Modal
        visible={cartVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCartVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.cartModal, { width: Math.min(width - 32, 560) }]}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>Meu carrinho</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCartVisible(false)}
              >
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ShoppingCart
                items={cartItems}
                loading={cartLoading}
                saving={cartSaving}
                onIncrease={(id) => {
                  void handleIncreaseCartItem(id);
                }}
                onDecrease={(id) => {
                  void handleDecreaseCartItem(id);
                }}
                onRemove={(id) => {
                  void handleRemoveCartItem(id);
                }}
                onClear={() => {
                  void handleClearCart();
                }}
                appliedCoupon={appliedCoupon}
                couponError={couponApplyError}
                onApplyCoupon={(code) => {
                  void handleApplyCoupon(code);
                }}
                onRemoveCoupon={() => {
                  setAppliedCoupon(null);
                  setCouponApplyError("");
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={couponVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCouponMenu}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.couponModal, { width: Math.min(width - 32, 520) }]}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>Cupons</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeCouponMenu}>
                <Ionicons name="close" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.couponForm}>
              <TextInput
                style={styles.input}
                value={couponCode}
                onChangeText={(value) => {
                  setCouponCode(value.replace(/\s/g, "").toUpperCase());
                  setCouponFormError("");
                }}
                placeholder="Codigo do cupom"
                placeholderTextColor="#8da2af"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {couponFormError ? (
                <Text style={styles.inputError}>{couponFormError}</Text>
              ) : null}
              <TextInput
                style={styles.input}
                value={couponDiscount}
                onChangeText={(value) => {
                  setCouponDiscount(value.replace(/[^0-9.,]/g, ""));
                  setCouponFormError("");
                }}
                placeholder="Desconto em %"
                placeholderTextColor="#8da2af"
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[
                  styles.saveCouponButton,
                  couponSaving && styles.buttonDisabled,
                ]}
                onPress={() => {
                  void handleSaveCoupon();
                }}
                disabled={couponSaving}
              >
                <Text style={styles.saveCouponText}>
                  {couponSaving
                    ? "Salvando..."
                    : editingCouponCode
                      ? "Alterar cupom"
                      : "Salvar cupom"}
                </Text>
              </TouchableOpacity>

              {editingCouponCode && (
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={resetCouponForm}
                  disabled={couponSaving}
                >
                  <Text style={styles.cancelEditText}>Cancelar edicao</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              style={styles.couponScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.couponList}>
                {coupons.length === 0 ? (
                  <Text style={styles.emptyCouponText}>Nenhum cupom criado.</Text>
                ) : (
                  coupons.map((coupon) => (
                    <View key={coupon.codigo} style={styles.couponItem}>
                      <View style={styles.couponItemInfo}>
                        <Text style={styles.couponItemCode}>
                          {coupon.codigo.toUpperCase()}
                        </Text>
                        <Text style={styles.couponItemDiscount}>
                          {coupon.desconto}% de desconto
                        </Text>
                      </View>

                      <View style={styles.couponActions}>
                        <TouchableOpacity
                          style={[styles.couponActionButton, styles.editCouponButton]}
                          onPress={() => handleEditCoupon(coupon)}
                          disabled={couponSaving}
                        >
                          <Text style={styles.couponActionText}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.couponActionButton,
                            styles.removeCouponButton,
                          ]}
                          onPress={() => handleRemoveCoupon(coupon.codigo)}
                          disabled={couponSaving}
                        >
                          <Text style={styles.couponActionText}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 80,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 10,
  },
  cartBadge: {
    position: "absolute",
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  menu: {
    position: "absolute",
    top: 70,
    right: 20,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 10,
    zIndex: 10,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuText: {
    color: "#FFF",
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cartModal: {
    maxHeight: "85%",
    backgroundColor: "#030d13",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 14,
  },
  cartModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cartModalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
  },
  couponModal: {
    maxHeight: "85%",
    backgroundColor: "#030d13",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 14,
    gap: 14,
  },
  couponForm: {
    gap: 10,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0b1820",
    borderWidth: 1,
    borderColor: "#1f2e39",
    color: "#ffffff",
  },
  inputError: {
    color: "#ff6b6b",
    fontSize: 12,
    lineHeight: 16,
    marginTop: -4,
  },
  saveCouponButton: {
    minHeight: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveCouponText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelEditButton: {
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2b3a44",
  },
  cancelEditText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  couponScroll: {
    maxHeight: 260,
  },
  couponList: {
    gap: 8,
  },
  emptyCouponText: {
    color: "#9ba1a6",
    fontSize: 14,
  },
  couponItem: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#11202a",
    borderWidth: 1,
    borderColor: "#1f2e39",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  couponItemInfo: {
    gap: 2,
  },
  couponItemCode: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  couponItemDiscount: {
    color: "#9ba1a6",
    fontSize: 13,
    marginTop: 2,
  },
  couponActions: {
    flexDirection: "row",
    gap: 8,
  },
  couponActionButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editCouponButton: {
    backgroundColor: "#2c5e77",
  },
  removeCouponButton: {
    backgroundColor: "#8a2d3b",
  },
  couponActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
