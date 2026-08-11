import { useEffect, useState, type PropsWithChildren } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Plus, Trash2, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectField, type SelectOption } from "@/components/SelectField";
import { Button, Card, Field, uiStyles } from "@/components/ui";
import type { Business, CheckoutItem, PackageCatalogItem, PackageSaleItem, PackageSaleLine, ProductCatalogItem, ProductSaleItem, ProductSaleLine } from "@/domain/models";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, radii, spacing } from "@/theme/tokens";

type CheckoutDraftLine = { id: string; staffId: string; serviceId: string; duration: number; amount: number };

export function CheckoutManager({ business, autoOpen = false }: { business: Business; autoOpen?: boolean }) {
  const { save } = useBusiness();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(today());
  const [hour, setHour] = useState(String(new Date().getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState("00");
  const [notes, setNotes] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<CheckoutDraftLine[]>([emptyCheckoutLine()]);
  const customerOptions = business.customers.map((item) => ({ value: item.id, label: item.name, subtitle: [item.countryCode, item.phone].filter(Boolean).join(" ") }));
  const staffOptions = business.staff.map((item) => ({ value: item.id, label: item.name, subtitle: item.role }));
  const completed = lines.filter((line) => line.staffId && line.serviceId);
  const total = completed.reduce((sum, line) => sum + line.amount, 0);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  function reset() {
    setCustomerId(""); setCustomerName(""); setDate(today());
    setHour(String(new Date().getHours()).padStart(2, "0")); setMinute("00");
    setNotes(""); setDiscountEnabled(false); setDiscount(0); setLines([emptyCheckoutLine()]);
  }

  function selectCustomer(id: string) {
    setCustomerId(id);
    setCustomerName(business.customers.find((item) => item.id === id)?.name || "");
  }

  function updateLine(id: string, fields: Partial<CheckoutDraftLine>) {
    setLines((current) => current.map((line) => {
      if (line.id !== id) return line;
      if (fields.staffId !== undefined) return { ...line, staffId: fields.staffId, serviceId: "", duration: 0, amount: 0 };
      if (fields.serviceId !== undefined) {
        const service = business.services.find((item) => item.id === fields.serviceId);
        const price = service?.priceType === "range" ? service.minPrice : service?.price;
        return { ...line, serviceId: fields.serviceId, duration: service?.duration || 0, amount: price || 0 };
      }
      return { ...line, ...fields };
    }));
  }

  async function submit() {
    if (!customerName.trim() || !completed.length) {
      Alert.alert("Eksik bilgi", "Müşteri seçin ve en az bir personel/hizmet satırı ekleyin.");
      return;
    }
    const first = completed[0]!;
    const item: CheckoutItem = {
      id: createId(),
      ...(customerId ? { customerId } : {}),
      customerName: customerName.trim(), date, hour, minute, notes,
      staffId: first.staffId, serviceId: first.serviceId,
      lines: completed.map((line) => ({ ...line })),
      duration: completed.reduce((sum, line) => sum + line.duration, 0),
      amount: total,
      discount: discountEnabled ? Math.min(total, discount) : 0,
      attendance: "Belirtilmemiş", payments: [], status: "Açık", createdAt: new Date().toISOString(),
    };
    setSaving(true);
    try {
      await save({ checkouts: [item, ...business.checkouts] });
      setOpen(false); reset();
    } catch (caught) { showSaveError(caught); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Button icon={Plus} onPress={() => setOpen(true)}>Yeni adisyon</Button>
      {business.checkouts.map((item) => (
        <Card key={item.id}>
          <View style={uiStyles.between}>
            <View style={styles.grow}><Text style={styles.title}>{item.customerName}</Text><Text style={uiStyles.body}>{item.date} · {item.hour}:{item.minute}</Text></View>
            <Text style={styles.amount}>{money(item.amount - item.discount)}</Text>
          </View>
          <Text style={uiStyles.body}>{checkoutLineNames(item, business)}</Text>
        </Card>
      ))}
      {!business.checkouts.length ? <Card><Text style={uiStyles.body}>Henüz adisyon bulunmuyor.</Text></Card> : null}
      <EditorModal visible={open} title="Yeni adisyon" onClose={() => setOpen(false)}>
        <SelectField label="Kayıtlı müşteri" value={customerId} options={customerOptions} onChange={selectCustomer} placeholder="Müşteri seçin" />
        <Field label="Müşteri adı" value={customerName} onChangeText={(value) => { setCustomerName(value); setCustomerId(""); }} placeholder="Yeni müşteri adı da yazabilirsiniz" />
        <Field label="Tarih" value={date} onChangeText={setDate} placeholder="YYYY-AA-GG" />
        <View style={styles.twoColumns}>
          <View style={styles.grow}><SelectField label="Saat" value={hour} options={hours()} onChange={setHour} /></View>
          <View style={styles.grow}><SelectField label="Dakika" value={minute} options={minutes()} onChange={setMinute} /></View>
        </View>
        <Field label="Notlar" value={notes} onChangeText={setNotes} multiline />
        <Text style={uiStyles.sectionTitle}>Hizmetler</Text>
        {lines.map((line, index) => {
          const services = business.services.filter((service) => service.staffIds.includes(line.staffId));
          return (
            <Card key={line.id}>
              <View style={uiStyles.between}><Text style={styles.lineTitle}>Hizmet {index + 1}</Text>{lines.length > 1 ? <DeleteButton onPress={() => setLines((current) => current.filter((item) => item.id !== line.id))} /> : null}</View>
              <SelectField label="Personel" value={line.staffId} options={staffOptions} onChange={(value) => updateLine(line.id, { staffId: value })} />
              <SelectField label="Hizmet" value={line.serviceId} options={services.map((item) => ({ value: item.id, label: `${item.name} [${item.gender}]`, subtitle: `${item.duration} dk · ${money(servicePrice(item))}` }))} onChange={(value) => updateLine(line.id, { serviceId: value })} disabled={!line.staffId} />
              {line.serviceId ? <View style={styles.twoColumns}><View style={styles.grow}><Field label="Süre (dk)" value={String(line.duration)} onChangeText={(value) => updateLine(line.id, { duration: numeric(value) })} keyboardType="decimal-pad" /></View><View style={styles.grow}><Field label="Tutar" value={String(line.amount)} onChangeText={(value) => updateLine(line.id, { amount: numeric(value) })} keyboardType="decimal-pad" /></View></View> : null}
            </Card>
          );
        })}
        <Button variant="secondary" icon={Plus} onPress={() => setLines((current) => [...current, emptyCheckoutLine()])}>Bir hizmet daha ekle</Button>
        <Toggle label="İndirim uygula" value={discountEnabled} onChange={setDiscountEnabled} />
        {discountEnabled ? <Field label="İndirim tutarı" value={String(discount)} onChangeText={(value) => setDiscount(numeric(value))} keyboardType="decimal-pad" /> : null}
        <Summary total={total} discount={discountEnabled ? Math.min(total, discount) : 0} />
        <Button loading={saving} onPress={() => void submit()}>Adisyonu oluştur</Button>
      </EditorModal>
    </>
  );
}

export function SalesManager({ business, kind, autoOpen = false }: { business: Business; kind: "product" | "package"; autoOpen?: boolean }) {
  const { save } = useBusiness();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(today());
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [openPaymentWindow, setOpenPaymentWindow] = useState(false);
  const [createReceivable, setCreateReceivable] = useState(false);
  const [productLines, setProductLines] = useState<ProductSaleLine[]>([emptyProductLine()]);
  const [packageLines, setPackageLines] = useState<PackageSaleLine[]>([emptyPackageLine()]);
  const [products, setProducts] = useState<ProductCatalogItem[]>(business.promotions.products || []);
  const [packages, setPackages] = useState<PackageCatalogItem[]>(business.promotions.packages || []);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogName, setCatalogName] = useState("");
  const [catalogBarcode, setCatalogBarcode] = useState("");
  const [catalogType, setCatalogType] = useState("");
  const [catalogServiceId, setCatalogServiceId] = useState("");
  const [catalogQuantity, setCatalogQuantity] = useState(1);
  const [catalogPrice, setCatalogPrice] = useState(0);
  const productSales = business.promotions.productSales || [];
  const packageSales = business.promotions.packageSales || [];
  const sales = kind === "product" ? productSales : packageSales;
  const customerOptions = business.customers.map((item) => ({ value: item.id, label: item.name, subtitle: item.phone }));
  const staffOptions = business.staff.map((item) => ({ value: item.id, label: item.name, subtitle: item.role }));
  const total = kind === "product"
    ? productLines.reduce((sum, line) => sum + line.quantity * line.amount, 0)
    : packageLines.reduce((sum, line) => sum + line.quantity * line.amount, 0);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  function selectCustomer(id: string) { setCustomerId(id); setCustomerName(business.customers.find((item) => item.id === id)?.name || ""); }
  function reset() {
    setDate(today()); setCustomerId(""); setCustomerName(""); setSellerId(""); setNotes(""); setPaid(false);
    setHasExpiry(false); setOpenPaymentWindow(false); setCreateReceivable(false);
    setProductLines([emptyProductLine()]); setPackageLines([emptyPackageLine()]);
  }

  function chooseProduct(lineId: string, productId: string) {
    const product = products.find((item) => item.id === productId);
    setProductLines((current) => current.map((line) => line.id === lineId ? { ...line, productId, name: product?.name || "", amount: product?.price || 0 } : line));
  }
  function choosePackage(lineId: string, packageId: string) {
    const item = packages.find((entry) => entry.id === packageId);
    setPackageLines((current) => current.map((line) => line.id === lineId ? { ...line, packageId, name: item?.name || "", packageType: item?.type || "", serviceId: item?.serviceId || "", quantity: item?.quantity || 1, amount: item?.price || 0 } : line));
  }

  async function submit() {
    const validProducts = productLines.filter((line) => line.productId);
    const validPackages = packageLines.filter((line) => line.packageId);
    if (!customerName.trim() || (kind === "product" ? !validProducts.length : !validPackages.length)) {
      Alert.alert("Eksik bilgi", `Müşteri ve en az bir ${kind === "product" ? "ürün" : "paket"} seçin.`); return;
    }
    setSaving(true);
    try {
      if (kind === "product") {
        const item: ProductSaleItem = { id: createId(), ...(customerId ? { customerId } : {}), date, customerName, sellerId, notes, lines: validProducts, paid, total, paidAmount: paid ? total : 0, createdBy: "Aloyz", createdAt: new Date().toISOString() };
        await save({ promotions: { ...business.promotions, products, productSales: [item, ...productSales] } });
      } else {
        const item: PackageSaleItem = { id: createId(), ...(customerId ? { customerId } : {}), date, customerName, sellerId, notes, lines: validPackages, hasExpiry, openPaymentWindow, createReceivable, total, paidAmount: createReceivable ? 0 : total, createdBy: "Aloyz", createdAt: new Date().toISOString() };
        await save({ promotions: { ...business.promotions, packages, packageSales: [item, ...packageSales] } });
      }
      setOpen(false); reset();
    } catch (caught) { showSaveError(caught); }
    finally { setSaving(false); }
  }

  function addCatalogItem() {
    if (!catalogName.trim()) { Alert.alert("Eksik bilgi", `${kind === "product" ? "Ürün" : "Paket"} adını girin.`); return; }
    if (kind === "product") {
      const item: ProductCatalogItem = { id: createId(), name: catalogName.trim(), barcode: catalogBarcode.trim(), price: catalogPrice };
      setProducts((current) => [item, ...current]);
      setProductLines((current) => current.map((line, index) => index === current.length - 1 && !line.productId ? { ...line, productId: item.id, name: item.name, amount: item.price } : line));
    } else {
      if (!catalogServiceId) { Alert.alert("Eksik bilgi", "Paketin bağlı olduğu hizmeti seçin."); return; }
      const item: PackageCatalogItem = { id: createId(), name: catalogName.trim(), type: catalogType.trim(), serviceId: catalogServiceId, quantity: catalogQuantity, price: catalogPrice };
      setPackages((current) => [item, ...current]);
      setPackageLines((current) => current.map((line, index) => index === current.length - 1 && !line.packageId ? { ...line, packageId: item.id, name: item.name, packageType: item.type, serviceId: item.serviceId, quantity: item.quantity, amount: item.price } : line));
    }
    setCatalogName(""); setCatalogBarcode(""); setCatalogType(""); setCatalogServiceId(""); setCatalogQuantity(1); setCatalogPrice(0); setCatalogOpen(false);
  }

  return (
    <>
      <Button icon={Plus} onPress={() => setOpen(true)}>{kind === "product" ? "Yeni ürün satışı" : "Yeni paket satışı"}</Button>
      {sales.map((sale) => (
        <Card key={sale.id}>
          <View style={uiStyles.between}><View style={styles.grow}><Text style={styles.title}>{sale.customerName || "İsimsiz müşteri"}</Text><Text style={uiStyles.body}>{sale.date} · {sale.lines.map((line) => line.name).join(", ")}</Text></View><Text style={styles.amount}>{money(sale.total)}</Text></View>
          <Text style={uiStyles.body}>Satıcı: {business.staff.find((staff) => staff.id === sale.sellerId)?.name || "Belirtilmedi"} · Kalan: {money(sale.total - sale.paidAmount)}</Text>
        </Card>
      ))}
      {!sales.length ? <Card><Text style={uiStyles.body}>Henüz satış bulunmuyor.</Text></Card> : null}
      <EditorModal visible={open} title={kind === "product" ? "Yeni ürün satışı" : "Yeni paket satışı"} onClose={() => setOpen(false)}>
        <Field label="Satış tarihi" value={date} onChangeText={setDate} placeholder="YYYY-AA-GG" />
        <SelectField label="Kayıtlı müşteri" value={customerId} options={customerOptions} onChange={selectCustomer} placeholder="Müşteri seçin" />
        <Field label="Müşteri adı" value={customerName} onChangeText={(value) => { setCustomerName(value); setCustomerId(""); }} placeholder="Yeni müşteri adı da yazabilirsiniz" />
        <Text style={uiStyles.sectionTitle}>{kind === "product" ? "Ürünler" : "Paketler"}</Text>
        <Button variant="secondary" icon={Plus} onPress={() => setCatalogOpen((value) => !value)}>Yeni {kind === "product" ? "ürün" : "paket"} tanımla</Button>
        {catalogOpen ? (
          <Card>
            <Text style={styles.lineTitle}>Hızlı katalog kaydı</Text>
            <Field label={kind === "product" ? "Ürün adı" : "Paket adı"} value={catalogName} onChangeText={setCatalogName} />
            {kind === "product" ? <Field label="Barkod" value={catalogBarcode} onChangeText={setCatalogBarcode} /> : <><Field label="Paket türü" value={catalogType} onChangeText={setCatalogType} /><SelectField label="Hizmet" value={catalogServiceId} options={business.services.map((item) => ({ value: item.id, label: item.name, subtitle: `${item.duration} dk` }))} onChange={setCatalogServiceId} /><Field label="Seans adedi" value={String(catalogQuantity)} onChangeText={(value) => setCatalogQuantity(numeric(value))} keyboardType="number-pad" /></>}
            <Field label="Fiyat" value={String(catalogPrice)} onChangeText={(value) => setCatalogPrice(numeric(value))} keyboardType="decimal-pad" />
            <Button onPress={addCatalogItem}>Kataloğa ekle ve seç</Button>
          </Card>
        ) : null}
        {kind === "product" ? productLines.map((line, index) => (
          <Card key={line.id}>
            <View style={uiStyles.between}><Text style={styles.lineTitle}>Ürün {index + 1}</Text>{productLines.length > 1 ? <DeleteButton onPress={() => setProductLines((current) => current.filter((item) => item.id !== line.id))} /> : null}</View>
            <SelectField label="Ürün" value={line.productId} options={products.map((item) => ({ value: item.id, label: item.name, subtitle: `${item.barcode || "Barkod yok"} · ${money(item.price)}` }))} onChange={(value) => chooseProduct(line.id, value)} />
            <View style={styles.twoColumns}><View style={styles.grow}><Field label="Adet" value={String(line.quantity)} onChangeText={(value) => setProductLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: numeric(value) } : item))} keyboardType="number-pad" /></View><View style={styles.grow}><Field label="Birim fiyat" value={String(line.amount)} onChangeText={(value) => setProductLines((current) => current.map((item) => item.id === line.id ? { ...item, amount: numeric(value) } : item))} keyboardType="decimal-pad" /></View></View>
          </Card>
        )) : packageLines.map((line, index) => (
          <Card key={line.id}>
            <View style={uiStyles.between}><Text style={styles.lineTitle}>Paket {index + 1}</Text>{packageLines.length > 1 ? <DeleteButton onPress={() => setPackageLines((current) => current.filter((item) => item.id !== line.id))} /> : null}</View>
            <SelectField label="Paket" value={line.packageId} options={packages.map((item) => ({ value: item.id, label: item.name, subtitle: `${item.quantity} seans · ${money(item.price)}` }))} onChange={(value) => choosePackage(line.id, value)} />
            <View style={styles.twoColumns}><View style={styles.grow}><Field label="Miktar" value={String(line.quantity)} onChangeText={(value) => setPackageLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: numeric(value) } : item))} keyboardType="number-pad" /></View><View style={styles.grow}><Field label="Tutar" value={String(line.amount)} onChangeText={(value) => setPackageLines((current) => current.map((item) => item.id === line.id ? { ...item, amount: numeric(value) } : item))} keyboardType="decimal-pad" /></View></View>
          </Card>
        ))}
        <Button variant="secondary" icon={Plus} onPress={() => kind === "product" ? setProductLines((current) => [...current, emptyProductLine()]) : setPackageLines((current) => [...current, emptyPackageLine()])}>Bir {kind === "product" ? "ürün" : "paket"} daha ekle</Button>
        <SelectField label="Satıcı" value={sellerId} options={staffOptions} onChange={setSellerId} placeholder="Satıcı seçin" />
        <Field label="Notlar" value={notes} onChangeText={setNotes} multiline />
        {kind === "product" ? <Toggle label="Tüm tutar tahsil edildi" value={paid} onChange={setPaid} /> : <><Toggle label="Son geçerlilik tarihi var" value={hasExpiry} onChange={setHasExpiry} /><Toggle label="Kaydettikten sonra ödeme penceresini aç" value={openPaymentWindow} onChange={setOpenPaymentWindow} /><Toggle label="Tüm tutar için alacak kaydı oluştur" value={createReceivable} onChange={setCreateReceivable} /></>}
        <Summary total={total} discount={0} />
        <Button loading={saving} onPress={() => void submit()}>Kaydet</Button>
      </EditorModal>
    </>
  );
}

function EditorModal({ visible, title, onClose, children }: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.modal} edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView style={styles.grow} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.header}><Text style={styles.modalTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={onClose} style={styles.close}><X color={colors.text} size={22} /></Pressable></View><ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">{children}</ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
function DeleteButton({ onPress }: { onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel="Satırı sil" onPress={onPress} style={styles.delete}><Trash2 color={colors.danger} size={17} /></Pressable>; }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={styles.toggle}><Text style={styles.toggleLabel}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary }} /></View>; }
function Summary({ total, discount }: { total: number; discount: number }) { return <Card><View style={uiStyles.between}><Text style={styles.lineTitle}>Toplam</Text><Text style={styles.summary}>{money(total - discount)}</Text></View>{discount ? <Text style={uiStyles.body}>İndirim: {money(discount)}</Text> : null}</Card>; }
function emptyCheckoutLine(): CheckoutDraftLine { return { id: createId(), staffId: "", serviceId: "", duration: 0, amount: 0 }; }
function emptyProductLine(): ProductSaleLine { return { id: createId(), productId: "", name: "", quantity: 1, amount: 0 }; }
function emptyPackageLine(): PackageSaleLine { return { id: createId(), packageId: "", name: "", packageType: "", serviceId: "", quantity: 1, amount: 0 }; }
function createId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function numeric(value: string) { const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0; }
function money(value: number) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value); }
function servicePrice(service: Business["services"][number]) { return service.priceType === "range" ? service.minPrice : service.price; }
function hours(): SelectOption[] { return Array.from({ length: 24 }, (_, value) => ({ value: String(value).padStart(2, "0"), label: String(value).padStart(2, "0") })); }
function minutes(): SelectOption[] { return ["00", "15", "30", "45"].map((value) => ({ value, label: value })); }
function checkoutLineNames(item: CheckoutItem, business: Business) { const lines = item.lines || []; return lines.map((line) => business.services.find((service) => service.id === String(line.serviceId || ""))?.name).filter(Boolean).join(", ") || business.services.find((service) => service.id === item.serviceId)?.name || "Hizmet belirtilmedi"; }
function showSaveError(caught: unknown) { Alert.alert("Kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin."); }

const styles = StyleSheet.create({
  grow: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" },
  amount: { color: colors.primary, fontSize: 16, fontWeight: "900" },
  lineTitle: { color: colors.text, fontSize: 14, fontWeight: "800" },
  twoColumns: { flexDirection: "row", gap: spacing.md },
  modal: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.surfaceMuted },
  form: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  delete: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.dangerSoft },
  toggle: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
  toggleLabel: { color: colors.text, fontSize: 14, fontWeight: "700", flex: 1 },
  summary: { color: colors.primary, fontSize: 22, fontWeight: "900" },
});
