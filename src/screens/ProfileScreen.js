import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, TextInput, Modal, Platform } from 'react-native';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function ProfileScreen() {
  const [notes, setNotes] = useState([]);
  const [userClassCode, setUserClassCode] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newClassCode, setNewClassCode] = useState('');
  const [saving, setSaving] = useState(false);
  const { isDark, toggleTheme, theme } = useTheme();
  const s = makeStyles(theme);

  useEffect(() => {
    const q = query(collection(db, 'notes'), where('userId', '==', auth.currentUser?.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchUserClass = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
        if (userDoc.exists()) {
          setUserClassCode(userDoc.data().classCode || '');
        }
      } catch (e) {}
    };
    fetchUserClass();
  }, []);

  const handleSaveClassCode = async () => {
    if (!newClassCode.trim()) {
      Alert.alert('Hata', 'Sinif kodu bos olamaz!');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser?.uid), {
        email: auth.currentUser?.email,
        classCode: newClassCode.trim().toUpperCase(),
      }, { merge: true });
      setUserClassCode(newClassCode.trim().toUpperCase());
      setModalVisible(false);
      setNewClassCode('');
      Alert.alert('Basarili', 'Sinif kodun guncellendi!');
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
    setSaving(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Hesabindan cikmak istiyor musun?')) signOut(auth);
      return;
    }
    Alert.alert('Cikis Yap', 'Hesabindan cikmak istiyor musun?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Cikis Yap', style: 'destructive', onPress: () => signOut(auth) }
    ]);
  };

  const email = auth.currentUser?.email || '';
  const avatar = email[0]?.toUpperCase() || 'U';
  const totalNotes = notes.length;
  const favNotes = notes.filter(n => n.favorite).length;
  const privateNotes = notes.filter(n => n.access === 'private').length;
  const classNotes = notes.filter(n => n.access === 'class').length;
  const linkNotes = notes.filter(n => n.access === 'link').length;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>Profil</Text>
      </View>

      <View style={s.profileCard}>
        <View style={s.avatarBox}>
          <Text style={s.avatarText}>{avatar}</Text>
        </View>
        <Text style={s.emailText}>{email}</Text>
        <View style={s.memberBadge}>
          <Text style={s.memberText}>NoteFlow Uyesi</Text>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={[s.statVal, { color: theme.blue }]}>{totalNotes}</Text>
          <Text style={s.statLbl}>Not</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statVal, { color: '#f59e0b' }]}>{favNotes}</Text>
          <Text style={s.statLbl}>Favori</Text>
        </View>
        <View style={s.statCard}>
          <Text style={[s.statVal, { color: '#10b981' }]}>{notes.filter(n => n.fileType).length}</Text>
          <Text style={s.statLbl}>Dosya</Text>
        </View>
      </View>

      {/* Sınıf Kodu Bölümü */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Sinif Bilgisi</Text>
        <View style={s.settingsCard}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Ionicons name="school-outline" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={s.settingLabel}>Sinif Kodu</Text>
                <Text style={s.settingSubLabel}>
                  {userClassCode ? userClassCode : 'Henuz eklenmedi'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.updateBtn}
              onPress={() => { setNewClassCode(userClassCode); setModalVisible(true); }}
            >
              <Text style={s.updateBtnText}>{userClassCode ? 'Guncelle' : 'Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Erisim Dagilimi</Text>
        <View style={s.accessCard}>
          <View style={s.accessRow}>
            <View style={[s.accessDot, { backgroundColor: '#ef4444' }]} />
            <Text style={s.accessLabel}>Ozel</Text>
            <Text style={s.accessCount}>{privateNotes} not</Text>
          </View>
          <View style={s.accessRow}>
            <View style={[s.accessDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={s.accessLabel}>Sinif</Text>
            <Text style={s.accessCount}>{classNotes} not</Text>
          </View>
          <View style={s.accessRow}>
            <View style={[s.accessDot, { backgroundColor: '#10b981' }]} />
            <Text style={s.accessLabel}>Herkese Acik</Text>
            <Text style={s.accessCount}>{linkNotes} not</Text>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Ayarlar</Text>
        <View style={s.settingsCard}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={theme.blue} />
              </View>
              <Text style={s.settingLabel}>{isDark ? 'Karanlik Tema' : 'Aydinlik Tema'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e2e8f0', true: theme.blue }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Uygulama Hakkinda</Text>
        <View style={s.settingsCard}>
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
              </View>
              <Text style={s.settingLabel}>Versiyon</Text>
            </View>
            <Text style={s.settingValue}>1.0.0</Text>
          </View>
          <View style={s.settingDivider} />
          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <View style={[s.settingIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Ionicons name="code-outline" size={18} color="#f59e0b" />
              </View>
              <Text style={s.settingLabel}>Gelistirici</Text>
            </View>
            <Text style={s.settingValue}>NoteFlow Team</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={s.logoutText}>Cikis Yap</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Sınıf Kodu Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Sinif Kodunu Guncelle</Text>
            <Text style={s.modalSub}>Ayni kodu giren kisiler sinif notlarini gorebilir</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Ornek: MAT101"
              placeholderTextColor="#6b7280"
              value={newClassCode}
              onChangeText={setNewClassCode}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={s.modalBtnRow}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => { setModalVisible(false); setNewClassCode(''); }}
              >
                <Text style={s.modalCancelText}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.modalSaveBtn}
                onPress={handleSaveClassCode}
                disabled={saving}
              >
                <Text style={s.modalSaveText}>{saving ? '...' : 'Kaydet'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { marginTop: 54, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  profileCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 28, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 16 },
  avatarBox: { width: 80, height: 80, backgroundColor: theme.blue, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: theme.blue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  emailText: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 },
  memberBadge: { backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  memberText: { fontSize: 12, color: theme.blue, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: theme.surface, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  statVal: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  statLbl: { fontSize: 11, color: theme.text2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  accessCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 12 },
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  accessDot: { width: 10, height: 10, borderRadius: 5 },
  accessLabel: { flex: 1, fontSize: 14, color: theme.text, fontWeight: '500' },
  accessCount: { fontSize: 13, color: theme.text2, fontWeight: '600' },
  settingsCard: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, color: theme.text, fontWeight: '500' },
  settingSubLabel: { fontSize: 12, color: '#f59e0b', fontWeight: '700', marginTop: 2 },
  settingValue: { fontSize: 13, color: theme.text2, fontWeight: '500' },
  settingDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: 16 },
  updateBtn: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  updateBtnText: { fontSize: 12, color: '#f59e0b', fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 14, padding: 16, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 24, width: '100%', borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 6 },
  modalSub: { fontSize: 13, color: theme.text2, marginBottom: 20, lineHeight: 18 },
  modalInput: { backgroundColor: theme.surface2, borderRadius: 12, padding: 14, color: theme.text, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: theme.border, marginBottom: 20, letterSpacing: 1 },
  modalBtnRow: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.surface2, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  modalCancelText: { fontSize: 14, color: theme.text2, fontWeight: '600' },
  modalSaveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.blue, alignItems: 'center' },
  modalSaveText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});