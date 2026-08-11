import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Tag,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { type Href, useRouter } from "expo-router";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  dashboardFeatureGroups,
  encodeFeatureId,
  type DashboardFeatureId,
} from "@/domain/dashboardNavigation";
import { useAuth } from "@/providers/AuthProvider";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, spacing } from "@/theme/tokens";

type ChromeContextValue = {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  quickCreateOpen: boolean;
  openQuickCreate: () => void;
  closeQuickCreate: () => void;
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

const ChromeContext = createContext<ChromeContextValue | null>(null);

export function DashboardChromeProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { business } = useBusiness();
  const { width } = useWindowDimensions();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const goTo = useCallback((id: DashboardFeatureId, create = false) => {
    setDrawerOpen(false);
    setQuickCreateOpen(false);
    setProfileOpen(false);
    if (id === "dashboard") {
      router.replace("/(app)" as Href);
    } else if (id === "booking/list") {
      router.push((create ? `/feature/${encodeFeatureId("visit/list")}?create=1` : "/(app)/appointments") as Href);
    } else if (id === "client/list") {
      router.push((create ? "/(app)/customers?create=1" : "/(app)/customers") as Href);
    } else if (id === "setup/general") {
      router.push("/(app)/business/profile" as Href);
    } else if (id === "setup/working-hours") {
      router.push("/(app)/business/hours" as Href);
    } else {
      router.push(`/feature/${encodeFeatureId(id)}${create ? "?create=1" : ""}` as Href);
    }
  }, [router]);

  const contextValue = useMemo<ChromeContextValue>(() => ({
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    quickCreateOpen,
    openQuickCreate: () => setQuickCreateOpen(true),
    closeQuickCreate: () => setQuickCreateOpen(false),
    profileOpen,
    openProfile: () => setProfileOpen(true),
    closeProfile: () => setProfileOpen(false),
    searchTerm,
    setSearchTerm,
  }), [drawerOpen, profileOpen, quickCreateOpen, searchTerm]);

  const canManageSetup = business?.currentMembershipRole === "owner" || user?.role === "admin";

  return (
    <ChromeContext.Provider value={contextValue}>
      <View style={styles.root}>
        <DashboardTopbar />
        <View style={styles.content}>{children}</View>
      </View>
      <Modal visible={drawerOpen} animationType="slide" transparent onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Menüyü kapat" style={styles.scrim} onPress={() => setDrawerOpen(false)} />
          <SafeAreaView style={styles.drawer} edges={["top", "bottom"]}>
            <View style={styles.drawerHeader}>
              <Pressable style={styles.brandButton} onPress={() => goTo("dashboard")}>
                <Image source={require("../../assets/logo.jpg")} style={styles.brandImage} accessibilityLabel="Aloyz" />
                <Text style={styles.brandText}>Aloyz</Text>
              </Pressable>
              <Pressable accessibilityLabel="Menüyü kapat" style={styles.closeButton} onPress={() => setDrawerOpen(false)}>
                <X size={20} color={colors.white} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.drawerContent}>
              {primaryItems.map((item) => <DrawerItem key={item.id} icon={item.icon} label={item.label} onPress={() => goTo(item.id)} />)}
              {dashboardFeatureGroups.map((group) => {
                if (group.label === "Operasyon" || (group.label === "Kurulum" && !canManageSetup)) return null;
                const expanded = openGroups[group.label] ?? false;
                return (
                  <View key={group.label} style={styles.drawerGroup}>
                    <Pressable style={styles.groupButton} onPress={() => setOpenGroups((current) => ({ ...current, [group.label]: !expanded }))}>
                      <Text style={styles.groupLabel}>{group.label}</Text>
                      <ChevronDown size={17} color="#CBD5E1" style={expanded ? styles.rotated : undefined} />
                    </Pressable>
                    {expanded ? group.label === "Mesajlaşma" ? (
                      <MessagingDrawerItems items={group.items} openGroups={openGroups} onToggle={(key) => setOpenGroups((current) => ({ ...current, [key]: !current[key] }))} onSelect={goTo} />
                    ) : group.items.map((item) => (
                      <DrawerItem key={item.id} compact icon={iconFor(item.id)} label={item.label} onPress={() => goTo(item.id)} />
                    )) : null}
                  </View>
                );
              })}
              <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
                <LogOut size={17} color="#FCA5A5" />
                <Text style={styles.signOutText}>Çıkış yap</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
      <Modal visible={quickCreateOpen} animationType="fade" transparent onRequestClose={() => setQuickCreateOpen(false)}>
        <View style={styles.createModalRoot}>
          <Pressable style={styles.scrim} onPress={() => setQuickCreateOpen(false)} />
          <SafeAreaView style={[styles.createPanel, width < 420 && styles.createPanelCompact]} edges={["bottom"]}>
            <View style={styles.createHeader}>
              <Text style={styles.createTitle}>Yeni oluştur</Text>
              <Pressable accessibilityLabel="Yeni oluştur menüsünü kapat" onPress={() => setQuickCreateOpen(false)}><X size={20} color={colors.text} /></Pressable>
            </View>
            {quickCreateItems.map((item) => (
              <Pressable key={item.id} style={({ pressed }) => [styles.createItem, pressed && styles.createItemPressed]} onPress={() => goTo(item.id, true)}>
                <item.icon size={18} color={colors.textMuted} />
                <Text style={styles.createLabel}>{item.label}</Text>
                <ChevronRight size={17} color={colors.textMuted} />
              </Pressable>
            ))}
          </SafeAreaView>
        </View>
      </Modal>
      <Modal visible={profileOpen} animationType="fade" transparent onRequestClose={() => setProfileOpen(false)}>
        <View style={styles.createModalRoot}>
          <Pressable style={styles.scrim} onPress={() => setProfileOpen(false)} />
          <SafeAreaView style={styles.profilePanel} edges={["bottom"]}>
            <View style={styles.createHeader}>
              <Text style={styles.createTitle}>{user?.name || user?.email || "Profil"}</Text>
              <Pressable accessibilityLabel="Profil menüsünü kapat" onPress={() => setProfileOpen(false)}><X size={20} color={colors.text} /></Pressable>
            </View>
            <ProfileItem label="Abonelik" onPress={() => goTo("subscription")} />
            <ProfileItem label="Faturalar" onPress={() => goTo("invoice/list")} />
            {canManageSetup ? <ProfileItem label="Kurulum" onPress={() => goTo("setup/general")} /> : null}
            <Pressable style={styles.profileSignOut} onPress={() => void signOut()}><LogOut size={17} color={colors.danger} /><Text style={styles.profileSignOutText}>Çıkış</Text></Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </ChromeContext.Provider>
  );
}

export function useDashboardChrome() {
  const value = useContext(ChromeContext);
  if (!value) throw new Error("useDashboardChrome must be used inside DashboardChromeProvider.");
  return value;
}

export function useOptionalDashboardChrome() {
  return useContext(ChromeContext);
}

export function DashboardTopbar() {
  const router = useRouter();
  const { user } = useAuth();
  const { openDrawer, openProfile, openQuickCreate, searchTerm, setSearchTerm } = useDashboardChrome();
  const { width } = useWindowDimensions();
  const showSearch = width >= 560;
  return (
    <SafeAreaView style={styles.topbarSafe} edges={["top"]}>
      <View style={styles.topbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Menüyü aç" onPress={openDrawer} style={styles.menuButton}>
          <Menu size={17} color={colors.text} />
          {width >= 390 ? <Text style={styles.menuText}>Menü</Text> : null}
        </Pressable>
        {showSearch ? (
          <View style={styles.searchBox}>
            <Search size={17} color="#94A3B8" />
            <TextInput value={searchTerm} onChangeText={setSearchTerm} onSubmitEditing={() => router.push("/(app)/customers" as Href)} placeholder="Müşteri ara..." placeholderTextColor="#94A3B8" style={styles.searchInput} returnKeyType="search" />
          </View>
        ) : null}
        <View style={styles.topbarActions}>
          <Pressable accessibilityLabel="Takvim tarihi" style={styles.iconButton} onPress={() => router.push("/feature/calendar" as Href)}><CalendarDays size={19} color={colors.textMuted} /></Pressable>
          <Pressable accessibilityLabel="Yeni oluştur" style={styles.createButton} onPress={openQuickCreate}><Plus size={20} color={colors.white} /></Pressable>
          <Pressable accessibilityLabel="Profil menüsü" style={styles.profileButton} onPress={openProfile}>
            {user?.image ? <Image source={{ uri: user.image }} style={styles.avatar} /> : <UserCircle size={27} color={colors.textMuted} />}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DrawerItem({ icon: Icon, label, onPress, compact = false }: { icon: LucideIcon; label: string; onPress: () => void; compact?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.drawerItem, compact && styles.drawerItemCompact, pressed && styles.drawerItemPressed]}><Icon size={compact ? 16 : 18} color={compact ? "#CBD5E1" : colors.white} /><Text style={[styles.drawerItemLabel, compact && styles.drawerItemLabelCompact]} numberOfLines={1}>{label}</Text></Pressable>;
}

function MessagingDrawerItems({
  items,
  openGroups,
  onToggle,
  onSelect,
}: {
  items: Array<{ id: DashboardFeatureId; label: string }>;
  openGroups: Record<string, boolean>;
  onToggle: (key: string) => void;
  onSelect: (id: DashboardFeatureId) => void;
}) {
  const allMessages = items.find((item) => item.id === "messaging/whatsapp/sent-reminders");
  const whatsapp = items.filter((item) => item.id.startsWith("messaging/whatsapp/") && item.id !== "messaging/whatsapp/sent-reminders");
  const instagram = items.filter((item) => item.id.startsWith("messaging/instagram/"));
  return (
    <View style={styles.nestedGroups}>
      {allMessages ? <DrawerItem compact icon={ImageIcon} label={allMessages.label} onPress={() => onSelect(allMessages.id)} /> : null}
      <MessagingSubGroup label="WhatsApp" icon={ImageIcon} items={whatsapp} open={Boolean(openGroups.whatsapp)} onToggle={() => onToggle("whatsapp")} onSelect={onSelect} />
      <MessagingSubGroup label="Instagram" icon={ImageIcon} items={instagram} open={Boolean(openGroups.instagram)} onToggle={() => onToggle("instagram")} onSelect={onSelect} />
    </View>
  );
}

function MessagingSubGroup({
  label,
  icon: Icon,
  items,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  icon: LucideIcon;
  items: Array<{ id: DashboardFeatureId; label: string }>;
  open: boolean;
  onToggle: () => void;
  onSelect: (id: DashboardFeatureId) => void;
}) {
  return (
    <View style={styles.messagingSubGroup}>
      <Pressable style={styles.subGroupButton} onPress={onToggle}>
        <Text style={styles.subGroupLabel}>{label}</Text>
        <Icon size={16} color="#CBD5E1" />
        <ChevronDown size={15} color="#CBD5E1" style={open ? styles.rotated : undefined} />
      </Pressable>
      {open ? <View style={styles.subGroupItems}>{items.map((item) => <DrawerItem key={item.id} compact icon={ImageIcon} label={item.label} onPress={() => onSelect(item.id)} />)}</View> : null}
    </View>
  );
}

function ProfileItem({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={({ pressed }) => [styles.profileItem, pressed && styles.createItemPressed]} onPress={onPress}><Text style={styles.createLabel}>{label}</Text><ChevronRight size={17} color={colors.textMuted} /></Pressable>;
}

function iconFor(id: DashboardFeatureId): LucideIcon {
  if (id.includes("calendar") || id.includes("booking")) return CalendarDays;
  if (id.includes("client")) return Users;
  if (id.includes("product")) return Tag;
  if (id.includes("package")) return Package;
  if (id.includes("report")) return FileText;
  if (id.includes("messaging")) return ImageIcon;
  if (id.includes("sale") || id.includes("payment") || id.includes("receivable") || id.includes("debt") || id.includes("commission")) return CircleDollarSign;
  if (id.includes("setup")) return Settings;
  return List;
}

const quickCreateItems: Array<{ id: DashboardFeatureId; label: string; icon: LucideIcon }> = [
  { id: "booking/list", label: "Yeni randevu", icon: CalendarDays },
  { id: "visit/list", label: "Yeni adisyon", icon: List },
  { id: "client/list", label: "Yeni müşteri", icon: Users },
  { id: "product_sale/list", label: "Yeni ürün satışı", icon: Tag },
  { id: "package_sale/list", label: "Yeni paket satışı", icon: Package },
  { id: "other/expense/list", label: "Yeni masraf", icon: CircleDollarSign },
  { id: "other/payment/list", label: "Yeni tahsilat", icon: CircleDollarSign },
  { id: "other/receivable/list", label: "Yeni alacak", icon: CircleDollarSign },
  { id: "other/debt/list", label: "Yeni borç", icon: CircleDollarSign },
  { id: "other/commissions", label: "Yeni komisyon", icon: CircleDollarSign },
];

const primaryItems: Array<{ id: DashboardFeatureId; label: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Özet", icon: LayoutDashboard },
  { id: "calendar", label: "Randevu takvimi", icon: CalendarDays },
  { id: "booking/list", label: "Randevular", icon: CalendarDays },
  { id: "visit/list", label: "Adisyonlar", icon: List },
  { id: "client/list", label: "Müşteriler", icon: Users },
  { id: "product_sale/list", label: "Ürün satışları", icon: Tag },
  { id: "package_sale/list", label: "Paket satışları", icon: Package },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  topbarSafe: { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1 },
  topbar: { minHeight: 56, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  menuButton: { height: 38, paddingHorizontal: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface },
  menuText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  searchBox: { flex: 1, minWidth: 100, maxWidth: 420, height: 38, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  searchInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 13, paddingVertical: 0 },
  topbarActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: spacing.xs },
  iconButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  createButton: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A" },
  profileButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  modalRoot: { flex: 1, flexDirection: "row" },
  createModalRoot: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.48)" },
  drawer: { width: "88%", maxWidth: 360, backgroundColor: colors.sidebar, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 },
  drawerHeader: { minHeight: 64, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandButton: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandImage: { width: 34, height: 34, borderRadius: 8 },
  brandText: { color: colors.white, fontSize: 18, fontWeight: "700" },
  closeButton: { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  drawerContent: { padding: spacing.md, gap: spacing.xs },
  drawerItem: { minHeight: 42, borderRadius: 8, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  drawerItemCompact: { minHeight: 36, paddingLeft: spacing.lg },
  drawerItemPressed: { backgroundColor: "rgba(255,255,255,0.1)" },
  drawerItemLabel: { color: colors.white, flex: 1, fontSize: 14, fontWeight: "600" },
  drawerItemLabelCompact: { color: "#CBD5E1", fontSize: 13, fontWeight: "500" },
  nestedGroups: { gap: spacing.xs },
  messagingSubGroup: { borderRadius: 8, backgroundColor: "rgba(255,255,255,0.04)" },
  subGroupButton: { minHeight: 38, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  subGroupLabel: { color: "#CBD5E1", flex: 1, fontSize: 13, fontWeight: "600" },
  subGroupItems: { paddingLeft: spacing.sm, paddingBottom: 3 },
  drawerGroup: { marginTop: spacing.xs, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", paddingVertical: 3 },
  groupButton: { minHeight: 42, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center" },
  groupLabel: { color: colors.white, flex: 1, fontSize: 14, fontWeight: "700" },
  rotated: { transform: [{ rotate: "180deg" }] },
  signOutButton: { marginTop: spacing.lg, minHeight: 44, borderRadius: 8, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: "rgba(127,29,29,0.28)" },
  signOutText: { color: "#FCA5A5", fontSize: 14, fontWeight: "700" },
  createPanel: { width: "92%", maxWidth: 420, borderRadius: 12, padding: spacing.md, backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  createPanelCompact: { width: "94%" },
  profilePanel: { width: "92%", maxWidth: 360, borderRadius: 12, padding: spacing.md, backgroundColor: colors.surface, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  createHeader: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.xs },
  createTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  createItem: { minHeight: 44, borderRadius: 8, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  createItemPressed: { backgroundColor: colors.surfaceMuted },
  createLabel: { color: colors.text, flex: 1, fontSize: 14, fontWeight: "600" },
  profileItem: { minHeight: 46, borderRadius: 8, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profileSignOut: { minHeight: 46, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  profileSignOutText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
});
