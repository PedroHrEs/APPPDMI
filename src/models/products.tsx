import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { productService } from "../services/products_service";

export type ProductPayload = {
  nome: string;
  tipo: string;
  descricao: string;
  preco: number;
  imagemUrl?: string;
};

export type Product = ProductPayload & {
  id?: string;
};

function FieldRule({ valid, text }: { valid: boolean; text: string }) {
  return (
    <Text style={[styles.fieldRuleText, valid && styles.fieldRuleValid]}>
      - {text}
    </Text>
  );
}

function formatPrice(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function isValidUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    const protocoloValido = url.protocol === "http:" || url.protocol === "https:";
    const caminho = url.pathname.toLowerCase();
    const extensaoValida =
      caminho.endsWith(".jpg") ||
      caminho.endsWith(".jpeg") ||
      caminho.endsWith(".png") ||
      caminho.endsWith(".webp") ||
      caminho.endsWith(".gif");

    return protocoloValido && extensaoValida;
  } catch {
    return false;
  }
}

export default function Products() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 760);

  const [produtos, setProdutos] = useState<Product[]>([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [nomeError, setNomeError] = useState("");
  const [tipoError, setTipoError] = useState("");
  const [descricaoError, setDescricaoError] = useState("");
  const [precoError, setPrecoError] = useState("");
  const [imagemUrlError, setImagemUrlError] = useState("");

  const nomeValido = nome.trim().length >= 3;
  const tipoValido = tipo.trim().length >= 2;
  const descricaoValida = descricao.trim().length >= 10;
  const precoNumero = Number(preco.replace(",", "."));
  const precoValido = preco.trim().length > 0 && !Number.isNaN(precoNumero) && precoNumero > 0;
  const imagemUrlValida = isValidUrl(imagemUrl);
  const formValido =
    nomeValido &&
    tipoValido &&
    descricaoValida &&
    precoValido &&
    imagemUrlValida;

  const limparErros = useCallback(() => {
    setNomeError("");
    setTipoError("");
    setDescricaoError("");
    setPrecoError("");
    setImagemUrlError("");
  }, []);

  const limparCampos = useCallback(() => {
    setNome("");
    setTipo("");
    setDescricao("");
    setPreco("");
    setImagemUrl("");
    setEditandoId(null);
    limparErros();

    if (Platform.OS !== "web") {
      Keyboard.dismiss();
    }
  }, [limparErros]);

  const avisar = useCallback((titulo: string, mensagem: string) => {
    if (Platform.OS === "web") {
      globalThis.alert?.(`${titulo}: ${mensagem}`);
      return;
    }

    Alert.alert(titulo, mensagem);
  }, []);

  const carregarProdutos = useCallback(async () => {
    try {
      setCarregando(true);
      const lista = await productService.listar();
      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      avisar("Erro", "Nao foi possivel carregar os produtos.");
    } finally {
      setCarregando(false);
    }
  }, [avisar]);

  useFocusEffect(
    useCallback(() => {
      limparCampos();
      carregarProdutos();
    }, [carregarProdutos, limparCampos])
  );

  const validarCampos = () => {
    let hasError = false;

    limparErros();

    if (!nomeValido) {
      setNomeError("Digite um nome com pelo menos 3 caracteres.");
      hasError = true;
    }

    if (!tipoValido) {
      setTipoError("Digite um tipo com pelo menos 2 caracteres.");
      hasError = true;
    }

    if (!descricaoValida) {
      setDescricaoError("Digite uma descricao com pelo menos 10 caracteres.");
      hasError = true;
    }

    if (!precoValido) {
      setPrecoError("Informe um preco valido maior que zero.");
      hasError = true;
    }

    if (!imagemUrlValida) {
      setImagemUrlError(
        "Informe uma URL de imagem valida com http:// ou https:// (.jpg, .jpeg, .png, .webp)."
      );
      hasError = true;
    }

    if (hasError) {
      avisar("Atencao", "Revise os campos destacados antes de salvar.");
    }

    return !hasError;
  };

  const handleSalvar = async () => {
    if (!validarCampos()) {
      return;
    }

    const dados: ProductPayload = {
      nome: nome.trim(),
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      preco: Number(preco.replace(",", ".")),
      imagemUrl: imagemUrl.trim() || undefined,
    };

    try {
      setSalvando(true);

      if (editandoId) {
        await productService.alterar(editandoId, dados);
        avisar("Sucesso", "Produto atualizado com sucesso.");
      } else {
        await productService.inserir(dados);
        avisar("Sucesso", "Produto cadastrado com sucesso.");
      }

      limparCampos();
      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      avisar("Erro", "Nao foi possivel salvar o produto.");
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (produto: Product) => {
    setNome(produto.nome);
    setTipo(produto.tipo);
    setDescricao(produto.descricao);
    setPreco(formatPrice(produto.preco));
    setImagemUrl(produto.imagemUrl ?? "");
    setEditandoId(produto.id ?? null);
  };

  const executarExclusao = async (id: string) => {
    try {
      await productService.excluir(id);
      avisar("Sucesso", "Produto removido com sucesso.");

      if (editandoId === id) {
        limparCampos();
      }

      await carregarProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      avisar("Erro", "Nao foi possivel excluir o produto.");
    }
  };

  const handleExcluir = (id?: string) => {
    if (!id) {
      return;
    }

    const mensagem = "Deseja realmente excluir este produto?";

    if (Platform.OS === "web") {
      if (globalThis.confirm?.(mensagem)) {
        void executarExclusao(id);
      }
      return;
    }

    Alert.alert("Excluir produto", mensagem, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void executarExclusao(id);
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <AppHeader />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { width: "100%", maxWidth: contentWidth }]}>
            <Text style={styles.title}>
              {editandoId ? "Editar produto" : "Cadastro de produto"}
            </Text>

            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder="Nome do produto"
                placeholderTextColor="#888"
                value={nome}
                onChangeText={setNome}
              />
              {nome.length > 0 ? (
                <FieldRule valid={nomeValido} text="Digite pelo menos 3 caracteres" />
              ) : null}
              {nomeError ? <Text style={styles.errorText}>{nomeError}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Tipo"
                placeholderTextColor="#888"
                value={tipo}
                onChangeText={setTipo}
              />
              {tipo.length > 0 ? (
                <FieldRule valid={tipoValido} text="Digite pelo menos 2 caracteres" />
              ) : null}
              {tipoError ? <Text style={styles.errorText}>{tipoError}</Text> : null}

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descricao"
                placeholderTextColor="#888"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                textAlignVertical="top"
              />
              {descricao.length > 0 ? (
                <FieldRule valid={descricaoValida} text="Digite pelo menos 10 caracteres" />
              ) : null}
              {descricaoError ? <Text style={styles.errorText}>{descricaoError}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="Preco"
                placeholderTextColor="#888"
                value={preco}
                onChangeText={setPreco}
                keyboardType="decimal-pad"
              />
              {preco.length > 0 ? (
                <FieldRule valid={precoValido} text="Informe um valor maior que zero" />
              ) : null}
              {precoError ? <Text style={styles.errorText}>{precoError}</Text> : null}

              <TextInput
                style={styles.input}
                placeholder="URL da imagem"
                placeholderTextColor="#888"
                value={imagemUrl}
                onChangeText={setImagemUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {imagemUrl.length > 0 ? (
                <FieldRule
                  valid={imagemUrlValida}
                  text="Use uma URL de imagem com http:// ou https:// (.jpg, .jpeg, .png, .webp ou .gif)"
                />
              ) : null}
              {imagemUrlError ? <Text style={styles.errorText}>{imagemUrlError}</Text> : null}

              {imagemUrl.trim() ? (
                isValidUrl(imagemUrl) ? (
                  <Image source={{ uri: imagemUrl.trim() }} style={styles.previewImage} />
                ) : null
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!formValido || salvando) && styles.buttonDisabled,
                ]}
                onPress={handleSalvar}
                disabled={!formValido || salvando}
              >
                <Text style={styles.primaryButtonText}>
                  {salvando
                    ? "Salvando..."
                    : editandoId
                      ? "Atualizar produto"
                      : "Cadastrar produto"}
                </Text>
              </TouchableOpacity>

              {editandoId ? (
                <TouchableOpacity style={styles.secondaryButton} onPress={limparCampos}>
                  <Text style={styles.secondaryButtonText}>Cancelar edicao</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Produtos</Text>

            {carregando ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            ) : produtos.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Nenhum produto cadastrado ate o momento.</Text>
              </View>
            ) : (
              produtos.map((produto) => (
                <View key={produto.id} style={styles.productCard}>
                  {produto.imagemUrl ? (
                    <Image source={{ uri: produto.imagemUrl }} style={styles.productImage} />
                  ) : null}
                  <Text style={styles.productName}>{produto.nome}</Text>
                  <Text style={styles.productMeta}>Tipo: {produto.tipo}</Text>
                  <Text style={styles.productDescription}>{produto.descricao}</Text>
                  <Text style={styles.productPrice}>R$ {formatPrice(produto.preco)}</Text>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditar(produto)}
                    >
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleExcluir(produto.id)}
                    >
                      <Text style={styles.actionText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "#030d13",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  content: {
    gap: 16,
  },
  title: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#111c24",
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  input: {
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 110,
  },
  fieldRuleText: {
    color: "#888",
    fontSize: 13,
    marginTop: -6,
    marginLeft: 5,
  },
  fieldRuleValid: {
    color: "#06D6A0",
  },
  previewImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    backgroundColor: "#1E1E1E",
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  primaryButtonText: {
    color: "#111",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5f7381",
  },
  secondaryButtonText: {
    color: "#D7E1E8",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "600",
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#111c24",
  },
  emptyText: {
    color: "#D7E1E8",
    textAlign: "center",
    fontSize: 15,
  },
  errorText: {
    color: "#FF7A7A",
    fontSize: 14,
    marginTop: -6,
    marginLeft: 5,
    width: "100%",
  },
  productCard: {
    backgroundColor: "#111c24",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  productImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    backgroundColor: "#1E1E1E",
    marginBottom: 4,
  },
  productName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
  productMeta: {
    color: "#B7C8D3",
    fontSize: 14,
  },
  productDescription: {
    color: "#D7E1E8",
    fontSize: 15,
    lineHeight: 22,
  },
  productPrice: {
    color: "#7CE0B8",
    fontSize: 18,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2C5E77",
  },
  deleteButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8A2D3B",
  },
  actionText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
