import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/theme/tokens";

export type SelectOption = { value: string; label: string; subtitle?: string };

type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SelectField({ label, value, options, onChange, placeholder = "Seçin", disabled = false }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    return needle ? options.filter((option) => `${option.label} ${option.subtitle || ""}`.toLocaleLowerCase("tr-TR").includes(needle)) : options;
  }, [options, query]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={disabled}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.control, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={[styles.controlText, !selected && styles.placeholder]} numberOfLines={1}>{selected?.label || placeholder}</Text>
          <ChevronDown color={colors.textMuted} size={18} />
        </Pressable>
      </View>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal} edges={["top", "bottom", "left", "right"]}>
          <View style={styles.header}>
            <Text style={styles.title}>{label}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={() => setOpen(false)} style={styles.close}><X color={colors.text} size={22} /></Pressable>
          </View>
          <View style={styles.search}>
            <Search color={colors.textMuted} size={18} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Ara" placeholderTextColor={colors.textMuted} style={styles.searchInput} autoFocus />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Eşleşen seçenek bulunamadı.</Text>}
            renderItem={({ item }) => (
              <Pressable accessibilityRole="button" onPress={() => choose(item.value)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {item.subtitle ? <Text style={styles.optionSubtitle}>{item.subtitle}</Text> : null}
                </View>
                {item.value === value ? <Check color={colors.primary} size={20} /> : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

export function MultiSelectField({ label, values, options, onChange, placeholder = "Seçin" }: { label: string; values: string[]; options: SelectOption[]; onChange: (values: string[]) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const selectedLabels = options.filter((option) => values.includes(option.value)).map((option) => option.label);
  function toggle(value: string) { onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]); }
  return (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setOpen(true)} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
          <Text style={[styles.controlText, !selectedLabels.length && styles.placeholder]} numberOfLines={2}>{selectedLabels.length ? selectedLabels.join(", ") : placeholder}</Text>
          <ChevronDown color={colors.textMuted} size={18} />
        </Pressable>
      </View>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal} edges={["top", "bottom", "left", "right"]}>
          <View style={styles.header}><Text style={styles.title}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel="Bitti" onPress={() => setOpen(false)} style={styles.done}><Text style={styles.doneText}>Bitti</Text></Pressable></View>
          <FlatList data={options} keyExtractor={(item) => item.value} contentContainerStyle={styles.list} renderItem={({ item }) => (
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: values.includes(item.value) }} onPress={() => toggle(item.value)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
              <View style={styles.optionCopy}><Text style={styles.optionLabel}>{item.label}</Text>{item.subtitle ? <Text style={styles.optionSubtitle}>{item.subtitle}</Text> : null}</View>
              {values.includes(item.value) ? <Check color={colors.primary} size={20} /> : null}
            </Pressable>
          )} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 13, fontWeight: "700" },
  control: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.md, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  controlText: { flex: 1, color: colors.text, fontSize: 15 },
  placeholder: { color: colors.textMuted },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
  modal: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { color: colors.text, fontSize: 20, fontWeight: "900" },
  close: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  done: { minHeight: 40, justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md },
  doneText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  search: { margin: spacing.lg, minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  option: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionCopy: { flex: 1, gap: 2 },
  optionLabel: { color: colors.text, fontSize: 15, fontWeight: "800" },
  optionSubtitle: { color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: "center", padding: spacing.xl },
});
