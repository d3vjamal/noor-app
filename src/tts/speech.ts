import Tts from 'react-native-tts';
import {SpeechSpeed} from '../state/settings';

// react-native-tts: 0.5 is normal speed on Android.
const RATE: Record<SpeechSpeed, number> = {slow: 0.35, normal: 0.5, fast: 0.65};
const MAX_CHUNK = 3000; // Android rejects utterances over ~4000 chars

let token = 0; // bumped by stop(); stale callbacks from a stopped utterance are ignored
let ready: Promise<boolean> | null = null;
let stopHook: (() => void) | null = null; // removes the active utterance's listeners

// Resolves false when no usable (Bengali) voice/engine exists.
function init(): Promise<boolean> {
  if (!ready) {
    ready = (async () => {
      try {
        await Tts.getInitStatus();
        for (const lang of ['bn-BD', 'bn-IN', 'bn']) {
          try {
            await Tts.setDefaultLanguage(lang);
            return true;
          } catch {}
        }
        return false;
      } catch {
        return false;
      }
    })();
  }
  return ready;
}

// Split on sentence ends (danda / full stop / newline) so each chunk stays under the limit.
function chunk(text: string): string[] {
  const parts = text.replace(/\n+/g, ' ').match(/[^।.?!]+[।.?!]?/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (cur.length + p.length > MAX_CHUNK && cur) {
      out.push(cur);
      cur = '';
    }
    cur += p;
  }
  if (cur.trim()) {
    out.push(cur);
  }
  return out;
}

export async function speak(
  text: string,
  speed: SpeechSpeed,
  handlers: {onDone: () => void; onError: () => void},
) {
  const mine = ++token;
  if (!(await init()) || mine !== token) {
    if (mine === token) {
      handlers.onError();
    }
    return;
  }
  await Tts.setDefaultRate(RATE[speed], true);
  const chunks = chunk(text);
  let i = 0;
  const finish = Tts.addEventListener('tts-finish', () => {
    if (mine !== token) {
      return;
    }
    i += 1;
    if (i < chunks.length) {
      Tts.speak(chunks[i]);
    } else {
      cleanup();
      handlers.onDone();
    }
  });
  const fail = Tts.addEventListener('tts-error', () => {
    if (mine === token) {
      cleanup();
      handlers.onError();
    }
  });
  function cleanup() {
    (finish as any)?.remove?.();
    (fail as any)?.remove?.();
  }
  Tts.speak(chunks[0]);
  // stop() later invalidates `mine`; listeners are removed on the next speak()/stop().
  stopHook = cleanup;
}

export function stop() {
  token += 1;
  stopHook?.();
  stopHook = null;
  Tts.stop();
}
