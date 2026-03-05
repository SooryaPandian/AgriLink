import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../services/api';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b', danger: '#ef4444', success: '#22c55e' };
const STATUS_COLOR = { invited: C.accent, accepted: C.success, rejected: C.danger, expired: C.dim, fulfilled: C.primary };

export default function MyContractsScreen() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(null);

  const fetch = async () => {
    try {
      const { data } = await api.get('/contracts');
      setContracts(data.contracts);
    } catch (err) { console.log('Contracts error', err?.message); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);

  const respond = async (contractId, action) => {
    Alert.alert(
      action === 'accept' ? 'Accept Contract?' : 'Reject Contract?',
      action === 'accept' ? 'Are you sure you want to accept this contract?' : 'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'accept' ? 'Accept' : 'Reject', style: action === 'accept' ? 'default' : 'destructive',
          onPress: async () => {
            setActing(contractId);
            try {
              await api.post(`/contracts/${contractId}/respond`, { action });
              Alert.alert('Done', action === 'accept' ? 'Contract accepted!' : 'Contract rejected. System will notify the next farmer.');
              fetch();
            } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed'); }
            finally { setActing(null); }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.cropName}>{item.requirement?.cropName || 'Crop'}</Text>
          <Text style={s.cropVariety}>{item.requirement?.variety}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[item.status] || C.dim}20` }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] || C.dim }]}>{item.status}</Text>
        </View>
      </View>

      <View style={s.priceRow}>
        <Text style={s.priceVal}>₹{item.agreedPrice}/q</Text>
        <Text style={s.qty}>{item.contractedQuantity} quintals</Text>
      </View>

      <View style={s.infoRow}>
        <Text style={s.info}>🏢 {item.buyer?.name}</Text>
        {item.deliveryDate && <Text style={s.info}>📅 {new Date(item.deliveryDate).toLocaleDateString()}</Text>}
      </View>

      {item.status === 'invited' && (
        <View style={s.actionRow}>
          <TouchableOpacity style={[s.btn, { backgroundColor: C.success, flex: 1 }]} disabled={acting === item._id}
            onPress={() => respond(item._id, 'accept')}>
            {acting === item._id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>✅ Accept</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: C.danger, flex: 1 }]} disabled={acting === item._id}
            onPress={() => respond(item._id, 'reject')}>
            <Text style={s.btnText}>❌ Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.expiresAt && item.status === 'invited' && (
        <Text style={s.expiryText}>⏰ Expires: {new Date(item.expiresAt).toLocaleString()}</Text>
      )}
    </View>
  );

  if (loading) return <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>;

  return (
    <FlatList
      data={contracts}
      keyExtractor={i => i._id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={C.primary} />}
      ListEmptyComponent={() => (
        <View style={s.empty}>
          <Text style={{ fontSize: 48 }}>📄</Text>
          <Text style={s.emptyTitle}>No Contracts Yet</Text>
          <Text style={s.emptySub}>Apply for crop requirements to receive contract offers.</Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cropName: { fontSize: 16, fontWeight: '800', color: C.text },
  cropVariety: { fontSize: 12, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priceVal: { fontSize: 22, fontWeight: '800', color: C.accent },
  qty: { fontSize: 13, color: C.muted },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  info: { fontSize: 12, color: C.muted },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  expiryText: { fontSize: 11, color: C.danger, marginTop: 8, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: C.muted, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
});
