import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', danger: '#ef4444' };

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'farmer') {
        Alert.alert('Access Denied', 'This app is for farmers only. Use the web dashboard for buyer access.');
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>🌾</Text>
          <Text style={s.appName}>AgriLink</Text>
          <Text style={s.tagline}>Farmer Portal</Text>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your farmer account</Text>

          <View style={s.formGroup}>
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} placeholder="farmer@example.com" placeholderTextColor={C.muted}
              keyboardType="email-address" autoCapitalize="none" value={form.email}
              onChangeText={v => setForm(f => ({ ...f, email: v }))} />
          </View>
          <View style={s.formGroup}>
            <Text style={s.label}>Password</Text>
            <TextInput style={s.input} placeholder="Your password" placeholderTextColor={C.muted}
              secureTextEntry value={form.password}
              onChangeText={v => setForm(f => ({ ...f, password: v }))} />
          </View>

          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.linkBtn}>
            <Text style={s.linkText}>Don't have an account? <Text style={{ color: C.primary, fontWeight: '700' }}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56 },
  appName: { fontSize: 32, fontWeight: '800', color: C.primary, marginTop: 8 },
  tagline: { fontSize: 14, color: C.muted, marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.muted, marginBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, fontSize: 15 },
  btn: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.primary },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: C.muted, fontSize: 14 },
});
