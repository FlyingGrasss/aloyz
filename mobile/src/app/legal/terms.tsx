import { Linking, Text } from "react-native";
import { Card, PageHeader, ScrollScreen, uiStyles } from "@/components/ui";

export default function TermsScreen() {
  return (
    <ScrollScreen>
      <PageHeader title="Kullanım Koşulları" subtitle="Son güncelleme: 23 Haziran 2026" />
      <Card>
        <Text style={uiStyles.sectionTitle}>Hizmetin kullanımı</Text>
        <Text style={uiStyles.body}>Girdiğiniz işletme ve müşteri verilerinin doğruluğundan, gerekli müşteri izinlerini almaktan ve mesajlaşma, gizlilik ve tüketici mevzuatına uymaktan siz sorumlusunuz.</Text>
        <Text style={uiStyles.sectionTitle}>Bağlı platformlar</Text>
        <Text style={uiStyles.body}>WhatsApp, Instagram, Google Takvim veya başka bir hizmeti bağladığınızda Aloyz'in ilgili verilere yalnızca istediğiniz işlevi sunmak için erişmesine izin verirsiniz.</Text>
        <Text style={uiStyles.sectionTitle}>İletişim</Text>
        <Text accessibilityRole="link" onPress={() => void Linking.openURL("mailto:info@aloyz.co")} style={[uiStyles.body, { textDecorationLine: "underline" }]}>info@aloyz.co</Text>
      </Card>
    </ScrollScreen>
  );
}
