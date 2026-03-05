import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../../services/api';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b' };

export default function ApplicationFormScreen({ route, navigation }) {
  const { requirement } = route.params;
  const [form, setForm] = useState({ cropProductionCapacity: '', availableLandArea: '', expectedPrice: '', estimatedProductionQuantity: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const { cropProductionCapacity, availableLandArea, expectedPrice, estimatedProductionQuantity } = form;
    if (!cropProductionCapacity || !availableLandArea || !expectedPrice || !estimatedProductionQuantity) {
      Alert.alert('Missing Fields', 'Please fill in all fields before applying.'); return;
    }
    setLoading(true);
    try {
      await api.post(`/farmers/requirements/${requirement._id}/apply`, {
        cropProductionCapacity: Number(cropProductionCapacity),
        availableLandArea: Number(availableLandArea),
        expectedPrice: Number(expectedPrice),
        estimatedProductionQuantity: Number(estimatedProductionQuantity),
      });
      Alert.alert('Application Submitted!', 'Your application has been sent. You will be notified when negotiation begins.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, suffix }) => (
    <View style={s.formGroup}>
      <Text style={s.label}>{label}{suffix ? <Text style={{ color: C.dim }}> ({suffix})</Text> : ''}</Text>
      <TextInput style={s.input} placeholder={placeholder} placeholderTextColor={C.muted}
        keyboardType="numeric" value={value} onChangeText={onChangeText} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Requirement summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Applying for: {requirement.cropName}</Text>
          <Text style={s.summarySubtitle}>{requirement.variety} · {requirement.requiredQuantity} quintals needed</Text>
          {requirement.initialPriceExpectation && (
            <Text style={s.summaryPrice}>Buyer's expectation: ₹{requirement.initialPriceExpectation}/quintal</Text>
          )}
        </View>

        <Text style={s.sectionTitle}>📊 Your Application Details</Text>

        <InputField label="Crop Production Capacity" suffix="quintals/season"
          value={form.cropProductionCapacity} placeholder="e.g., 500"
          onChangeText={v => set('cropProductionCapacity', v)} />

        <InputField label="Available Land Area" suffix="acres"
          value={form.availableLandArea} placeholder="e.g., 3.5"
          onChangeText={v => set('availableLandArea', v)} />

        <InputField label="Estimated Production Quantity" suffix="quintals"
          value={form.estimatedProductionQuantity} placeholder="e.g., 120"
          onChangeText={v => set('estimatedProductionQuantity', v)} />

        <View style={s.priceCard}>
          <Text style={s.priceLabel}>💰 Your Expected Selling Price</Text>
          <Text style={s.priceHint}>This will be used in the negotiation algorithm. Enter your minimum acceptable price.</Text>
          <View style={s.priceInputWrap}>
            <Text style={s.currencySymbol}>₹</Text>
            <TextInput style={s.priceInput} placeholder="0" placeholderTextColor={C.dim}
              keyboardType="numeric" value={form.expectedPrice}
              onChangeText={v => set('expectedPrice', v)}
            />
            <Text style={s.perUnit}>/quintal</Text>
          </View>
        </View>

        <View style={s.noteCard}>
          <Text style={s.noteText}>ℹ️ Your expected price is private. The system will calculate an optimal price across all applicants and propose it to the buyer for negotiation.</Text>
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Submit Application</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  summaryCard: { backgroundColor: 'rgba(22,163,74,0.1)', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)' },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: C.primary },
  summarySubtitle: { fontSize: 13, color: C.muted, marginTop: 4 },
  summaryPrice: { fontSize: 13, color: C.accent, marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 16 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 12, color: C.text, fontSize: 15 },
  priceCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 2, borderColor: C.accent },
  priceLabel: { fontSize: 14, fontWeight: '700', color: C.accent, marginBottom: 4 },
  priceHint: { fontSize: 11, color: C.muted, lineHeight: 16, marginBottom: 12 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  currencySymbol: { fontSize: 20, fontWeight: '800', color: C.accent, marginRight: 4 },
  priceInput: { flex: 1, padding: 12, fontSize: 24, fontWeight: '800', color: C.text },
  perUnit: { fontSize: 13, color: C.muted },
  noteCard: { backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  noteText: { fontSize: 12, color: '#93c5fd', lineHeight: 18 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
