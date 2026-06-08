import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Product } from "../types/Product";

interface Props {
  produto: Product | null;
  cardWidth?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToCart?: () => void;
  onCreateDiscount?: () => void;
  addingToCart?: boolean;
  applyingDiscount?: boolean;
}

export default function ProductCard({
  produto,
  cardWidth,
  onEdit,
  onDelete,
  onAddToCart,
  onCreateDiscount,
  addingToCart = false,
  applyingDiscount = false,
}: Props) {
  if (!produto) {
    return <Text style={styles.invalidText}>Produto invalido</Text>;
  }

  const imageHeight = Math.max(160, Math.min(230, (cardWidth ?? 320) * 0.58));

  return (
    <View style={[styles.card, cardWidth ? { width: cardWidth } : undefined]}>
      <Image
        source={{ uri: produto.imagemUrl || "" }}
        style={[styles.image, { height: imageHeight }]}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.marca}>
          {produto.tipo ? produto.tipo.toUpperCase() : "SEM MARCA"}
        </Text>

        <Text style={styles.nome}>{produto.nome || "Sem nome"}</Text>

        <Text numberOfLines={2} style={styles.descricao}>
          {produto.descricao || "Sem descricao"}
        </Text>

        <Text style={styles.preco}>
          {Number(produto.preco || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </Text>

        {produto.preco_anterior && produto.preco_anterior > produto.preco ? (
          <Text style={styles.previousPrice}>
            De{" "}
            {Number(produto.preco_anterior).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
        ) : null}

        {produto.desconto ? (
          <Text style={styles.discountInfo}>
            {produto.desconto.tipo === "percentage"
              ? `${produto.desconto.valor}% de desconto`
              : `${Number(produto.desconto.valor).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })} de desconto`}
          </Text>
        ) : null}

        {onAddToCart && (
          <TouchableOpacity
            style={[styles.cartButton, addingToCart && styles.buttonDisabled]}
            onPress={onAddToCart}
            disabled={addingToCart}
          >
            <Text style={styles.cartButtonText}>
              {addingToCart ? "Adicionando..." : "Adicionar ao carrinho"}
            </Text>
          </TouchableOpacity>
        )}

        {onCreateDiscount && (
          <TouchableOpacity
            style={[
              styles.discountButton,
              applyingDiscount && styles.buttonDisabled,
            ]}
            onPress={onCreateDiscount}
            disabled={applyingDiscount}
          >
            <Text style={styles.discountButtonText}>
              {applyingDiscount ? "Salvando..." : "Desconto"}
            </Text>
          </TouchableOpacity>
        )}

        {(onEdit || onDelete) && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={onEdit}
              disabled={!onEdit}
            >
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
              disabled={!onDelete}
            >
              <Text style={styles.actionText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  invalidText: {
    color: "#ff6b6b",
    textAlign: "center",
    padding: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#11202a",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2e39",
  },
  image: {
    width: "100%",
  },
  infoContainer: {
    padding: 14,
  },
  marca: {
    fontSize: 12,
    color: "#9ba1a6",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  nome: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#ffffff",
  },
  descricao: {
    fontSize: 14,
    color: "#b7c0c8",
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 20,
  },
  preco: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0a7ea4",
  },
  previousPrice: {
    color: "#9ba1a6",
    fontSize: 13,
    marginTop: 4,
    textDecorationLine: "line-through",
  },
  discountInfo: {
    color: "#7ce0b8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  cartButton: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a7ea4",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  cartButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  discountButton: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2c5e77",
    marginTop: 8,
    paddingHorizontal: 10,
  },
  discountButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  editButton: {
    backgroundColor: "#2c5e77",
  },
  deleteButton: {
    backgroundColor: "#8a2d3b",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
