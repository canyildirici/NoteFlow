import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

const DEFAULT_FOLDERS = [
  { name: 'Genel', icon: 'folder-outline', color: '#3b82f6' },
  { name: 'Matematik', icon: 'calculator-outline', color: '#8b5cf6' },
  { name: 'Fizik', icon: 'planet-outline', color: '#06b6d4' },
  { name: 'Kimya', icon: 'flask-outline', color: '#10b981' },
  { name: 'Tarih', icon: 'time-outline', color: '#f59e0b' },
];

const EXTRA_COLORS = ['#ec4899', '#f97316', '#14b8a6', '#6366f1', '#84cc16'];

export default function FoldersScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [userClassCode, setUserClassCode] = useState(null); // null = henüz yüklenmedi
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // Önce classCode'u yükle
  useEffect(() => {
    const fetchUserClass = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
        if (userDoc.exists()) {
          setUserClassCode(userDoc.data().classCode || '');
        } else {
          setUserClassCode('');
        }
      } catch (e) {
        setUserClassCode('');
      }
    };
    fetchUserClass();
  }, []);

  // classCode yüklendikten sonra notları dinle
  useEffect(() => {
    if (userClassCode === null) return; // bekle

    const unsubscribe = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(note => {
          if (note.access === 'private') return note.userId === auth.currentUser?.uid;
          if (note.access === 'class') return note.classCode === userClassCode;
          return true; // link = herkese açık
        });
      setNotes(data);

      // Notlardan dinamik klasör listesi oluştur
      const defaultNames = DEFAULT_FOLDERS.map(f => f.name);
      const allFolderNames = [...new Set(data.map(n => n.folder).filter(Boolean))];
      const customNames = allFolderNames.filter(name => !defaultNames.includes(name));
      const customFolders = customNames.map((name, i) => ({
        name,
        icon: 'folder-outline',
        color: EXTRA_COLORS[i % EXTRA_COLORS.length],
      }));
      setFolders([...DEFAULT_FOLDERS, ...customFolders]);
    });
    return unsubscribe;
  }, [userClassCode]);

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

  const folderNotes = selectedFolder
    ? notes.filter(n => n.folder === selectedFolder)
    : [];

  const cardAccents = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

  if (selectedFolder) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelectedFolder(null)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={theme.blue} />
            <Text style={s.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={s.title} numberOfLines={1}>{selectedFolder}</Text>
        </View>

        {folderNotes.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconBox}>
              <Ionicons name="folder-open-outline" size={36} color={theme.blue} />
            </View>
            <Text style={s.emptyTitle}>Bu klasor bos</Text>
            <Text style={s.emptySub}>Bu klasore henuz not eklenmemis</Text>
          </View>
        ) : (
          <FlatList
            key="single"
            data={folderNotes}
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
                  <Text style={s.noteTitle} numberOfLines={1}>{item.title}</Text>
                  {item.favorite && <Ionicons name="star" size={14} color="#f59e0b" />}
                </View>
                <Text style={s.notePreview} numberOfLines={2}>{item.content}</Text>
                <View style={s.noteMeta}>
                  <View style={[s.accessBadge, { backgroundColor: getAccessColor(item.access) + '20' }]}>
                    <Text style={[s.accessText, { color: getAccessColor(item.access) }]}>
                      {getAccessLabel(item.access)}
                    </Text>
                  </View>
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

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Klasörler</Text>
        <Text style={s.sub}>{notes.length} not</Text>
      </View>

      <FlatList
        key="grid"
        data={folders}
        keyExtractor={item => item.name}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const count = notes.filter(n => n.folder === item.name).length;
          return (
            <TouchableOpacity
              style={[s.folderCard, { borderTopColor: item.color }]}
              onPress={() => setSelectedFolder(item.name)}
              activeOpacity={0.75}
            >
              <View style={[s.folderIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={s.folderName}>{item.name}</Text>
              <Text style={s.folderCount}>{count} not</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 54, marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  backText: { color: theme.blue, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5, flex: 1 },
  sub: { fontSize: 13, color: theme.text2, fontWeight: '500' },
  folderCard: { flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderTopWidth: 3, gap: 10 },
  folderIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  folderName: { fontSize: 15, fontWeight: '700', color: theme.text },
  folderCount: { fontSize: 12, color: theme.text2, fontWeight: '500' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 72, height: 72, backgroundColor: theme.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.text2, textAlign: 'center' },
  noteCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  notePreview: { fontSize: 13, color: theme.text2, lineHeight: 20, marginBottom: 10 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  accessBadge: { paddingHorizontal: 8, paddingVertery: 3, borderRadius: 6 },
  accessText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  fileBadge: { backgroundColor: theme.blue + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' },
  fileBadgeText: { fontSize: 9, color: theme.blue, fontWeight: '800', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: theme.blue + '10', color: theme.blue, fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});