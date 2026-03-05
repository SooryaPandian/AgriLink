import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const C = { bg: '#0f172a', card: '#1e293b', border: '#334155', text: '#f1f5f9', muted: '#94a3b8', primary: '#16a34a', accent: '#f59e0b', dim: '#64748b', danger: '#ef4444' };

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const [p, a] = await Promise.all([api.get('/farmers/profile'), api.get('/farmers/applications')]);
      setProfile(p.data.profile);
      setApplications(a.data.applications);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>;

  const InfoRow = ({ label, value }) => (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoVal}>{value || '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={C.primary} />}>

      {/* Profile header */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user?.name?.[0]?.toUpperCase() || '🌾'}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.email}>{user?.email}</Text>
        <Text style={s.phone}>📞 {user?.phone}</Text>
        {profile && (
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={s.statVal}>⭐ {profile.rating || 0}</Text><Text style={s.statLabel}>Rating</Text></View>
            <View style={s.stat}><Text style={s.statVal}>📄 {profile.completedContracts || 0}</Text><Text style={s.statLabel}>Contracts</Text></View>
            <View style={s.stat}><Text style={s.statVal}>📋 {applications.length}</Text><Text style={s.statLabel}>Applied</Text></View>
          </View>
        )}
      </View>

      {profile ? (
        <>
          <View style={s.section}>
            <Text style={s.sectionTitle}>🌾 Farm Details</Text>
            <InfoRow label="District" value={profile.district} />
            <InfoRow label="State" value={profile.state} />
            <InfoRow label="Farm Location" value={profile.farm?.location} />
            <InfoRow label="Land Area" value={profile.farm?.totalLandArea ? `${profile.farm.totalLandArea} acres` : null} />
            <InfoRow label="Crop Capacity" value={profile.farm?.cropCapacity ? `${profile.farm.cropCapacity} q/season` : null} />
            <InfoRow label="Soil Type" value={profile.farm?.soilType} />
            <InfoRow label="Irrigation" value={profile.farm?.irrigationAvailable ? '✅ Available' : '❌ Not available'} />
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>🏦 Bank Details</Text>
            <InfoRow label="Bank" value={profile.bank?.bankName} />
            <InfoRow label="Account" value={profile.bank?.accountNumber ? '****' + profile.bank.accountNumber.slice(-4) : null} />
            <InfoRow label="IFSC" value={profile.bank?.ifscCode} />
          </View>
        </>
      ) : (
        <View style={s.noProfile}>
          <Text style={s.noProfileText}>⚠️ Complete your farm profile to apply for contracts.</Text>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>📋 Recent Applications ({applications.length})</Text>
        {applications.slice(0, 5).map(a => (
          <View key={a._id} style={s.appItem}>
            <View style={{ flex: 1 }}>
              <Text style={s.appCrop}>{a.requirement?.cropName}</Text>
              <Text style={s.appPrice}>Expected: ₹{a.expectedPrice}/q</Text>
            </View>
            <View style={[s.badge, { backgroundColor: C.primary + '20' }]}>
              <Text style={[s.badgeText, { color: C.primary }]}>{a.status?.replace(/_/g, ' ')}</Text>
            </View>
          </View>
        ))}
        {applications.length === 0 && <Text style={s.infoMuted}>No applications yet.</Text>}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  profileCard: { backgroundColor: C.card, borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: C.text },
  email: { fontSize: 13, color: C.muted, marginTop: 4 },
  phone: { fontSize: 13, color: C.muted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  stat: { alignItems: 'center' },
  statVal: { fontSize: 16, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 10, color: C.dim, marginTop: 2 },
  section: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.5)' },
  infoLabel: { fontSize: 12, color: C.muted },
  infoVal: { fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'right', flex: 1, marginLeft: 16 },
  infoMuted: { fontSize: 12, color: C.dim, textAlign: 'center', paddingVertical: 8 },
  noProfile: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.accent },
  noProfileText: { fontSize: 13, color: C.accent, textAlign: 'center' },
  appItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.5)' },
  appCrop: { fontSize: 13, fontWeight: '600', color: C.text },
  appPrice: { fontSize: 11, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  logoutBtn: { backgroundColor: C.danger, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 4 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
