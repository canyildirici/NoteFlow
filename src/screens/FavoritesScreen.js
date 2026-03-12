import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const { theme } = useTheme();
  const s = makeStyles(theme);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(note =>
          note.favorite === true &&
          (note.access !== 'private' || note.userId === auth.currentUser?.uid)
        );
      setFavorites(data);
    });
    return unsubscribe;
  }, []);

  const cardAccents = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Favoriler</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{favorites.length}</Text>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="star-outline" size={36} color="#f59e0b" />
          </View>
          <Text style={s.emptyTitle}>Henuz favori yok</Text>
          <Text style={s.emptySub}>Not detayindan yildiza basarak favoriye ekleyebilirsin</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
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
                <Ionicons name="star" size={16} color="#f59e0b" />
              </View>
              <Text style={s.notePreview} numberOfLines={2}>{item.content}</Text>
              <View style={s.noteMeta}>
                <View style={s.folderBadge}>
                  <Ionicons name="folder-outline" size={11} color={theme.text2} />
                  <Text style={s.folderText}>{item.folder}</Text>
                </View>
                <View style={s.versionBadge}>
                  <Text style={s.versionText}>v{item.version || 1}</Text>
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

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 54, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5 },
  countBadge: { backgroundColor: '#f59e0b20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 14, fontWeight: '800', color: '#f59e0b' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 72, height: 72, backgroundColor: theme.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.text2, textAlign: 'center', paddingHorizontal: 20 },
  noteCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  notePreview: { fontSize: 13, color: theme.text2, lineHeight: 20, marginBottom: 10 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  folderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.surface2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  folderText: { fontSize: 11, color: theme.text2, fontWeight: '500' },
  versionBadge: { backgroundColor: theme.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  versionText: { fontSize: 11, color: theme.blue, fontWeight: '700' },
  fileBadge: { backgroundColor: theme.blue + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  fileBadgeText: { fontSize: 9, color: theme.blue, fontWeight: '800', letterSpacing: 0.5 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: theme.blue + '10', color: theme.blue, fontSize: 10, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});