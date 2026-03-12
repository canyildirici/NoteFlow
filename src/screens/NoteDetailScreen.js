import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Share, Alert, Image, Modal, FlatList, Platform } from 'react-native';
import { db, auth } from '../firebase/config';
import { doc, updateDoc, collection, onSnapshot, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function NoteDetailScreen({ route, navigation }) {
  const { note } = route.params;
  const [collections, setCollections] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useTheme();
  const s = makeStyles(theme);

  useEffect(() => {
    const q = query(collection(db, 'collections'), where('userId', '==', auth.currentUser?.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCollections(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const getAccessColor = (access) => {
    if (access === 'private') return '#ef4444';
    if (access === 'class') return '#f59e0b';
    return '#10b981';
  };

  const getAccessLabel = (access) => {
    if (access === 'private') return 'Ozel';
    if (access === 'class') return 'Sinif';
    return 'Herkese Acik';
  };

  const handleFavorite = async () => {
    try {
      await updateDoc(doc(db, 'notes', note.id), { favorite: !note.favorite });
      Alert.alert(note.favorite ? 'Favoriden cikarildi' : 'Favoriye eklendi');
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        navigator.clipboard?.writeText(`${note.title}\n\n${note.content}`);
        alert('Not panoya kopyalandi!');
        return;
      }
      await Share.share({ message: `${note.title}\n\n${note.content}\n\n— NoteFlow ile paylasildi`, title: note.title });
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bu notu silmek istediğine emin misin?');
      if (confirmed) {
        try {
          await deleteDoc(doc(db, 'notes', note.id));
          navigation.goBack();
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
          await deleteDoc(doc(db, 'notes', note.id));
          navigation.goBack();
        } catch (e) {
          Alert.alert('Hata', e.message);
        }
      }}
    ]);
  };

  const handleGenerateLink = () => {
    const fakeLink = `https://noteflow.app/note/${note.id}`;
    if (Platform.OS === 'web') {
      navigator.clipboard?.writeText(fakeLink);
      alert('Link kopyalandi: ' + fakeLink);
      return;
    }
    Alert.alert('Paylasim Linki', fakeLink, [
      { text: 'Kapat', style: 'cancel' },
      { text: 'Paylas', onPress: () => Share.share({ message: fakeLink }) }
    ]);
  };

  const handleAddToCollection = async (collectionId, collectionName) => {
    try {
      await addDoc(collection(db, 'collections', collectionId, 'notes'), {
        noteId: note.id, title: note.title, addedAt: new Date(),
      });
      setModalVisible(false);
      Alert.alert('Basarili', `"${collectionName}" koleksiyonuna eklendi!`);
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>Geri</Text>
        </TouchableOpacity>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={handleFavorite} style={s.iconBtn}>
            <Ionicons name={note.favorite ? 'star' : 'star-outline'} size={18} color={note.favorite ? '#f59e0b' : theme.text2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={s.iconBtn}>
            <Ionicons name="share-outline" size={18} color={theme.text2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={[s.iconBtn, { borderColor: 'rgba(239,68,68,0.3)' }]}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.card}>
        <View style={s.metaRow}>
          <View style={[s.accessBadge, { backgroundColor: getAccessColor(note.access) + '20' }]}>
            <Text style={[s.accessText, { color: getAccessColor(note.access) }]}>{getAccessLabel(note.access)}</Text>
          </View>
          <Text style={s.metaText}>{note.folder}</Text>
          <View style={s.versionBadge}>
            <Text style={s.versionText}>v{note.version || 1}</Text>
          </View>
        </View>

        <Text style={s.title}>{note.title}</Text>

        {note.tags?.length > 0 && (
          <View style={s.tagRow}>
            {note.tags.map((tag, i) => <Text key={i} style={s.tag}>#{tag}</Text>)}
          </View>
        )}

        {note.fileType === 'image' && note.fileUri && (
          <Image source={{ uri: note.fileUri }} style={s.image} resizeMode="contain" />
        )}

        {note.fileType === 'pdf' && note.fileUri && (
          <TouchableOpacity style={s.fileBtn} onPress={() => navigation.navigate('PDFViewer', { uri: note.fileUri, title: note.title })}>
            <Ionicons name="document-text-outline" size={18} color={theme.blue} />
            <Text style={s.fileBtnText}>PDF Goruntule</Text>
          </TouchableOpacity>
        )}

        <View style={s.divider} />
        <Text style={s.content}>{note.content}</Text>

        <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('EditNote', { note })}>
          <Ionicons name="create-outline" size={16} color={theme.blue} />
          <Text style={s.editBtnText}>Notu Duzenle</Text>
        </TouchableOpacity>
      </View>

      <View style={s.actionGrid}>
        <TouchableOpacity style={s.actionBtn} onPress={() => navigation.navigate('Comments', { noteId: note.id, noteTitle: note.title })}>
          <Ionicons name="chatbubble-outline" size={18} color={theme.blue} />
          <Text style={s.actionBtnText}>Yorumlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: '#10b98130' }]} onPress={handleGenerateLink}>
          <Ionicons name="link-outline" size={18} color="#10b981" />
          <Text style={[s.actionBtnText, { color: '#10b981' }]}>Link Uret</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: '#8b5cf630' }]} onPress={() => setModalVisible(true)}>
          <Ionicons name="albums-outline" size={18} color="#8b5cf6" />
          <Text style={[s.actionBtnText, { color: '#8b5cf6' }]}>Koleksiyona Ekle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { borderColor: '#f59e0b30' }]} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color="#f59e0b" />
          <Text style={[s.actionBtnText, { color: '#f59e0b' }]}>Paylas</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} onPress={() => setModalVisible(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Koleksiyon Sec</Text>
            {collections.length === 0 ? (
              <View style={s.modalEmpty}>
                <Text style={s.modalEmptyText}>Henuz koleksiyon yok</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); navigation.navigate('Collections'); }}>
                  <Text style={s.modalEmptyLink}>Koleksiyon olustur</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={collections}
                keyExtractor={item => item.id}
                style={{ maxHeight: 300 }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity style={s.collectionItem} onPress={() => handleAddToCollection(item.id, item.name)}>
                    <View style={[s.collectionDot, { backgroundColor: colors[index % colors.length] }]} />
                    <Text style={s.collectionItemName}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.text2} />
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalCloseBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 54, marginBottom: 24 },
  backBtn: { backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  backText: { color: theme.blue, fontSize: 14, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { backgroundColor: theme.surface, borderRadius: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  card: { backgroundColor: theme.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.border },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' },
  accessBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  accessText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metaText: { fontSize: 12, color: theme.text2, fontWeight: '500' },
  versionBadge: { backgroundColor: theme.blue + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  versionText: { fontSize: 11, color: theme.blue, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 14, lineHeight: 30, letterSpacing: -0.3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { backgroundColor: theme.blue + '10', color: theme.blue, fontSize: 11, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  image: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16 },
  fileBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.blue + '15', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.blue + '30', justifyContent: 'center' },
  fileBtnText: { color: theme.blue, fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: theme.border, marginBottom: 16 },
  content: { fontSize: 15, color: theme.text2, lineHeight: 26 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.blue + '15', borderRadius: 10, padding: 12, marginTop: 16, justifyContent: 'center', borderWidth: 1, borderColor: theme.blue + '30' },
  editBtnText: { color: theme.blue, fontSize: 13, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, minWidth: '45%', backgroundColor: theme.blue + '15', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.blue + '30', gap: 6 },
  actionBtnText: { color: theme.blue, fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 20 },
  modalEmpty: { alignItems: 'center', padding: 20 },
  modalEmptyText: { color: theme.text2, fontSize: 14, marginBottom: 10 },
  modalEmptyLink: { color: theme.blue, fontSize: 14, fontWeight: '700' },
  collectionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: theme.surface2, borderRadius: 12, marginBottom: 8, gap: 12 },
  collectionDot: { width: 10, height: 10, borderRadius: 5 },
  collectionItemName: { flex: 1, color: theme.text, fontSize: 15, fontWeight: '600' },
  modalCloseBtn: { backgroundColor: theme.surface2, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  modalCloseBtnText: { color: theme.text2, fontSize: 14, fontWeight: '700' },
});