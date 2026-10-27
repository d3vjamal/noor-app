import {Linking, Share} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

export function copyText(text: string) {
  Clipboard.setString(text);
}

export async function shareText(text: string) {
  try {
    await Share.share({message: text});
  } catch {}
}

// Very long hadith do not fit in a URL, so those go through the normal share sheet.
const MAX_URL_TEXT = 4000;

// Opens WhatsApp straight to a chat picker with the text filled in. Tries the app scheme first,
// then wa.me, and finally the system share sheet so the button always does something.
export async function whatsappText(text: string) {
  const q = encodeURIComponent(text);
  if (q.length > MAX_URL_TEXT) {
    return shareText(text);
  }
  for (const url of [`whatsapp://send?text=${q}`, `https://wa.me/?text=${q}`]) {
    try {
      await Linking.openURL(url);
      return;
    } catch {}
  }
  await shareText(text);
}
