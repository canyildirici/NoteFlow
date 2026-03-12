import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Platform } from 'react-native';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function CollectionsScreen({ navigation, route }) {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionNotes, setCollectionNotes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // Stack üzerinden mi açıldı?
  const isStack = navigation.getState()?.type === 'stack';

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'collections'), (snap) => {
      setCollections(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.userId === auth.currentUser?.uid)
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedCollection) return;
    const unsubscribe = onSnapshot(
      collection(db, 'collections', selectedCollection.id, 'notes'),
      (snap) => setCollectionNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsubscribe;
  }, [selectedCollection]);

  const handleNotePress = async (item) => {
    try {
      const noteDoc = await getDoc(doc(db, 'notes', item.noteId));
      if (noteDoc.exists()) {
        navigation.navigate('NoteDetail', { note: { id: noteDoc.id, ...noteDoc.data() } });
      } else {
        Alert.alert('Hata', 'Not bulunamadi, silinmis olabilir.');
      }
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Hata', 'Koleksiyon adi bos olamaz!'); return; }
    try {
      await addDoc(collection(db, 'collections'), {
        name: newName.trim(),
        description: newDesc.trim(),
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      setNewName('');
      setNewDesc('');
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleDelete = (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Koleksiyonu silmek istediğine emin misin?');
      if (confirmed) deleteDoc(doc(db, 'collections', id));
      return;
    }
    Alert.alert('Koleksiyonu Sil', 'Emin misin?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteDoc(doc(db, 'collections', id)) }
    ]);
  };

  const handleRemoveNote = (noteDocId) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Bu notu koleksiyondan çıkarmak istiyor musun?');
      if (confirmed) deleteDoc(doc(db, 'collections', selectedCollection.id, 'notes', noteDocId));
      return;
    }
    Alert.alert('Notu Cikar', 'Bu notu koleksiyondan cikarmak istiyor musun?', [
      { text: 'Iptal', style: 'cancel' },
      { text: 'Cikar', style: 'destructive', onPress: () => deleteDoc(doc(db, 'collections', selectedCollection.id, 'notes', noteDocId)) }
    ]);
  };

  const handleBack = () => {
    if (selectedCollection) {
      setSelectedCollection(null);
    } else if (isStack) {
      navigation.goBack();
    }
  };

  if (selectedCollection) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleBack} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={theme.blue} />
            <Text style={s.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={s.title} numberOfLines={1}>{selectedCollection.name}</Text>
        </View>

        {collectionNotes.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconBox}>
              <Ionicons name="albums-outline" size={36} color={theme.blue} />
            </View>
            <Text style={s.emptyTitle}>Bu koleksiyon bos</Text>
            <Text style={s.emptySub}>Not detayindan koleksiyona ekleyebilirsin</Text>
          </View>
        ) : (
          <FlatList
            data={collectionNotes}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[s.noteCard, { borderLeftColor: colors[index % colors.length] }]}
                activeOpacity={0.75}
                onPress={() => handleNotePress(item)}
              >
                <View style={s.noteHeader}>
                  <Text style={s.noteTitle} numberOfLines={1}>{item.title}</Text>
                  <TouchableOpacity onPress={() => handleRemoveNote(item.id)} style={s.removeBtn}>
                    <Text style={s.removeBtnText}>Cikar</Text>
                  </TouchableOpacity>
                </View>
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
        {isStack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={theme.blue} />
            <Text style={s.backText}>Geri</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={s.title}>Koleksiyonlar</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {collections.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="albums-outline" size={36} color={theme.blue} />
          </View>
          <Text style={s.emptyTitle}>Henuz koleksiyon yok</Text>
          <Text style={s.emptySub}>+ butonuna basarak koleksiyon olustur</Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[s.collectionCard, { borderLeftColor: colors[index % colors.length] }]}
              onPress={() => setSelectedCollection(item)}
              activeOpacity={0.75}
            >
              <View style={[s.collectionIcon, { backgroundColor: colors[index % colors.length] + '20' }]}>
                <Ionicons name="albums-outline" size={22} color={colors[index % colors.length]} />
              </View>
              <View style={s.collectionInfo}>
                <Text style={s.collectionName}>{item.name}</Text>
                {item.description ? <Text style={s.collectionDesc} numberOfLines={1}>{item.description}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBg} onPress={() => setModalVisible(false)} />
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Yeni Koleksiyon</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Koleksiyon adi..."
              placeholderTextColor={theme.text2}
              value={newName}
              onChangeText={setNewName}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Aciklama (opsiyonel)..."
              placeholderTextColor={theme.text2}
              value={newDesc}
              onChangeText={setNewDesc}
            />
            <TouchableOpacity style={s.modalCreateBtn} onPress={handleCreate}>
              <Text style={s.modalCreateBtnText}>Olustur</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.modalCloseBtnText}>Iptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 54, marginBottom: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.border, marginRight: 12 },
  backText: { color: theme.blue, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', color: theme.text, letterSpacing: -0.5, flex: 1 },
  addBtn: { backgroundColor: theme.blue, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: theme.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 72, height: 72, backgroundColor: theme.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.text2, textAlign: 'center' },
  collectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3, gap: 12 },
  collectionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  collectionInfo: { flex: 1 },
  collectionName: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 2 },
  collectionDesc: { fontSize: 12, color: theme.text2 },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.1)', width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noteCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border, borderLeftWidth: 3 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteTitle: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  removeBtn: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  removeBtnText: { fontSize: 12, color: '#ef4444', fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderWidth: 1, borderColor: theme.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 20 },
  modalInput: { backgroundColor: theme.surface2, borderRadius: 12, padding: 14, color: theme.text, fontSize: 15, borderWidth: 1, borderColor: theme.border, marginBottom: 12 },
  modalCreateBtn: { backgroundColor: theme.blue, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 8 },
  modalCreateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalCloseBtn: { backgroundColor: theme.surface2, borderRadius: 12, padding: 15, alignItems: 'center' },
  modalCloseBtnText: { color: theme.text2, fontSize: 15, fontWeight: '700' },
});