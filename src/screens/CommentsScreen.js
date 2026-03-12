import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';

export default function CommentsScreen({ route, navigation }) {
  const { noteId, noteTitle } = route.params;
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const s = makeStyles(theme);

  useEffect(() => {
    const q = query(collection(db, 'notes', noteId, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [noteId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'notes', noteId, 'comments'), {
        text: text.trim(),
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const isOwn = (comment) => comment.userId === auth.currentUser?.uid;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={theme.blue} />
          <Text style={s.backText}>Geri</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>Yorumlar</Text>
          <Text style={s.headerSub} numberOfLines={1}>{noteTitle}</Text>
        </View>
      </View>

      {comments.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconBox}>
            <Ionicons name="chatbubble-outline" size={36} color={theme.blue} />
          </View>
          <Text style={s.emptyTitle}>Henuz yorum yok</Text>
          <Text style={s.emptySub}>Ilk yorumu sen yap!</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={[s.commentBubble, isOwn(item) ? s.ownBubble : s.otherBubble]}>
              {!isOwn(item) && (
                <Text style={s.commentUser}>{item.userEmail?.split('@')[0]}</Text>
              )}
              <Text style={[s.commentText, isOwn(item) && { color: '#fff' }]}>{item.text}</Text>
            </View>
          )}
        />
      )}

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Yorum yaz..."
          placeholderTextColor={theme.text2}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={loading || !text.trim()}>
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: theme.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: theme.border },
  backText: { color: theme.blue, fontSize: 14, fontWeight: '600' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  headerSub: { fontSize: 12, color: theme.text2, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconBox: { width: 72, height: 72, backgroundColor: theme.surface, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.text2 },
  commentBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  ownBubble: { alignSelf: 'flex-end', backgroundColor: theme.blue, borderBottomRightRadius: 4 },
  otherBubble: { alignSelf: 'flex-start', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderBottomLeftRadius: 4 },
  commentUser: { fontSize: 11, fontWeight: '700', color: theme.blue, marginBottom: 4 },
  commentText: { fontSize: 14, color: theme.text, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surface },
  input: { flex: 1, backgroundColor: theme.surface2, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: theme.text, fontSize: 14, borderWidth: 1, borderColor: theme.border, maxHeight: 100 },
  sendBtn: { backgroundColor: theme.blue, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});