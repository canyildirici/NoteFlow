import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function PDFViewer({ route, navigation }) {
  const { uri, title } = route.params;
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const handleOpen = () => {
    if (Platform.OS === 'web') {
      window.open(uri, '_blank');
    } else if (Platform.OS === 'android') {
      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(uri)}`;
      import('expo-web-browser').then(({ openBrowserAsync }) => openBrowserAsync(googleDocsUrl));
    }
  };

  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={theme.blue} />
          <Text style={s.backText}>Geri</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <View style={s.card}>
        <View style={[s.iconBox, { backgroundColor: isIOS ? 'rgba(107,114,128,0.15)' : 'rgba(239,68,68,0.15)' }]}>
          <Ionicons name="document-text" size={64} color={isIOS ? theme.text2 : '#ef4444'} />
        </View>

        <Text style={s.pdfTitle}>{title}</Text>

        {isIOS ? (
          <>
            <View style={s.iosBadge}>
              <Ionicons name="information-circle-outline" size={16} color={theme.text2} />
              <Text style={s.iosBadgeText}>iPhone'da PDF açma desteklenmiyor</Text>
            </View>
            <Text style={s.iosSub}>Bu PDF'i web tarayıcısından veya Android cihazdan açabilirsin.</Text>
          </>
        ) : (
          <>
            <Text style={s.pdfSub}>
              {isWeb ? 'PDF dosyasını yeni sekmede görüntülemek için butona bas' : 'PDF dosyasını görüntülemek için butona bas'}
            </Text>
            <TouchableOpacity style={s.openBtn} onPress={handleOpen}>
              <Ionicons name={isWeb ? 'open-outline' : 'eye-outline'} size={20} color="#fff" />
              <Text style={s.openBtnText}>
                {isWeb ? "PDF'i Yeni Sekmede Aç" : "PDF'i Görüntüle"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 54, marginBottom: 32 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  backText: { color: theme.blue, fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1 },
  card: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: theme.border },
  iconBox: { width: 120, height: 120, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pdfTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 12, textAlign: 'center' },
  pdfSub: { fontSize: 14, color: theme.text2, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  openBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.blue, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16, shadowColor: theme.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  openBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  iosBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.surface2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  iosBadgeText: { fontSize: 13, color: theme.text2, fontWeight: '600' },
  iosSub: { fontSize: 13, color: theme.text2, textAlign: 'center', lineHeight: 20 },
});