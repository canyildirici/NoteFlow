import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function EditNoteScreen({ route, navigation }) {
  const { note } = route.params;
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [folder, setFolder] = useState(note.folder);
  const [access, setAccess] = useState(note.access);
  const [loading, setLoading] = useState(false);

  const defaultFolders = ['Genel', 'Matematik', 'Fizik', 'Kimya', 'Tarih'];

  // Notun mevcut klasörü varsayılanlarda yoksa listeye ekle
  const initialFolders = [
    { name: 'Genel', icon: 'document-outline' },
    { name: 'Matematik', icon: 'calculator-outline' },
    { name: 'Fizik', icon: 'flask-outline' },
    { name: 'Kimya', icon: 'eyedrop-outline' },
    { name: 'Tarih', icon: 'book-outline' },
    ...(!defaultFolders.includes(note.folder) && note.folder
      ? [{ name: note.folder, icon: 'folder-outline' }]
      : []),
  ];

  const [folders, setFolders] = useState(initialFolders);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { theme } = useTheme();
  const s = makeStyles(theme);

  const accessOptions = [
    { value: 'private', label: 'Ozel', desc: 'Sadece sen', color: '#ef4444' },
    { value: 'class', label: 'Sinif', desc: 'Giris yapanlar', color: '#f59e0b' },
    { value: 'link', label: 'Acik', desc: 'Herkes', color: '#10b981' },
  ];

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (folders.find(f => f.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Hata', 'Bu klasor zaten mevcut!');
      return;
    }
    setFolders([...folders, { name, icon: 'folder-outline' }]);
    setFolder(name);
    setNewFolderName('');
    setShowFolderInput(false);
  };

  const removeCustomFolder = (name) => {
    if (defaultFolders.includes(name)) return;
    setFolders(folders.filter(f => f.name !== name));
    if (folder === name) setFolder('Genel');
  };

  const handleUpdate = async () => {
    if (!title.trim()) { Alert.alert('Hata', 'Baslik bos olamaz!'); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, 'notes', note.id, 'versions'), {
        title: note.title,
        content: note.content,
        folder: note.folder,
        access: note.access,
        version: note.version || 1,
        savedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'notes', note.id), {
        title: title.trim(),
        content: content.trim(),
        folder,
        access,
        version: (note.version || 1) + 1,
        updatedAt: serverTimestamp(),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>Iptal</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notu Duzenle</Text>
        <TouchableOpacity onPress={handleUpdate} style={s.saveBtn} disabled={loading}>
          <Text style={s.saveBtnText}>{loading ? '...' : 'Guncelle'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.versionBanner}>
        <Ionicons name="time-outline" size={16} color={theme.blue} />
        <Text style={s.versionText}>
          Mevcut: v{note.version || 1} → Yeni: v{(note.version || 1) + 1}
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Baslik</Text>
        <TextInput
          style={s.input}
          placeholder="Not basligi..."
          placeholderTextColor={theme.text2}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={s.label}>Icerik</Text>
        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Not icerigi..."
          placeholderTextColor={theme.text2}
          value={content}
          onChangeText={setContent}
          multiline
        />

        <Text style={s.label}>Klasor</Text>
        <View style={s.chipRow}>
          {folders.map(f => (
            <TouchableOpacity
              key={f.name}
              style={[s.chip, folder === f.name && s.chipActive]}
              onPress={() => setFolder(f.name)}
            >
              <Ionicons name={f.icon} size={14} color={folder === f.name ? '#fff' : theme.text2} />
              <Text style={[s.chipText, folder === f.name && s.chipTextActive]}>{f.name}</Text>
              {!defaultFolders.includes(f.name) && (
                <TouchableOpacity onPress={() => removeCustomFolder(f.name)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close" size={12} color={folder === f.name ? '#fff' : theme.text2} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}

          {/* Yeni klasör ekle butonu */}
          <TouchableOpacity
            style={[s.chip, showFolderInput && s.chipActive]}
            onPress={() => setShowFolderInput(!showFolderInput)}
          >
            <Ionicons name="add" size={14} color={showFolderInput ? '#fff' : theme.text2} />
            <Text style={[s.chipText, showFolderInput && s.chipTextActive]}>Yeni</Text>
          </TouchableOpacity>
        </View>

        {/* Yeni klasör input alanı */}
        {showFolderInput && (
          <View style={s.folderInputRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Klasor adi..."
              placeholderTextColor={theme.text2}
              value={newFolderName}
              onChangeText={setNewFolderName}
              onSubmitEditing={addFolder}
              returnKeyType="done"
              autoFocus
            />
            <TouchableOpacity style={s.folderAddBtn} onPress={addFolder}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.folderCancelBtn} onPress={() => { setShowFolderInput(false); setNewFolderName(''); }}>
              <Ionicons name="close" size={20} color={theme.text2} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.label}>Erisim Izni</Text>
        <View style={s.accessRow}>
          {accessOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.accessOpt, access === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '15' }]}
              onPress={() => setAccess(opt.value)}
            >
              <Text style={[s.accessLabel, access === opt.value && { color: opt.color }]}>{opt.label}</Text>
              <Text style={s.accessDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 54, marginBottom: 16 },
  backBtn: { backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  backText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  saveBtn: { backgroundColor: theme.blue, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  versionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.blue + '15', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: theme.blue + '30' },
  versionText: { fontSize: 13, color: theme.blue, fontWeight: '700' },
  card: { backgroundColor: theme.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border },
  label: { fontSize: 11, fontWeight: '700', color: theme.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.surface2, borderRadius: 12, padding: 14, color: theme.text, fontSize: 15, borderWidth: 1, borderColor: theme.border, marginBottom: 4 },
  textarea: { height: 140, textAlignVertical: 'top', lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border },
  chipActive: { backgroundColor: theme.blue, borderColor: theme.blue },
  chipText: { fontSize: 13, color: theme.text2, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  folderInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  folderAddBtn: { backgroundColor: theme.blue, borderRadius: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  folderCancelBtn: { backgroundColor: theme.surface2, borderRadius: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  accessRow: { flexDirection: 'row', gap: 8 },
  accessOpt: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.surface2, alignItems: 'center' },
  accessLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 2 },
  accessDesc: { fontSize: 10, color: theme.text2 },
});