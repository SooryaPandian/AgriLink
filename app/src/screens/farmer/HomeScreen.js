import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../services/api';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b' };

const STATUS_COLOR = {
  open: C.primary, negotiating: C.accent, contracts_allocated: '#3b82f6', fulfilled: C.primary, cancelled: '#ef4444',
};

export default function HomeScreen({ navigation }) {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    try {
      const params = {};
      if (search) params.crop = search;
      const { data } = await api.get('/farmers/requirements', { params });
      setRequirements(data.requirements);
    } catch (err) {
      console.log('Error fetching requirements', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const onRefresh = () => { setRefreshing(true); fetch(); };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('RequirementDetail', { requirement: item })}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.cropName}>{item.cropName}</Text>
          {item.variety && <Text style={s.variety}>{item.variety}</Text>}
        </View>
        <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[item.status] || C.dim}20` }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] || C.dim }]}>
            {item.status?.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={s.infoRow}>
        <View style={s.infoItem}><Text style={s.infoLabel}>Quantity</Text><Text style={s.infoVal}>{item.requiredQuantity} q</Text></View>
        <View style={s.infoItem}><Text style={s.infoLabel}>Grade</Text><Text style={s.infoVal}>{item.qualityGrade}</Text></View>
        <View style={s.infoItem}><Text style={s.infoLabel}>Price/q</Text>
          <Text style={[s.infoVal, { color: C.accent }]}>₹{item.initialPriceExpectation || 'TBD'}</Text>
        </View>
      </View>

      <View style={s.bottomRow}>
        <Text style={s.region}>📍 {item.targetRegion || 'Any region'}</Text>
        <Text style={s.applicants}>👥 {item.applicationCount || 0} applied</Text>
      </View>
      {item.buyerProfile?.companyName && (
        <Text style={s.company}>🏢 {item.buyerProfile.companyName}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <TextInput style={s.searchInput} placeholder="Search crop requirements..." placeholderTextColor={C.muted}
          value={search} onChangeText={setSearch} onSubmitEditing={fetch} returnKeyType="search" />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : (
        <FlatList
          data={requirements}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          ListEmptyComponent={() => (
            <View style={s.center}>
              <Text style={{ fontSize: 48 }}>🌱</Text>
              <Text style={s.emptyText}>No open requirements found</Text>
              <Text style={s.emptySubtext}>Pull down to refresh</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  searchBar: { padding: 12, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  searchInput: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, color: C.text, fontSize: 14, paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cropName: { fontSize: 17, fontWeight: '800', color: C.text },
  variety: { fontSize: 12, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  infoItem: { flex: 1, backgroundColor: C.bg, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.border },
  infoLabel: { fontSize: 9, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  region: { fontSize: 12, color: C.muted },
  applicants: { fontSize: 12, color: C.muted },
  company: { fontSize: 11, color: C.dim, marginTop: 6 },
  emptyText: { fontSize: 16, color: C.muted, marginTop: 12, fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: C.dim, marginTop: 4 },
});
