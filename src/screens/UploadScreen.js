import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

const CLOUD_NAME = 'dsmut35gc';
const UPLOAD_PRESET = 'noteflow_preset';

const DEFAULT_FOLDERS = ['Genel', 'Matematik', 'Fizik', 'Kimya', 'Tarih'];

const ACCESS_OPTIONS = [
  { key: 'class', label: 'Sinif', color: '#f59e0b', icon: 'people-outline' },
  { key: 'private', label: 'Ozel', color: '#ef4444', icon: 'lock-closed-outline' },
  { key: 'link', label: 'Acik', color: '#10b981', icon: 'globe-outline' },
];

const uploadToCloudinary = async (fileUri, fileType, fileName) => {
  const formData = new FormData();
  const resourceType = fileType === 'pdf' ? 'raw' : 'image';

  if (Platform.OS === 'web') {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', {
      uri: fileUri,
      type: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
      name: fileName,
    });
  }

  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
};

export default function UploadScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState('Genel');
  const [selectedAccess, setSelectedAccess] = useState('class');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [userClassCode, setUserClassCode] = useState('');
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { theme } = useTheme();
  const s = makeStyles(theme);

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

  const addFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (folders.find(f => f.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Hata', 'Bu klasor zaten mevcut!');
      return;
    }
    setFolders([...folders, name]);
    setSelectedFolder(name);
    setNewFolderName('');
    setShowFolderInput(false);
  };

  const removeCustomFolder = (name) => {
    if (DEFAULT_FOLDERS.includes(name)) return;
    setFolders(folders.filter(f => f !== name));
    if (selectedFolder === name) setSelectedFolder('Genel');
  };

  const pickPDF = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setSelectedFile({ name: file.name, uri: ev.target.result, type: 'pdf', size: file.size });
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedFile({ name: asset.name, uri: asset.uri, type: 'pdf', size: asset.size });
      }
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            setSelectedFile({ name: file.name, uri: ev.target.result, type: 'image', size: file.size });
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Izin gerekli'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedFile({ name: asset.fileName || 'Fotograf.jpg', uri: asset.uri, type: 'image', size: asset.fileSize });
      }
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Hata', 'Baslik bos olamaz!'); return; }
    if (!selectedFile) { Alert.alert('Hata', 'Dosya secmelisin!'); return; }
    if (selectedAccess === 'class' && !userClassCode) {
      Alert.alert('Hata', 'Sinif dosyasi yuklemek icin sinif kodunuz olmali!');
      return;
    }
    setLoading(true);
    setProgress('Dosya yukleniyor...');
    try {
      const cloudUrl = await uploadToCloudinary(selectedFile.uri, selectedFile.type, selectedFile.name);
      setProgress('Not kaydediliyor...');
      await addDoc(collection(db, 'notes'), {
        title: title.trim(),
        content: '',
        folder: selectedFolder,
        access: selectedAccess,
        tags: [],
        userId: auth.currentUser?.uid,
        classCode: selectedAccess === 'class' ? userClassCode : '',
        version: 1,
        favorite: false,
        fileType: selectedFile.type,
        fileName: selectedFile.name,
        fileUri: cloudUrl,
        fileSize: selectedFile.size,
        createdAt: serverTimestamp(),
      });
      setProgress('');
      setLoading(false);
      Alert.alert('Basarili', 'Dosya yuklendi!');
      navigation.goBack();
    } catch (e) {
      setLoading(false);
      setProgress('');
      Alert.alert('Hata', e.message);
    }
  };

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} disabled={loading}>
          <Text style={s.backText}>Iptal</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dosya Yukle</Text>
        <TouchableOpacity onPress={handleSave} style={s.saveBtn} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.progressCard}>
          <ActivityIndicator size="small" color={theme.blue} />
          <Text style={s.progressText}>{progress}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Baslik</Text>
        <TextInput
          style={s.input}
          placeholder="Dosya basligi..."
          placeholderTextColor={theme.text2}
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />

        <Text style={s.label}>Klasor</Text>
        <View style={s.optionRow}>
          {folders.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.optionBtn, selectedFolder === f && s.optionBtnActive]}
              onPress={() => setSelectedFolder(f)}
            >
              <Text style={[s.optionText, selectedFolder === f && s.optionTextActive]}>{f}</Text>
              {!DEFAULT_FOLDERS.includes(f) && (
                <TouchableOpacity onPress={() => removeCustomFolder(f)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close" size={11} color={selectedFolder === f ? '#fff' : theme.text2} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}

          {/* Yeni klasör ekle butonu */}
          <TouchableOpacity
            style={[s.optionBtn, showFolderInput && s.optionBtnActive]}
            onPress={() => setShowFolderInput(!showFolderInput)}
          >
            <Ionicons name="add" size={14} color={showFolderInput ? '#fff' : theme.text2} />
            <Text style={[s.optionText, showFolderInput && s.optionTextActive, { marginLeft: 4 }]}>Yeni</Text>
          </TouchableOpacity>
        </View>

        {/* Yeni klasör input */}
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

        <Text style={s.label}>Erisim</Text>
        {userClassCode ? (
          <View style={s.classInfoRow}>
            <Ionicons name="school-outline" size={14} color="#f59e0b" />
            <Text style={s.classInfoText}>Sinif Kodun: {userClassCode}</Text>
          </View>
        ) : (
          <View style={s.classInfoRow}>
            <Ionicons name="warning-outline" size={14} color="#ef4444" />
            <Text style={[s.classInfoText, { color: '#ef4444' }]}>Sinif kodun yok, sinif dosyasi yukleyemezsin</Text>
          </View>
        )}
        <View style={s.accessRow}>
          {ACCESS_OPTIONS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[s.accessBtn, selectedAccess === a.key && { backgroundColor: a.color + '20', borderColor: a.color }]}
              onPress={() => setSelectedAccess(a.key)}
            >
              <Ionicons name={a.icon} size={16} color={selectedAccess === a.key ? a.color : theme.text2} />
              <Text style={[s.accessText, selectedAccess === a.key && { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Dosya Sec</Text>
        <View style={s.btnRow}>
          <TouchableOpacity style={s.fileBtn} onPress={pickPDF} disabled={loading}>
            <View style={[s.fileBtnIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="document-text-outline" size={28} color="#ef4444" />
            </View>
            <Text style={s.fileBtnLabel}>PDF Sec</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.fileBtn} onPress={pickImage} disabled={loading}>
            <View style={[s.fileBtnIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Ionicons name="image-outline" size={28} color="#10b981" />
            </View>
            <Text style={s.fileBtnLabel}>Fotograf Sec</Text>
          </TouchableOpacity>
        </View>

        {selectedFile && (
          <View style={s.selectedFile}>
            <View style={[s.selectedIcon, { backgroundColor: selectedFile.type === 'pdf' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }]}>
              <Ionicons name={selectedFile.type === 'pdf' ? 'document-text' : 'image'} size={24} color={selectedFile.type === 'pdf' ? '#ef4444' : '#10b981'} />
            </View>
            <View style={s.selectedInfo}>
              <Text style={s.selectedName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={s.selectedSize}>{selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : selectedFile.type.toUpperCase()}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFile(null)} style={s.removeBtn} disabled={loading}>
              <Ionicons name="close" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 54, marginBottom: 24 },
  backBtn: { backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  backText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  saveBtn: { backgroundColor: theme.blue, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  progressText: { fontSize: 14, color: theme.text, fontWeight: '600' },
  card: { backgroundColor: theme.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.border },
  label: { fontSize: 11, fontWeight: '700', color: theme.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: theme.surface2, borderRadius: 12, padding: 14, color: theme.text, fontSize: 15, borderWidth: 1, borderColor: theme.border },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border },
  optionBtnActive: { backgroundColor: theme.blue, borderColor: theme.blue },
  optionText: { fontSize: 13, color: theme.text2, fontWeight: '600' },
  optionTextActive: { color: '#fff' },
  folderInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  folderAddBtn: { backgroundColor: theme.blue, borderRadius: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  folderCancelBtn: { backgroundColor: theme.surface2, borderRadius: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  classInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, backgroundColor: theme.surface2, padding: 10, borderRadius: 10 },
  classInfoText: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  accessRow: { flexDirection: 'row', gap: 8 },
  accessBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.border },
  accessText: { fontSize: 12, color: theme.text2, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12 },
  fileBtn: { flex: 1, backgroundColor: theme.surface2, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.border, gap: 10 },
  fileBtnIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  fileBtnLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
  selectedFile: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface2, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: theme.border, gap: 12 },
  selectedIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 },
  selectedSize: { fontSize: 12, color: theme.text2 },
  removeBtn: { backgroundColor: 'rgba(239,68,68,0.1)', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});