import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Pencil, Plus, Trash2, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Field, uiStyles } from "@/components/ui";
import { colors, radii, spacing } from "@/theme/tokens";

export type EntityField = {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean";
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

type Entity = Record<string, unknown> & { id?: string };

type EntityManagerProps<T extends Entity> = {
  records: T[];
  fields: EntityField[];
  emptyText?: string;
  createLabel: string;
  getTitle: (record: T) => string;
  getSubtitle?: (record: T) => string;
  onChange: (records: T[]) => Promise<void>;
  createDefaults?: Partial<T>;
};

export function EntityManager<T extends Entity>({
  records,
  fields,
  emptyText = "Henüz kayıt bulunmuyor.",
  createLabel,
  getTitle,
  getSubtitle,
  onChange,
  createDefaults,
}: EntityManagerProps<T>) {
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const modalVisible = creating || editing !== null;

  const initialDraft = useMemo(() => {
    const values: Record<string, unknown> = {};
    for (const field of fields) values[field.key] = field.defaultValue ?? (field.type === "boolean" ? false : "");
    return { ...createDefaults, ...values };
  }, [createDefaults, fields]);

  function openCreate() {
    setDraft(initialDraft);
    setEditing(null);
    setCreating(true);
  }

  function openEdit(record: T) {
    setDraft({ ...record });
    setEditing(record);
    setCreating(false);
  }

  function close() {
    if (saving) return;
    setCreating(false);
    setEditing(null);
    setDraft({});
  }

  async function submit() {
    const missing = fields.find((field) => field.required && !String(draft[field.key] ?? "").trim());
    if (missing) {
      Alert.alert("Eksik bilgi", `${missing.label} alanını doldurun.`);
      return;
    }

    const normalized = { ...(editing || {}), ...draft } as T;
    for (const field of fields) {
      if (field.type === "number") normalized[field.key as keyof T] = Number(draft[field.key] || 0) as T[keyof T];
      if (field.type === "boolean") normalized[field.key as keyof T] = Boolean(draft[field.key]) as T[keyof T];
    }
    if (!normalized.id) normalized.id = createId();

    const next = editing
      ? records.map((record) => record.id === editing.id ? normalized : record)
      : [normalized, ...records];
    setSaving(true);
    try {
      await onChange(next);
      closeAfterSave();
    } catch (caught) {
      Alert.alert("Kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSaving(false);
    }
  }

  function closeAfterSave() {
    setCreating(false);
    setEditing(null);
    setDraft({});
  }

  function remove(record: T) {
    Alert.alert("Kayıt silinsin mi?", getTitle(record), [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => void onChange(records.filter((item) => item.id !== record.id)).catch((caught: unknown) => {
          Alert.alert("Silinemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
        }),
      },
    ]);
  }

  return (
    <>
      <Button icon={Plus} onPress={openCreate}>{createLabel}</Button>
      {!records.length ? <Card><Text style={uiStyles.body}>{emptyText}</Text></Card> : null}
      {records.map((record, index) => (
        <Card key={record.id || String(index)}>
          <View style={uiStyles.between}>
            <View style={styles.grow}>
              <Text style={styles.title}>{getTitle(record)}</Text>
              {getSubtitle ? <Text style={uiStyles.body}>{getSubtitle(record)}</Text> : null}
            </View>
            <View style={styles.actions}>
              <IconButton label="Düzenle" onPress={() => openEdit(record)}><Pencil color={colors.primary} size={17} /></IconButton>
              <IconButton label="Sil" onPress={() => remove(record)}><Trash2 color={colors.danger} size={17} /></IconButton>
            </View>
          </View>
        </Card>
      ))}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <SafeAreaView style={styles.modal} edges={["top", "bottom", "left", "right"]}>
          <KeyboardAvoidingView style={styles.grow} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? "Kaydı düzenle" : createLabel}</Text>
              <IconButton label="Kapat" onPress={close}><X color={colors.text} size={22} /></IconButton>
            </View>
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
              {fields.map((field) => field.type === "boolean" ? (
                <View key={field.key} style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{field.label}</Text>
                  <Switch
                    value={Boolean(draft[field.key])}
                    onValueChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ) : (
                <Field
                  key={field.key}
                  label={field.label}
                  value={String(draft[field.key] ?? "")}
                  onChangeText={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                  placeholder={field.placeholder}
                  multiline={field.multiline}
                  keyboardType={field.type === "number" ? "decimal-pad" : "default"}
                  autoCapitalize={field.key.toLocaleLowerCase("tr-TR").includes("email") ? "none" : "sentences"}
                />
              ))}
              <Button loading={saving} onPress={() => void submit()}>Kaydet</Button>
              <Button variant="secondary" disabled={saving} onPress={close}>Vazgeç</Button>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function IconButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>{children}</Pressable>;
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" },
  actions: { flexDirection: "row", gap: spacing.sm },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  pressed: { opacity: 0.65 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  form: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  toggleRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
  toggleLabel: { color: colors.text, fontSize: 14, fontWeight: "700", flex: 1 },
});
