import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import BackLink from '../../components/BackLink';
import Screen, {EmptyState} from '../../components/Screen';
import {useNames} from '../../content/names';
import {useSettings} from '../../state/settings';

export default function NamesTool({onBack}: {onBack: () => void}) {
  const {t, theme, settings} = useSettings();
  const {data, loading, refresh, refreshing} = useNames();
  const bn = settings.language === 'bn';
  return (
    <Screen title={t.tools.names} onRefresh={refresh} refreshing={refreshing}>
      <BackLink onBack={onBack} />
      {!data?.length && <EmptyState text={loading ? t.common.loading : t.common.needInternet} />}
      {data?.map(n => (
        <View
          key={n.number}
          style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          <Text style={[styles.num, {color: theme.primary}]}>{n.number}</Text>
          <View style={styles.body}>
            <Text style={[styles.arabic, {color: theme.text}]}>{n.arabic}</Text>
            <Text style={{color: theme.text, fontWeight: '600'}}>{bn ? n.nameBn : n.translit}</Text>
            <Text style={{color: theme.textMuted}}>{bn ? n.meaningBn : n.meaningEn}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10, alignItems: 'center'},
  num: {fontSize: 16, fontWeight: '700', minWidth: 28, textAlign: 'center'},
  body: {flex: 1, gap: 2},
  arabic: {fontSize: 28, lineHeight: 46, textAlign: 'right'},
});
