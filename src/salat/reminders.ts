import {Platform} from 'react-native';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {Coords, Prefs, ROWS, Row, formatTime, timesFor} from './times';

const DAYS = 7;
const CH_VIBRATE = 'salat-vibrate';
const CH_SOUND = 'salat-sound';

// Channel settings are fixed once created, so each mode gets its own channel.
async function ensureChannels(names: {vibrate: string; sound: string}) {
  await notifee.createChannel({
    id: CH_VIBRATE,
    name: names.vibrate,
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 600, 300, 600, 300, 600],
  });
  await notifee.createChannel({
    id: CH_SOUND,
    name: names.sound,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 600, 300, 600],
  });
}

// True when reminders can actually fire on time (notifications + exact alarms).
export async function reminderAccess(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const s = await notifee.getNotificationSettings();
  const alarmOk = s.android.alarm === 1; // AndroidNotificationSetting.ENABLED
  return s.authorizationStatus === AuthorizationStatus.AUTHORIZED && alarmOk;
}

// Asks for notification permission; sends the user to the exact-alarm page when it is off.
export async function requestReminderAccess(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const res = await notifee.requestPermission();
  if (res.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
    return false;
  }
  const s = await notifee.getNotificationSettings();
  if (s.android.alarm !== 1) {
    await notifee.openAlarmPermissionSettings();
    return false;
  }
  return true;
}

type Labels = {
  names: Record<Row, string>;
  body: string; // contains %s for the prayer name
  channelVibrate: string;
  channelSound: string;
  locale: string;
  timeZone?: string;
};

// Replaces all scheduled reminders with the next DAYS days of prayers that are switched on.
export async function rescheduleReminders(
  coords: Coords | null,
  prefs: Prefs,
  labels: Labels,
) {
  if (Platform.OS !== 'android') {
    return;
  }
  await notifee.cancelTriggerNotifications();
  const wanted = ROWS.filter(r => prefs.alarms[r] !== 'off');
  if (!coords || wanted.length === 0) {
    return;
  }
  if (!(await reminderAccess())) {
    return;
  }
  await ensureChannels({
    vibrate: labels.channelVibrate,
    sound: labels.channelSound,
  });
  const now = Date.now();
  for (let i = 0; i < DAYS; i++) {
    const day = new Date(now + i * 86400000);
    const times = timesFor(coords, prefs, day);
    for (const r of wanted) {
      const at = times[r];
      if (at.getTime() <= now + 5000) {
        continue;
      }
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: at.getTime(),
        alarmManager: {allowWhileIdle: true},
      };
      await notifee.createTriggerNotification(
        {
          id: `${r}-${at.toISOString().slice(0, 10)}`,
          title: `${labels.names[r]} · ${formatTime(at, labels.locale, labels.timeZone)}`,
          body: labels.body.replace('%s', labels.names[r]),
          android: {
            channelId: prefs.alarms[r] === 'sound' ? CH_SOUND : CH_VIBRATE,
            pressAction: {id: 'default'},
            smallIcon: 'ic_stat_salat',
          },
        },
        trigger,
      );
    }
  }
}
