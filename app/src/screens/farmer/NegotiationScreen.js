import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b', danger: '#ef4444', success: '#22c55e', info: '#3b82f6' };

export default function NegotiationScreen({ route, navigation }) {
  const { requirementId } = route.params;
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counterPrice, setCounterPrice] = useState('');
  const [acting, setActing] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get(`/negotiation/${requirementId}`);
      setSession(data.session);
    } catch (err) {
      console.log('Negotiation fetch error', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const farmerAction = async (action) => {
    if (action === 'counter' && (!counterPrice || isNaN(Number(counterPrice)))) {
      Alert.alert('Error', 'Enter a valid counter price'); return;
    }
    setActing(true);
    try {
      const payload = { action };
      if (action === 'counter') payload.counterPrice = Number(counterPrice);
      await api.post(`/negotiation/${requirementId}/farmer-action`, payload);
      Alert.alert('Success', action === 'accepted' ? 'You accepted the price!' : 'Counter offer submitted!');
      setCounterPrice('');
      fetch();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>;

  if (!session) return (
    <View style={s.centerFull}>
      <Text style={{fontSize: 40, marginBottom: 12}}>⏳</Text>
      <Text style={s.emptyTitle}>Negotiation Not Yet Started</Text>
      <Text style={s.emptySubtitle}>Wait for the buyer to start the negotiation after reviewing all applications.</Text>
    </View>
  );

  const currentRound = session.rounds?.[session.currentRound - 1];
  const myResponse = currentRound?.farmerResponses?.find(r => r.farmer?.toString() === user?._id || r.farmer?._id === user?._id);
  const buyerCounterPrice = currentRound?.buyerCounterPrice || currentRound?.proposedPrice;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl onRefresh={fetch} tintColor={C.primary} />}>

      {/* Session overview */}
      <View style={s.overviewCard}>
        <Text style={s.overviewTitle}>Negotiation Overview</Text>
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={[s.statVal, { color: C.primary }]}>₹{session.optimalPrice || '—'}</Text><Text style={s.statLabel}>Optimal Price/q</Text></View>
          <View style={s.stat}><Text style={[s.statVal, { color: C.info }]}>₹{session.meanPrice || '—'}</Text><Text style={s.statLabel}>Mean Price</Text></View>
          <View style={s.stat}><Text style={[s.statVal, { color: C.accent }]}>₹{session.medianPrice || '—'}</Text><Text style={s.statLabel}>Median Price</Text></View>
        </View>
        <View style={s.roundBadge}>
          <Text style={s.roundText}>Round {session.currentRound} · Status: {session.status?.replace(/_/g, ' ')}</Text>
        </View>
      </View>

      {/* Rounds history */}
      {session.rounds?.map((round, i) => (
        <View key={i} style={s.roundCard}>
          <Text style={s.roundTitle}>Round {round.roundNumber}</Text>
          <View style={s.roundRow}>
            <Text style={s.roundLabel}>Optimal Price:</Text>
            <Text style={[s.roundVal, { color: C.primary }]}>₹{round.proposedPrice}/q</Text>
          </View>
          {round.buyerAction !== 'pending' && (
            <View style={s.roundRow}>
              <Text style={s.roundLabel}>Buyer Action:</Text>
              <Text style={[s.roundVal, { color: round.buyerAction === 'accepted' ? C.success : C.accent }]}>
                {round.buyerAction === 'accepted' ? '✅ Accepted' : `Counter ₹${round.buyerCounterPrice}/q`}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Farmer action panel */}
      {session.status === 'farmer_review' && myResponse?.action === 'pending' && (
        <View style={s.actionCard}>
          <Text style={s.actionTitle}>Your Response Required</Text>
          <Text style={s.actionHint}>Buyer's counter price: <Text style={{ color: C.accent, fontWeight: '800' }}>₹{buyerCounterPrice}/q</Text></Text>

          <View style={s.priceInputWrap}>
            <Text style={s.currSymbol}>₹</Text>
            <TextInput style={s.priceInput} placeholder="Your counter price" placeholderTextColor={C.dim}
              keyboardType="numeric" value={counterPrice} onChangeText={setCounterPrice} />
          </View>

          <View style={s.actionBtns}>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.success, flex: 1 }]} onPress={() => farmerAction('accepted')} disabled={acting}>
              <Text style={s.actionBtnText}>✅ Accept ₹{buyerCounterPrice}/q</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.accent, flex: 1 }]} onPress={() => farmerAction('counter')} disabled={acting}>
              <Text style={s.actionBtnText}>Counter Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {myResponse?.action === 'accepted' && (
        <View style={[s.actionCard, { borderColor: C.success }]}>
          <Text style={{ color: C.success, fontWeight: '700', fontSize: 15 }}>✅ You accepted the price in Round {session.currentRound}</Text>
        </View>
      )}

      {session.status === 'agreed' && (
        <View style={[s.actionCard, { borderColor: C.success, backgroundColor: 'rgba(34,197,94,0.1)' }]}>
          <Text style={s.actionTitle}>🎉 Price Agreed!</Text>
          <Text style={{ color: C.success, fontWeight: '800', fontSize: 20 }}>₹{session.finalAgreedPrice}/quintal</Text>
          <Text style={s.actionHint}>Check your contracts for the final offer.</Text>
        </View>
      )}

      <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('Chat', { sessionId: session._id })}>
        <Text style={s.chatBtnText}>💬 Open Negotiation Chat</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  centerFull: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: C.bg },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 18 },
  overviewCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  overviewTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, color: C.dim, textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  roundBadge: { backgroundColor: C.bg, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: C.border },
  roundText: { fontSize: 12, color: C.muted, textAlign: 'center' },
  roundCard: { backgroundColor: C.card, borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  roundTitle: { fontSize: 13, fontWeight: '700', color: C.primary, marginBottom: 8 },
  roundRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  roundLabel: { fontSize: 12, color: C.muted },
  roundVal: { fontSize: 13, fontWeight: '700' },
  actionCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 2, borderColor: C.accent },
  actionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
  actionHint: { fontSize: 13, color: C.muted, marginBottom: 14 },
  priceInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, marginBottom: 12 },
  currSymbol: { fontSize: 18, fontWeight: '800', color: C.accent, marginRight: 4 },
  priceInput: { flex: 1, padding: 10, fontSize: 20, fontWeight: '700', color: C.text },
  actionBtns: { flexDirection: 'row', gap: 10 },
  actionBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chatBtn: { backgroundColor: C.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginTop: 8 },
  chatBtnText: { color: C.primary, fontWeight: '700', fontSize: 15 },
});
