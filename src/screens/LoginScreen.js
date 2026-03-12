import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [classCode, setClassCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Email ve sifre bos olamaz!');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      Alert.alert('Hata', 'Sifreler eslesmiyor!');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      Alert.alert('Hata', 'Sifre en az 6 karakter olmali!');
      return;
    }
    // Sinif kodu artık zorunlu değil
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: email,
          classCode: classCode.trim().toUpperCase(),
          createdAt: new Date(),
        });
      }
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        Alert.alert('Hata', 'Email veya sifre yanlis!');
      } else if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Hata', 'Bu email zaten kullaniliyor!');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Hata', 'Gecersiz email adresi!');
      } else {
        Alert.alert('Hata', error.message);
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>NF</Text>
          </View>
          <Text style={styles.appName}>NoteFlow</Text>
          <Text style={styles.appSlogan}>Notlarini akillica yonet</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Giris Yap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Kayit Ol</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Hos Geldin!' : 'Hesap Olustur'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {mode === 'login' ? 'Hesabina giris yap' : 'Yeni bir hesap olustur'}
          </Text>

          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor="#4b5563"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>Sifre</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#4b5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <>
              <Text style={styles.inputLabel}>Sifre Tekrar</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#4b5563"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>
                Sinif Kodu <Text style={styles.optionalText}>(opsiyonel)</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="school-outline" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ornek: MAT101"
                  placeholderTextColor="#4b5563"
                  value={classCode}
                  onChangeText={setClassCode}
                  autoCapitalize="characters"
                />
              </View>
              <Text style={styles.classHint}>
                💡 Daha sonra profil ekranindan da ekleyebilirsin
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Bekleyin...</Text>
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>
                  {mode === 'login' ? 'Giris Yap' : 'Kayit Ol'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login' ? 'Hesabin yok mu?' : 'Zaten hesabin var mi?'}
            </Text>
            <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? ' Kayit ol' : ' Giris yap'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d14' },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(59,130,246,0.10)', top: -80, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.08)', bottom: 100, left: -60 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  logoText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '900', color: '#f1f5f9', letterSpacing: -0.5 },
  appSlogan: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#13131f', borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#ffffff08' },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#13131f', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#ffffff08' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  optionalText: { fontSize: 10, color: '#4b5563', fontWeight: '500', textTransform: 'lowercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1c1c2e', borderRadius: 12, borderWidth: 1, borderColor: '#ffffff10', paddingHorizontal: 14, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#f1f5f9', fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  classHint: { fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 18 },
  button: { backgroundColor: '#3b82f6', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  switchText: { fontSize: 14, color: '#6b7280' },
  switchLink: { fontSize: 14, color: '#3b82f6', fontWeight: '700' },
});