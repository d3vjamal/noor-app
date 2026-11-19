import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackLink from '../../components/BackLink';
import Screen from '../../components/Screen';
import Icon from '../../components/Icon';
import {useSettings} from '../../state/settings';
import {shareText} from '../../share';
import {NisabBasis, ZakatInput, calcZakat} from '../../tools/zakat';

type Field = 'cash' | 'gold' | 'silver' | 'goods' | 'receivables' | 'debts' | 'goldPrice' | 'silverPrice';
type Step = Field | 'basis';

const FIELD_KEY: Record<Field, keyof ZakatInput> = {
  cash: 'cash',
  gold: 'goldGrams',
  silver: 'silverGrams',
  goods: 'goodsValue',
  receivables: 'receivables',
  debts: 'debts',
  goldPrice: 'goldPrice',
  silverPrice: 'silverPrice',
};
const PRICE_KEY = 'tools.zakat.v1';

const num = (v?: string) => parseFloat(v || '') || 0;
const fmt = (n: number) => n.toLocaleString(undefined, {maximumFractionDigits: 2});

// Prices are only asked when they matter, so a person with no gold never sees a gold question.
function buildSteps(vals: Record<string, string>, basis: NisabBasis): Step[] {
  const steps: Step[] = ['cash', 'gold', 'silver', 'goods', 'receivables', 'debts', 'basis'];
  if (num(vals.gold) > 0 || basis === 'gold') {
    steps.push('goldPrice');
  }
  if (num(vals.silver) > 0 || basis === 'silver') {
    steps.push('silverPrice');
  }
  return steps;
}

function Button({
  label,
  onPress,
  primary = true,
  inRow = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  inRow?: boolean;
}) {
  const {theme} = useSettings();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.btn,
        inRow ? styles.btnRow : styles.btnFull,
        {
          backgroundColor: primary ? theme.primary : theme.surface,
          borderColor: primary ? theme.primary : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={{color: primary ? theme.onPrimary : theme.text, fontWeight: '700', fontSize: 16}}>{label}</Text>
    </Pressable>
  );
}

export default function ZakatTool({onBack}: {onBack: () => void}) {
  const {t, theme} = useSettings();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [basis, setBasis] = useState<NisabBasis>('silver');
  const [idx, setIdx] = useState(-1); // -1 intro, steps.length result

  // Remember the metal prices between visits.
  useEffect(() => {
    AsyncStorage.getItem(PRICE_KEY)
      .then(raw => raw && setVals(v => ({...JSON.parse(raw), ...v})))
      .catch(() => {});
  }, []);

  const steps = buildSteps(vals, basis);
  const step = idx >= 0 && idx < steps.length ? steps[idx] : null;
  const done = idx >= steps.length;

  const set = (k: string, v: string) => {
    const next = {...vals, [k]: v.replace(/[^0-9.]/g, '')};
    setVals(next);
    if (k === 'goldPrice' || k === 'silverPrice') {
      AsyncStorage.setItem(
        PRICE_KEY,
        JSON.stringify({goldPrice: next.goldPrice, silverPrice: next.silverPrice}),
      ).catch(() => {});
    }
  };

  const input = {} as ZakatInput;
  (Object.keys(FIELD_KEY) as Field[]).forEach(f => {
    input[FIELD_KEY[f]] = num(vals[f]);
  });
  const r = calcZakat(input, basis);

  const tt = t.tools as unknown as Record<string, string>;
  const next = () => setIdx(i => i + 1);

  let body: React.ReactNode;
  if (idx < 0) {
    body = (
      <>
        <View style={[styles.hero, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          <View style={[styles.badge, {backgroundColor: theme.primary}]}>
            <Icon name="zakat" color={theme.onPrimary} size={40} />
          </View>
          <Text style={[styles.heroTitle, {color: theme.text}]}>{tt.zq_intro}</Text>
          <Text style={[styles.center, {color: theme.textMuted}]}>{tt.zakatNote}</Text>
        </View>
        <Button label={tt.zq_start} onPress={next} />
      </>
    );
  } else if (step) {
    const progress = (idx + 1) / steps.length;
    const isPrice = step === 'goldPrice' || step === 'silverPrice';
    const empty = step !== 'basis' && !vals[step];
    body = (
      <>
        <View style={[styles.track, {backgroundColor: theme.border}]}>
          <View style={{height: 4, width: `${progress * 100}%`, backgroundColor: theme.primary, borderRadius: 2}} />
        </View>
        <Text style={{color: theme.textMuted, marginTop: 6}}>
          {tt.zq_step.replace('%d', String(idx + 1)).replace('%d', String(steps.length))}
        </Text>
        <Text style={[styles.question, {color: theme.text}]}>{step === 'basis' ? tt.zq_basis : tt[`zq_${step}`]}</Text>
        <Text style={{color: theme.textMuted, marginBottom: 16}}>
          {step === 'basis' ? tt.zq_basisHelp : isPrice ? tt.zq_priceHelp : tt[`zq_${step}Help`]}
        </Text>
        {step === 'basis' ? (
          <View style={styles.chips}>
            {(['silver', 'gold'] as const).map(b => {
              const on = b === basis;
              return (
                <Pressable
                  key={b}
                  onPress={() => setBasis(b)}
                  style={[
                    styles.chip,
                    {borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : 'transparent'},
                  ]}>
                  <Text style={{color: on ? theme.onPrimary : theme.text, fontSize: 16}}>
                    {b === 'silver' ? tt.basisSilver : tt.basisGold}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <TextInput
            key={step}
            autoFocus
            keyboardType="decimal-pad"
            value={vals[step] ?? ''}
            onChangeText={v => set(step, v)}
            onSubmitEditing={next}
            placeholder="0"
            placeholderTextColor={theme.textMuted}
            style={[styles.input, {color: theme.text, borderColor: theme.border, backgroundColor: theme.surface}]}
          />
        )}
        <View style={styles.row}>
          <Button inRow label={tt.zq_back} primary={false} onPress={() => setIdx(i => i - 1)} />
          <Button inRow label={empty && !isPrice ? tt.zq_skip : tt.zq_next} onPress={next} />
        </View>
      </>
    );
  } else if (done) {
    const text = tt.zq_shareText
      .replace('%s', fmt(r.gross))
      .replace('%s', fmt(r.net))
      .replace('%s', fmt(r.nisab))
      .replace('%s', fmt(r.due))
      .replace('%%', '%');
    body = (
      <>
        <View style={[styles.result, {backgroundColor: r.eligible ? theme.primary : theme.surface, borderColor: r.eligible ? theme.primary : theme.border}]}>
          <Text style={{color: r.eligible ? theme.onPrimary : theme.textMuted, fontSize: 15}}>{tt.zq_result}</Text>
          <Text style={[styles.big, {color: r.eligible ? theme.onPrimary : theme.text}]}>{fmt(r.due)}</Text>
          {!r.eligible && <Text style={[styles.center, {color: theme.textMuted}]}>{tt.notDue}</Text>}
        </View>
        <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
          {[
            [tt.total, r.gross],
            [tt.net, r.net],
            [tt.nisab, r.nisab],
          ].map(([label, v], i) => (
            <View key={String(label)} style={[styles.line, i > 0 && {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border}]}>
              <Text style={{color: theme.textMuted, fontSize: 15}}>{label}</Text>
              <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}>{fmt(v as number)}</Text>
            </View>
          ))}
        </View>
        <Button label={tt.zq_share} onPress={() => shareText(text)} />
        <View style={{height: 10}} />
        <Button
          label={tt.zq_restart}
          primary={false}
          onPress={() => {
            setVals(v => ({goldPrice: v.goldPrice, silverPrice: v.silverPrice}));
            setIdx(-1);
          }}
        />
      </>
    );
  }

  return (
    <Screen title={t.tools.zakat}>
      <BackLink onBack={onBack} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: {fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 6},
  track: {height: 4, borderRadius: 2, marginTop: 8},
  input: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, marginBottom: 20},
  row: {flexDirection: 'row', gap: 10},
  btn: {borderWidth: 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center'},
  btnRow: {flex: 1},
  btnFull: {alignSelf: 'stretch'},
  chips: {flexDirection: 'row', gap: 10, marginBottom: 20},
  chip: {borderWidth: 1, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 10},
  hero: {borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20},
  badge: {width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 16},
  heroTitle: {fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8},
  center: {textAlign: 'center'},
  result: {borderWidth: 1, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center', marginBottom: 16},
  big: {fontSize: 48, fontWeight: '800', marginTop: 4},
  card: {borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16},
  line: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14},
});
