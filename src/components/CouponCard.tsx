import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Coupon } from "../types/Product";

type Props = {
  coupon: Coupon;
  disabled?: boolean;
  onEdit: (coupon: Coupon) => void;
  onRemove: (couponCode: string) => void;
};

export default function CouponCard({
  coupon,
  disabled = false,
  onEdit,
  onRemove,
}: Props) {
  const couponCode = coupon.codigo.toUpperCase();

  return (
    <View style={styles.couponItem}>
      <View style={styles.couponItemInfo}>
        <Text style={styles.couponItemCode}>{couponCode}</Text>
        <Text style={styles.couponItemDiscount}>
          {coupon.desconto}% de desconto
        </Text>
      </View>

      <View style={styles.couponActions}>
        <TouchableOpacity
          style={[styles.couponActionButton, styles.editCouponButton]}
          onPress={() => onEdit(coupon)}
          disabled={disabled}
        >
          <Text style={styles.couponActionText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.couponActionButton, styles.removeCouponButton]}
          onPress={() => onRemove(coupon.codigo)}
          disabled={disabled}
        >
          <Text style={styles.couponActionText}>Remover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
