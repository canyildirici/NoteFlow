import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState([]);
  const [results, setResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState('hepsi');
  const [userClassCode, setUserClassCode] = useState(null); // DEĞİŞTİ: '' yerine null
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const normalize = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/i̇/g, 'i')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'i')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'c');
  };

  const filters = [
    { key: 'hepsi', label: 'Hepsi' },
    { key: 'private', label: 'Ozel' },
    { key: 'class', label: 'Sinif' },
    { key: 'link', label: 'Acik' },
  ];

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

  useEffect(() => {
    let filtered = notes;
    if (activeFilter !== 'hepsi') {
      filtered = filtered.filter(n => n.access === activeFilter);
    }
    if (!query.trim()) {
      setResults(activeFilter !== 'hepsi' ? filtered : []);
      return;
    }
    const q = normalize(query);
    setResults(filtered.filter(n =>
      normalize(n.title).includes(q) ||
      normalize(n.content).includes(q) ||
      n.tags?.some(t => normalize(t).includes(q)) ||
      normalize(n.folder).includes(q)
    ));
  }, [query, notes, activeFilter]);

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

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Ara</Text>
        <Text style={s.sub}>{notes.length} not mevcut</Text>
      </View>

      <View style={s.searchBox}>
        <Ionicons name="search-outline" size={20} color={theme.text2} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Not, etiket, klasor ara..."
          placeholderTextColor={theme.text2}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.text2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, activeFilter === f.key && s.filterBtnActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[s.filterText, activeFilter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {query.length === 0 && activeFilter === 'hepsi' ? (
        <FlatList
          data={[]}
          keyExtractor={() => 'empty'}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="search-outline" size={36} color={theme.blue} />
              </View>
              <Text style={s.emptyTitle}>Notlarini Ara</Text>
              <Text style={s.emptySub}>Baslik, icerik, etiket veya klasore gore ara</Text>
              <View style={s.tipsCard}>
                <Text style={s.tipsTitle}>💡 Arama İpuçları</Text>
                <View style={s.tipRow}>
                  <View style={[s.tipIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                    <Ionicons name="text-outline" size={16} color="#3b82f6" />
                  </View>
                  <View style={s.tipInfo}>
                    <Text style={s.tipLabel}>Türkçe Destek</Text>
                    <Text style={s.tipDesc}>İ, ş, ğ, ü, ö, ç karakterleri ile arama yapabilirsin</Text>
                  </View>
                </View>
                <View style={s.tipDivider} />
                <View style={s.tipRow}>
                  <View style={[s.tipIcon, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                    <Ionicons name="pricetag-outline" size={16} color="#8b5cf6" />
                  </View>
                  <View style={s.tipInfo}>
                    <Text style={s.tipLabel}>Etiket ile Ara</Text>
                    <Text style={s.tipDesc}>matematik, fizik gibi etiket adlarını yaz</Text>
                  </View>
                </View>
                <View style={s.tipDivider} />
                <View style={s.tipRow}>
                  <View style={[s.tipIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                    <Ionicons name="filter-outline" size={16} color="#10b981" />
                  </View>
                  <View style={s.tipInfo}>
                    <Text style={s.tipLabel}>Filtrele</Text>
                    <Text style={s.tipDesc}>Üstteki butonlarla Özel, Sınıf veya Açık notları filtrele</Text>
                  </View>
                </View>
                <View style={s.tipDivider} />
                <View style={s.tipRow}>
                  <View style={[s.tipIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                    <Ionicons name="folder-outline" size={16} color="#f59e0b" />
                  </View>
                  <View style={s.tipInfo}>
                    <Text style={s.tipLabel}>Klasör ile Ara</Text>
                    <Text style={s.tipDesc}>Matematik, Fizik, Kimya, Tarih, Genel yazarak ara</Text>
                  </View>
                </View>
              </View>
            </View>
          }
        />
      ) : results.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="sad-outline" size={36} color={theme.text2} />
          </View>
          <Text style={s.emptyTitle}>Sonuc bulunamadi</Text>
          <Text style={s.emptySub}>"{query}" icin sonuc yok</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <Text style={s.resultCount}>{results.length} sonuc bulundu</Text>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[s.noteCard, { borderLeftColor: cardAccents[index % cardAccents.length] }]}
              onPress={() => navigation.navigate('NoteDetail', { note: item })}
              activeOpacity={0.75}
            >
              <View style={s.noteHeader}>
                <Text style={s.noteTitle} numberOfLines={1}>{item.title}</Text>
                <View style={s.noteRight}>
                  {item.favorite && <Ionicons name="star" size={14} color="#f59e0b" />}
                  <View style={[s.accessBadge, { backgroundColor: getAccessColor(item.access) + '20' }]}>
                    <Text style={[s.accessText, { color: getAccessColor(item.access) }]}>
                      {getAccessLabel(item.access)}
                    </Text>
                  </View>
                </View>
              </View>
              {item.content ? (
                <Text style={s.notePreview} numberOfLines={2}>{item.content}</Text>
              ) : null}
              <View style={s.noteMeta}>
                <View style={s.folderBadge}>
                  <Ionicons name="folder-outline" size={11} color={theme.text2} />
                  <Text style={s.folderText}>{item.folder}</Text>
                </View>
                <Text style={s.versionText}>v{item.version || 1}</Text>
                {item.fileType && (
                  <View style={s.fileBadge}>
                    <Text style={s.fileBadgeText}>{item.fileType.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              {item.tags?.length > 0 && (
                <View style={s.tagRow}>
                  {item.tags.slice(0, 4).map((tag, i) => (
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
  header: { marginTop: 54, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: theme.text2, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, color: theme.text, fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  filterBtnActive: { backgroundColor: theme.blue, borderColor: theme.blue },
  filterText: { fontSize: 13, color: theme.text2, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 20 },
  emptyIconBox: { width: 72, height: 72, backgroundColor: theme.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.text2, textAlign: 'center', marginBottom: 24 },
  tipsCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.border, width: '100%' },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: theme.text, marginBottom: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  tipIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipInfo: { flex: 1 },
  tipLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 },
  tipDesc: { fontSize: 12, color: theme.text2, lineHeight: 18 },
  tipDivider: { height: 1, backgroundColor: theme.border, marginVertical: 10 },
  resultCount: { fontSize: 12, color: theme.text2, fontWeight: '600', marginBottom: 12 },
  noteCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  noteRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accessBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  accessText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  notePreview: { fontSize: 13, color: theme.text2, lineHeight: 20, marginBottom: 10 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  folderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.surface2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  folderText: { fontSize: 11, color: theme.text2, fontWeight: '500' },
  versionText: { fontSize: 11, color: theme.blue, fontWeight: '600' },
  fileBadge: { backgroundColor: theme.blue + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' },
  fileBadgeText: { fontSize: 9, color: theme.blue, fontWeight: '800', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: theme.blue + '10', color: theme.blue, fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});