import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b', success: '#22c55e', info: '#3b82f6' };

export default function RequirementDetailScreen({ route, navigation }) {
  const { requirement } = route.params;
  const [loading, setLoading] = useState(false);

  const InfoBlock = ({ label, value, color }) => (
    <View style={s.infoBlock}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoVal, color && { color }]}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.cropName}>{requirement.cropName}</Text>
        {requirement.variety && <Text style={s.variety}>{requirement.variety}</Text>}
        <View style={s.buyerBadge}>
          <Text style={s.buyerText}>🏢 {requirement.buyerProfile?.companyName || requirement.buyer?.name || 'Agricultural Buyer'}</Text>
        </View>
      </View>

      {/* Key Stats */}
      <View style={s.statsRow}>
        <InfoBlock label="Required" value={`${requirement.requiredQuantity} q`} />
        <InfoBlock label="Grade" value={requirement.qualityGrade} />
        <InfoBlock label="Price/q" value={requirement.initialPriceExpectation ? `₹${requirement.initialPriceExpectation}` : 'Negotiate'} color={C.accent} />
      </View>

      {/* Details */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📋 Requirement Details</Text>
        <View style={s.detailGrid}>
          <InfoBlock label="Region" value={requirement.targetRegion} />
          <InfoBlock label="Districts" value={requirement.allowedDistricts?.join(', ')} />
          <InfoBlock label="Negotiable" value={requirement.negotiationAllowed ? '✅ Yes' : '❌ No'} />
          <InfoBlock label="Transport" value={requirement.transportResponsibility} />
          <InfoBlock label="Logistics" value={requirement.pickupOrDelivery} />
          <InfoBlock label="Min Farm" value={requirement.minFarmSize ? `${requirement.minFarmSize} acres` : 'Any'} />
        </View>
      </View>

      {requirement.deliveryDate && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>📅 Timeline</Text>
          <View style={s.timelineRow}>
            {requirement.plantingDate && <View style={s.timeItem}><Text style={s.timeLabel}>Planting</Text><Text style={s.timeVal}>{new Date(requirement.plantingDate).toLocaleDateString()}</Text></View>}
            {requirement.harvestDate && <View style={s.timeItem}><Text style={s.timeLabel}>Harvest</Text><Text style={s.timeVal}>{new Date(requirement.harvestDate).toLocaleDateString()}</Text></View>}
            {requirement.deliveryDate && <View style={s.timeItem}><Text style={s.timeLabel}>Delivery</Text><Text style={s.timeVal}>{new Date(requirement.deliveryDate).toLocaleDateString()}</Text></View>}
          </View>
        </View>
      )}

      {requirement.farmingPractices && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🌿 Farming Practices</Text>
          <Text style={s.practiceText}>{requirement.farmingPractices}</Text>
        </View>
      )}

      {requirement.status === 'open' && (
        <TouchableOpacity style={[s.applyBtn, { backgroundColor: C.primary }]}
          onPress={() => navigation.navigate('ApplicationForm', { requirement })}>
          <Text style={s.applyBtnText}>Apply for this Contract →</Text>
        </TouchableOpacity>
      )}

      {requirement.status === 'negotiating' && (
        <TouchableOpacity style={[s.applyBtn, { backgroundColor: C.accent }]}
          onPress={() => navigation.navigate('Negotiation', { requirementId: requirement._id })}>
          <Text style={s.applyBtnText}>View Negotiation Status →</Text>
        </TouchableOpacity>
      )}

      {requirement.status !== 'open' && requirement.status !== 'negotiating' && (
        <View style={[s.applyBtn, { backgroundColor: C.dim, opacity: 0.7 }]}>
          <Text style={s.applyBtnText}>This requirement is {requirement.status.replace(/_/g, ' ')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.card, borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  cropName: { fontSize: 24, fontWeight: '800', color: C.text },
  variety: { fontSize: 14, color: C.muted, marginTop: 4 },
  buyerBadge: { marginTop: 12, backgroundColor: 'rgba(22,163,74,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  buyerText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoBlock: { flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border },
  infoLabel: { fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoVal: { fontSize: 14, fontWeight: '700', color: C.text },
  section: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timelineRow: { flexDirection: 'row', gap: 8 },
  timeItem: { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.border },
  timeLabel: { fontSize: 9, color: C.dim, textTransform: 'uppercase' },
  timeVal: { fontSize: 12, fontWeight: '700', color: C.text, marginTop: 2 },
  practiceText: { fontSize: 13, color: C.muted, lineHeight: 20 },
  applyBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
