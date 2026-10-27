import React from 'react';
import {RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSettings} from '../state/settings';

type Props = {
  title: string;
  children?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  embedded?: boolean; // inside another screen that already supplies the top inset and header
};

export default function Screen({title, children, onRefresh, refreshing = false, embedded = false}: Props) {
  const {theme} = useSettings();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, {backgroundColor: theme.background, paddingTop: embedded ? 0 : insets.top}]}>
      {!embedded && (
        <View style={[styles.header, {borderBottomColor: theme.border}]}>
          <Text accessibilityRole="header" style={[styles.title, {color: theme.text}]}>
            {title}
          </Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          ) : undefined
        }>
        {children}
      </ScrollView>
    </View>
  );
}

export function EmptyState({text}: {text: string}) {
  const {theme} = useSettings();
  return <Text style={[styles.empty, {color: theme.textMuted}]}>{text}</Text>;
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth},
  title: {fontSize: 22, fontWeight: '700', lineHeight: 36},
  body: {padding: 16, flexGrow: 1},
  empty: {fontSize: 16, lineHeight: 28, textAlign: 'center', marginTop: 32},
});
