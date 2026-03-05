import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b' };

const STEPS = ['Account', 'Farm Details', 'Bank'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [account, setAccount] = useState({ name: '', email: '', password: '', phone: '' });
  const [farm, setFarm] = useState({ address: '', district: '', state: '', 'farm.location': '', 'farm.totalLandArea': '', 'farm.soilType': '', 'farm.irrigationAvailable': false, 'farm.cropCapacity': '' });
  const [bank, setBank] = useState({ 'bank.bankName': '', 'bank.accountNumber': '', 'bank.ifscCode': '' });

  const handleAccountStep = async () => {
    if (!account.name || !account.email || !account.password || !account.phone) {
      Alert.alert('Error', 'Please fill all account fields'); return;
    }
    setLoading(true);
    try {
      await register({ ...account, role: 'farmer' });
      setStep(1);
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleFarmStep = async () => {
    setLoading(true);
    try {
      const payload = {
        address: farm.address,
        district: farm.district,
        state: farm.state,
        farm: {
          location: farm['farm.location'],
          totalLandArea: Number(farm['farm.totalLandArea']),
          soilType: farm['farm.soilType'],
          cropCapacity: Number(farm['farm.cropCapacity']),
        },
      };
      await api.put('/farmers/profile', payload);
      setStep(2);
    } catch (err) {
      Alert.alert('Error', 'Failed to save farm details');
    } finally {
      setLoading(false);
    }
  };

  const handleBankStep = async () => {
    setLoading(true);
    try {
      await api.put('/farmers/profile', {
        bank: {
          bankName: bank['bank.bankName'],
          accountNumber: bank['bank.accountNumber'],
          ifscCode: bank['bank.ifscCode'],
        },
      });
      Alert.alert('Success!', 'Your farmer account is ready.', [{ text: 'Go to App', style: 'default' }]);
    } catch (err) {
      Alert.alert('Error', 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry }) => (
    <View style={s.formGroup}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} placeholder={placeholder || ''} placeholderTextColor={C.muted}
        value={value} onChangeText={onChangeText} keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry} autoCapitalize="none" />
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>🌾</Text>
          <Text style={s.appName}>AgriLink</Text>
          <Text style={s.tagline}>Farmer Registration</Text>
        </View>

        {/* Step indicator */}
        <View style={s.steps}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <View style={s.stepItem}>
                <View style={[s.stepNum, i <= step && s.stepActive]}>
                  <Text style={[s.stepNumText, i <= step && s.stepActiveText]}>{i < step ? '✓' : i + 1}</Text>
                </View>
                <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={[s.stepLine, i < step && s.stepLineDone]} />}
            </React.Fragment>
          ))}
        </View>

        <View style={s.card}>
          {step === 0 && (
            <>
              <Text style={s.title}>Personal Details</Text>
              <InputField label="Full Name" value={account.name} onChangeText={v => setAccount(a => ({ ...a, name: v }))} placeholder="Your name" />
              <InputField label="Phone" value={account.phone} onChangeText={v => setAccount(a => ({ ...a, phone: v }))} placeholder="+91 90000 00000" keyboardType="phone-pad" />
              <InputField label="Email" value={account.email} onChangeText={v => setAccount(a => ({ ...a, email: v }))} placeholder="farmer@example.com" keyboardType="email-address" />
              <InputField label="Password" value={account.password} onChangeText={v => setAccount(a => ({ ...a, password: v }))} placeholder="Min 6 characters" secureTextEntry />
              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleAccountStep} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue →</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={s.title}>Farm Information</Text>
              <InputField label="Address" value={farm.address} onChangeText={v => setFarm(f => ({ ...f, address: v }))} placeholder="Street address" />
              <View style={s.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <InputField label="District" value={farm.district} onChangeText={v => setFarm(f => ({ ...f, district: v }))} placeholder="District" />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="State" value={farm.state} onChangeText={v => setFarm(f => ({ ...f, state: v }))} placeholder="State" />
                </View>
              </View>
              <InputField label="Farm Location" value={farm['farm.location']} onChangeText={v => setFarm(f => ({ ...f, 'farm.location': v }))} placeholder="Village / GPS coords" />
              <View style={s.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <InputField label="Land Area (acres)" value={farm['farm.totalLandArea']} onChangeText={v => setFarm(f => ({ ...f, 'farm.totalLandArea': v }))} keyboardType="numeric" placeholder="e.g., 5.5" />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="Capacity (quintals)" value={farm['farm.cropCapacity']} onChangeText={v => setFarm(f => ({ ...f, 'farm.cropCapacity': v }))} keyboardType="numeric" placeholder="e.g., 200" />
                </View>
              </View>
              <InputField label="Soil Type" value={farm['farm.soilType']} onChangeText={v => setFarm(f => ({ ...f, 'farm.soilType': v }))} placeholder="e.g., Red laterite, Black cotton" />
              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleFarmStep} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue →</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={s.title}>Bank Details</Text>
              <InputField label="Bank Name" value={bank['bank.bankName']} onChangeText={v => setBank(b => ({ ...b, 'bank.bankName': v }))} placeholder="e.g., State Bank of India" />
              <InputField label="Account Number" value={bank['bank.accountNumber']} onChangeText={v => setBank(b => ({ ...b, 'bank.accountNumber': v }))} keyboardType="numeric" placeholder="Account number" />
              <InputField label="IFSC Code" value={bank['bank.ifscCode']} onChangeText={v => setBank(b => ({ ...b, 'bank.ifscCode': v }))} placeholder="e.g., SBIN0001234" />
              <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleBankStep} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Complete Registration</Text>}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.linkBtn}>
            <Text style={s.linkText}>Already have an account? <Text style={{ color: C.primary }}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 20, paddingTop: 48 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 40 },
  appName: { fontSize: 24, fontWeight: '800', color: C.primary, marginTop: 4 },
  tagline: { fontSize: 13, color: C.muted },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepNum: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.dim, alignItems: 'center', justifyContent: 'center' },
  stepActive: { borderColor: C.primary, backgroundColor: 'rgba(22,163,74,0.1)' },
  stepNumText: { fontSize: 12, fontWeight: '700', color: C.dim },
  stepActiveText: { color: C.primary },
  stepLabel: { fontSize: 10, color: C.dim, marginTop: 2 },
  stepLabelActive: { color: C.primary, fontWeight: '600' },
  stepLine: { width: 28, height: 2, backgroundColor: C.border, marginHorizontal: 4, marginBottom: 14 },
  stepLineDone: { backgroundColor: C.primary },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  title: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 16 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '600', color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 11, color: C.text, fontSize: 14 },
  row: { flexDirection: 'row' },
  btn: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  btnPrimary: { backgroundColor: C.primary },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: C.muted, fontSize: 13 },
});
