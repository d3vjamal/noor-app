import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {APP_CONFIG} from '../../config/appConfig';
import Faq from '../components/Faq';
import Screen from '../components/Screen';
import {Lang} from '../i18n';
import {SpeechSpeed, useSettings} from '../state/settings';
import {ThemeName, themes} from '../theme/themes';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const {theme} = useSettings();
  return (
    <View style={styles.section}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, {color: theme.textMuted}]}>
        {title}
      </Text>
      <View
        style={[
          styles.card,
          {backgroundColor: theme.surface, borderColor: theme.border},
        ]}>
        {children}
      </View>
    </View>
  );
}

// Equal-width segmented control.
function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: {value: T; label: string}[];
  value: T;
  onChange: (v: T) => void;
}) {
  const {theme} = useSettings();
  return (
    <View style={[styles.segment, {borderColor: theme.border}]}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{selected: on}}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on && {backgroundColor: theme.primary}]}>
            <Text
              style={{
                color: on ? theme.onPrimary : theme.text,
                fontSize: 16,
                fontWeight: on ? '700' : '400',
              }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const {t, settings, setSettings, theme, appName} = useSettings();
  const themeOptions: {value: ThemeName; label: string}[] = [
    {value: 'light', label: t.settings.themeLight},
    {value: 'sepia', label: t.settings.themeSepia},
    {value: 'dark', label: t.settings.themeDark},
  ];
  return (
    <Screen title={t.settings.title}>
      <View style={[styles.hero, {backgroundColor: theme.primary}]}>
        <Text style={[styles.heroName, {color: theme.onPrimary}]}>
          {appName}
        </Text>
        <Text style={{color: theme.onPrimary, fontSize: 14}}>
          {t.settings.version} {APP_CONFIG.version}
        </Text>
      </View>

      <Section title={t.settings.language}>
        <Segmented<Lang>
          value={settings.language}
          onChange={language => setSettings({language})}
          options={[
            {value: 'bn', label: 'বাংলা'},
            {value: 'en', label: 'English'},
          ]}
        />
      </Section>

      <Section title={t.settings.appearance}>
        <View style={styles.swatches}>
          {themeOptions.map(o => {
            const on = settings.theme === o.value;
            const th = themes[o.value];
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityState={{selected: on}}
                accessibilityLabel={o.label}
                onPress={() => setSettings({theme: o.value})}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: th.background,
                    borderColor: on ? theme.primary : theme.border,
                  },
                  on && styles.swatchOn,
                ]}>
                <Text style={{color: th.text, fontSize: 22, fontWeight: '700'}}>
                  Aa
                </Text>
                <Text style={{color: th.textMuted, fontSize: 13}}>
                  {(on ? '✓ ' : '') + o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title={t.settings.listening}>
        <Text style={[styles.rowLabel, {color: theme.text}]}>
          {t.settings.speechSpeed}
        </Text>
        <Segmented<SpeechSpeed>
          value={settings.speechSpeed}
          onChange={speechSpeed => setSettings({speechSpeed})}
          options={[
            {value: 'slow', label: t.settings.slow},
            {value: 'normal', label: t.settings.normal},
            {value: 'fast', label: t.settings.fast},
          ]}
        />
      </Section>

      <Section title={t.settings.aboutTitle}>
        <Text style={[styles.body, {color: theme.text}]}>
          {t.settings.aboutBody}
        </Text>
        <Text style={[styles.rowLabel, {color: theme.text, marginTop: 14}]}>
          {t.settings.content}
        </Text>
        <Text style={[styles.body, {color: theme.textMuted}]}>
          {t.settings.contentBody}
        </Text>
      </Section>

      <Faq title={t.settings.faqTitle} items={t.settings.faq} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {padding: 20, borderRadius: 18, marginBottom: 20, gap: 4},
  heroName: {fontSize: 24, fontWeight: '700', lineHeight: 36},
  section: {marginBottom: 20},
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    lineHeight: 20,
  },
  card: {padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth},
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  segItem: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatches: {flexDirection: 'row', gap: 10},
  swatch: {
    flex: 1,
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swatchOn: {borderWidth: 3},
  rowLabel: {fontSize: 16, fontWeight: '600', marginBottom: 10, lineHeight: 26},
  body: {fontSize: 15, lineHeight: 26},
});
