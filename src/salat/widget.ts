import {NativeModules, Platform} from 'react-native';
import {ROWS, Row, timesFor} from './times';
import {SalatContext} from './window';

// Gives the Android home-screen widget the next three days of prayer times. The widget itself
// chooses the first one still ahead, so it stays right even when the app is closed.
export function updateWidget(ctx: SalatContext | null, names: Record<Row, string>) {
  if (Platform.OS !== 'android' || !ctx?.coords || !NativeModules.NoorWidget) {
    return;
  }
  const list: {n: string; t: number}[] = [];
  for (let d = 0; d < 3; d++) {
    const times = timesFor(ctx.coords, ctx.prefs, new Date(Date.now() + d * 86400000));
    for (const r of ROWS) {
      list.push({n: names[r], t: times[r].getTime()});
    }
  }
  NativeModules.NoorWidget.update(JSON.stringify(list));
}
