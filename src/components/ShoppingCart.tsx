import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { CartItem, Coupon } from "../types/Product";

type Props = {
  items: CartItem[];
  loading?: boolean;
  saving?: boolean;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  appliedCoupon?: Coupon | null;
  couponError?: string;
  onApplyCoupon: (codigo: string) => void;
  onRemoveCoupon: () => void;
};

export default function ShoppingCart({
  items,
  loading = false,
  saving = false,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  appliedCoupon = null,
  couponError = "",
  onApplyCoupon,
  onRemoveCoupon,
}: Props) {
  const [couponCode, setCouponCode] = useState("");
  const totalItems = items.reduce((total, item) => total + item.quantidade, 0);
  const subtotal = items.reduce(
    (total, item) => total + Number(item.produto.preco || 0) * item.quantidade,
    0,
  );
  const discountValue = appliedCoupon
    ? subtotal * (Math.min(Math.max(appliedCoupon.desconto, 0), 100) / 100)
    : 0;
  const totalPrice = Math.max(subtotal - discountValue, 0);

  const handleApplyCoupon = () => {
    const code = couponCode.trim();

    if (code.length > 0) {
      onApplyCoupon(code);
      setCouponCode("");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Carrinho</Text>
          <Text style={styles.subtitle}>
            {loading ? "Carregando..." : `${totalItems} item(ns)`}
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClear}
            disabled={saving}
          >
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>Seu carrinho esta vazio.</Text>
      ) : (
        <View style={styles.items}>
          {items.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.itemInfo}>
                <Text numberOfLines={1} style={styles.itemName}>
                  {item.produto.nome}
                </Text>
                <Text style={styles.itemPrice}>
                  {Number(item.produto.preco || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onDecrease(item.id)}
                  disabled={saving}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.quantityText}>{item.quantidade}</Text>

                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onIncrease(item.id)}
                  disabled={saving}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(item.id)}
                disabled={saving}
              >
                <Text style={styles.removeButtonText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {items.length > 0 && (
        <View style={styles.couponBox}>
          <Text style={styles.couponTitle}>Cupom de desconto</Text>

          {appliedCoupon ? (
            <View style={styles.appliedCouponRow}>
              <View>
                <Text style={styles.appliedCouponCode}>
                  {appliedCoupon.codigo.toUpperCase()}
                </Text>
                <Text style={styles.appliedCouponDiscount}>
                  {appliedCoupon.desconto}% de desconto aplicado
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeCouponButton}
                onPress={onRemoveCoupon}
                disabled={saving}
              >
                <Text style={styles.removeCouponText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                value={couponCode}
                onChangeText={(value) =>
                  setCouponCode(value.replace(/\s/g, "").toUpperCase())
                }
                placeholder="Digite o cupom"
                placeholderTextColor="#8da2af"
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.applyCouponButton}
                onPress={handleApplyCoupon}
                disabled={saving}
              >
                <Text style={styles.applyCouponText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          )}

          {!appliedCoupon && couponError ? (
            <Text style={styles.couponError}>{couponError}</Text>
          ) : null}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.totalRows}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalText}>
              {subtotal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Text>
          </View>

          {appliedCoupon && (
            <View style={styles.totalRow}>
              <Text style={styles.discountLabel}>Desconto</Text>
              <Text style={styles.discountValue}>
                -
                {discountValue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {totalPrice.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#11202a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9ba1a6",
    fontSize: 13,
    marginTop: 2,
  },
  clearButton: {
    minHeight: 36,
    borderRadius: 9,
    backgroundColor: "#2b3a44",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyText: {
    color: "#9ba1a6",
    fontSize: 14,
  },
  items: {
    gap: 10,
  },
  cartItem: {
    backgroundColor: "#0b1820",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 10,
    gap: 10,
  },
  itemInfo: {
    gap: 4,
  },
  itemName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  itemPrice: {
    color: "#0a7ea4",
    fontSize: 14,
    fontWeight: "700",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#20313c",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  quantityText: {
    minWidth: 28,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  removeButton: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: "#8a2d3b",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  couponBox: {
    backgroundColor: "#0b1820",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2e39",
    padding: 10,
    gap: 10,
  },
  couponTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: "#11202a",
    borderWidth: 1,
    borderColor: "#1f2e39",
    color: "#ffffff",
    paddingHorizontal: 10,
  },
  applyCouponButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: "#0a7ea4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  applyCouponText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  appliedCouponRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  appliedCouponCode: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  appliedCouponDiscount: {
    color: "#9ba1a6",
    fontSize: 13,
    marginTop: 2,
  },
  couponError: {
    color: "#ff6b6b",
    fontSize: 12,
    lineHeight: 16,
  },
  removeCouponButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: "#2b3a44",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  removeCouponText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#1f2e39",
    paddingTop: 12,
  },
  totalRows: {
    gap: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  totalLabel: {
    color: "#b7c0c8",
    fontSize: 15,
    fontWeight: "600",
  },
  totalText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  discountLabel: {
    color: "#78d39a",
    fontSize: 15,
    fontWeight: "600",
  },
  discountValue: {
    color: "#78d39a",
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
});
