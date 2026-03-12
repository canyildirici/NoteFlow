import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, StatusBar, Platform } from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, onSnapshot, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function HomeScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [userClassCode, setUserClassCode] = useState(null); // DEĞİŞTİ: '' yerine null
  const { theme, isDark } = useTheme();

  useEffect(() => {
    const fetchUserClass = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
        if (userDoc.exists()) {
          setUserClassCode(userDoc.data().classCode || '');
        } else {
          setUserClassCode(''); // DEĞİŞTİ: doküman yoksa boş string
        }
      } catch (e) {
        setUserClassCode(''); // DEĞİŞTİ: hata olursa boş string
      }
    };
    fetchUserClass();
  }, []);

  useEffect(() => {
    if (userClassCode === null) return; // DEĞİŞTİ: classCode yüklenene kadar bekle

    const unsubscribe = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(note => {
          if (note.access === 'private') return note.userId === auth.currentUser?.uid;
          if (note.access === 'class') return note.classCode === userClassCode;
          return true;
        });
      setNotes(data);
    });
    return unsubscribe;
  }, [userClassCode]);

  const handleDelete = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bu notu silmek istediğine emin misin?');
      if (confirmed) {
        try {
          await deleteDoc(doc(db, 'notes', id));
        } catch (e) {
          window.alert('Hata: ' + e.message);
        }
      }
      return;
    }
    Alert.alert('Notu Sil', 'Bu notu silmek istedigine emin misin?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'notes', id));
        } catch (e) {
          Alert.alert('Hata', e.message);
        }
      }}
    ]);
  };

  const getAccessColor = (access) => {
    if (access === 'private') return '#ef4444';
    if (access === 'class') return '#f59e0b';
    return '#10b981';
  };

  const getAccessLabel = (access) => {
    if (access === 'private') return 'Ozel';
    if (access === 'class') return 'Sinif';
    return 'Acik';
  };

  const cardAccents = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];
  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hos Geldin</Text>
          <Text style={s.title}>NoteFlow</Text>
        </View>
        <View style={s.headerActions}>
          {userClassCode ? (
            <View style={s.classBadge}>
              <Ionicons name="school-outline" size={13} color="#f59e0b" />
              <Text style={s.classBadgeText}>{userClassCode}</Text>
            </View>
          ) : null}
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Upload')}>
            <Ionicons name="cloud-upload-outline" size={20} color={theme.blue} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, { borderColor: 'rgba(239,68,68,0.3)' }]} onPress={() => signOut(auth)}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={[s.statCard, { borderTopColor: '#3b82f6' }]}>
          <Text style={s.statValue}>{notes.length}</Text>
          <Text style={s.statLabel}>Toplam Not</Text>
        </View>
        <View style={[s.statCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={s.statValue}>{notes.filter(n => n.favorite).length}</Text>
          <Text style={s.statLabel}>Favori</Text>
        </View>
        <View style={[s.statCard, { borderTopColor: '#10b981' }]}>
          <Text style={s.statValue}>{notes.filter(n => n.fileType).length}</Text>
          <Text style={s.statLabel}>Dosya</Text>
        </View>
      </View>

      <TouchableOpacity style={s.addButton} onPress={() => navigation.navigate('AddNote')}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={s.addButtonText}>Yeni Not Ekle</Text>
      </TouchableOpacity>

      {notes.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="document-text-outline" size={36} color={theme.blue} />
          </View>
          <Text style={s.emptyText}>Henuz not yok</Text>
          <Text style={s.emptySub}>Ilk notunu eklemek icin butona bas</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[s.noteCard, { borderLeftColor: cardAccents[index % cardAccents.length] }]}
              onPress={() => navigation.navigate('NoteDetail', { note: item })}
              activeOpacity={0.75}
            >
              <View style={s.noteHeader}>
                <View style={s.noteTitleRow}>
                  <Text style={s.noteTitle} numberOfLines={1}>{item.title}</Text>
                  {item.favorite && <Ionicons name="star" size={14} color="#f59e0b" />}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>Sil</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.notePreview} numberOfLines={2}>{item.content}</Text>
              <View style={s.noteMeta}>
                <View style={[s.accessBadge, { backgroundColor: getAccessColor(item.access) + '20' }]}>
                  <Text style={[s.accessText, { color: getAccessColor(item.access) }]}>
                    {getAccessLabel(item.access)}
                  </Text>
                </View>
                <Text style={s.noteFolder}>{item.folder}</Text>
                {item.userId !== auth.currentUser?.uid && (
                  <View style={s.sharedBadge}>
                    <Ionicons name="people-outline" size={11} color={theme.blue} />
                    <Text style={s.sharedText}>Paylasilan</Text>
                  </View>
                )}
                {item.fileType && (
                  <View style={s.fileBadge}>
                    <Text style={s.fileBadgeText}>{item.fileType.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              {item.tags?.length > 0 && (
                <View style={s.tagRow}>
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <Text key={i} style={s.tag}>#{tag}</Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 54, marginBottom: 24 },
  greeting: { fontSize: 13, color: theme.text2, marginBottom: 2, fontWeight: '500', letterSpacing: 0.5 },
  title: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  classBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  classBadgeText: { fontSize: 11, color: '#f59e0b', fontWeight: '800' },
  iconBtn: { width: 40, height: 40, backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: theme.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderTopWidth: 2 },
  statValue: { fontSize: 22, fontWeight: '900', color: theme.text, marginBottom: 4 },
  statLabel: { fontSize: 10, color: theme.text2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  addButton: { backgroundColor: theme.blue, borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 20, flexDirection: 'row', justifyContent: 'center', gap: 8, shadowColor: theme.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 72, height: 72, backgroundColor: theme.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  emptyText: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.text2, textAlign: 'center' },
  noteCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3 },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  deleteBtnText: { fontSize: 11, color: '#ef4444', fontWeight: '700' },
  notePreview: { fontSize: 13, color: theme.text2, lineHeight: 20, marginBottom: 12 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  accessBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  accessText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  noteFolder: { fontSize: 11, color: theme.text2, fontWeight: '500' },
  sharedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.blue + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sharedText: { fontSize: 10, color: theme.blue, fontWeight: '600' },
  fileBadge: { backgroundColor: theme.blue + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' },
  fileBadgeText: { fontSize: 9, color: theme.blue, fontWeight: '800', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: theme.blue + '10', color: theme.blue, fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});