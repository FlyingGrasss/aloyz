import { Linking, Text } from "react-native";
import { Card, PageHeader, ScrollScreen, uiStyles } from "@/components/ui";

export default function PrivacyScreen() {
  return (
    <ScrollScreen>
      <PageHeader title="Gizlilik Politikası" subtitle="Son güncelleme: 23 Haziran 2026" />
      <Card>
        <Text style={uiStyles.sectionTitle}>Topladığımız bilgiler</Text>
        <Text style={uiStyles.body}>Hesap ve işletme profili bilgileri, işletmenin girdiği müşteri kayıtları, randevu verileri, ödeme kayıtları ve bağlanan mesajlaşma kanallarından gelen veriler hizmeti sunmak için işlenir.</Text>
        <Text style={uiStyles.sectionTitle}>Verilerin kullanımı</Text>
        <Text style={uiStyles.body}>Veriler paneli işletmek, mesajları doğru işletmeye yönlendirmek, randevuları yönetmek, güvenliği sağlamak ve destek sunmak amacıyla kullanılır. Kişisel veriler satılmaz.</Text>
        <Text style={uiStyles.sectionTitle}>İletişim</Text>
        <Text accessibilityRole="link" onPress={() => void Linking.openURL("mailto:info@aloyz.co")} style={[uiStyles.body, { textDecorationLine: "underline" }]}>info@aloyz.co</Text>
      </Card>
    </ScrollScreen>
  );
}
