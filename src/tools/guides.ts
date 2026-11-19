// Step lists for the Wudu, Salah and after-prayer dhikr guides. Wording follows the common
// teaching; the app note tells users to follow their own school for differences.
type Step = {title: string; text?: string; arabic?: string; count?: number};
type Lang = 'bn' | 'en';

export const WUDU: Record<Lang, Step[]> = {
  en: [
    {title: 'Intention and Bismillah', text: 'Make the intention in your heart and say Bismillah.', arabic: 'بِسْمِ اللَّهِ'},
    {title: 'Wash the hands', text: 'Wash both hands up to the wrists, three times.'},
    {title: 'Rinse the mouth', text: 'Rinse the mouth three times.'},
    {title: 'Clean the nose', text: 'Sniff water into the nose and blow it out, three times.'},
    {title: 'Wash the face', text: 'Wash from hairline to chin and ear to ear, three times.'},
    {title: 'Wash the arms', text: 'Wash the right arm then the left, up to and including the elbows, three times each.'},
    {title: 'Wipe the head', text: 'Wipe over the head once with wet hands, then the ears.'},
    {title: 'Wash the feet', text: 'Wash the right foot then the left, up to and including the ankles, three times each.'},
  ],
  bn: [
    {title: 'নিয়ত ও বিসমিল্লাহ', text: 'মনে মনে নিয়ত করে বিসমিল্লাহ বলুন।', arabic: 'بِسْمِ اللَّهِ'},
    {title: 'হাত ধোয়া', text: 'দুই হাত কবজি পর্যন্ত তিনবার ধুয়ে নিন।'},
    {title: 'কুলি করা', text: 'তিনবার কুলি করুন।'},
    {title: 'নাকে পানি দেওয়া', text: 'নাকে পানি টেনে ঝেড়ে ফেলুন, তিনবার।'},
    {title: 'মুখ ধোয়া', text: 'কপালের চুলের গোড়া থেকে থুতনি এবং এক কান থেকে অন্য কান পর্যন্ত তিনবার ধুয়ে নিন।'},
    {title: 'হাত ধোয়া (কনুই সহ)', text: 'ডান হাত, তারপর বাম হাত কনুইসহ তিনবার করে ধুয়ে নিন।'},
    {title: 'মাথা মাসেহ', text: 'ভেজা হাতে একবার মাথা মাসেহ করুন, তারপর কান।'},
    {title: 'পা ধোয়া', text: 'ডান পা, তারপর বাম পা টাখনুসহ তিনবার করে ধুয়ে নিন।'},
  ],
};

export const SALAH: Record<Lang, Step[]> = {
  en: [
    {title: 'Face the Qibla and make the intention', text: 'Stand facing the Kaaba and intend the prayer in your heart.'},
    {title: 'Takbir', text: 'Raise the hands to the ears or shoulders and say Allahu Akbar.', arabic: 'اللَّهُ أَكْبَرُ'},
    {title: 'Qiyam: recite', text: 'Recite the opening supplication, Surah Al-Fatiha, then another surah or some verses.'},
    {title: 'Ruku', text: 'Say Allahu Akbar and bow with the back straight. Say Subhana Rabbiyal Azeem three times.', arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ'},
    {title: 'Stand up', text: 'Rise saying Sami Allahu liman hamidah, then Rabbana lakal hamd.', arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ'},
    {title: 'Sujood', text: 'Say Allahu Akbar and prostrate on seven parts. Say Subhana Rabbiyal A\'la three times.', arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى'},
    {title: 'Sit between the prostrations', text: 'Sit briefly, then prostrate a second time.'},
    {title: 'Repeat for the rakahs', text: 'Stand for the next rakah and repeat. Sit for Tashahhud after the second rakah and at the end.'},
    {title: 'Tashahhud and Salawat', text: 'In the final sitting recite Tashahhud, the Salawat on the Prophet and a supplication.'},
    {title: 'Taslim', text: 'Turn the head to the right then the left saying As-salamu alaykum wa rahmatullah.', arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ'},
  ],
  bn: [
    {title: 'কিবলামুখী হয়ে নিয়ত', text: 'কাবার দিকে মুখ করে দাঁড়ান এবং মনে মনে নামাযের নিয়ত করুন।'},
    {title: 'তাকবীর', text: 'কান বা কাঁধ পর্যন্ত হাত তুলে আল্লাহু আকবার বলুন।', arabic: 'اللَّهُ أَكْبَرُ'},
    {title: 'কিয়াম: তিলাওয়াত', text: 'সানা, সূরা ফাতিহা এবং এরপর অন্য একটি সূরা বা কয়েকটি আয়াত পড়ুন।'},
    {title: 'রুকু', text: 'আল্লাহু আকবার বলে পিঠ সোজা রেখে ঝুঁকুন। তিনবার সুবহানা রাব্বিয়াল আযীম পড়ুন।', arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ'},
    {title: 'সোজা হয়ে দাঁড়ানো', text: 'সামিআল্লাহু লিমান হামিদাহ বলে উঠুন, তারপর রাব্বানা লাকাল হামদ।', arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ'},
    {title: 'সিজদা', text: 'আল্লাহু আকবার বলে সাত অঙ্গে সিজদা করুন। তিনবার সুবহানা রাব্বিয়াল আলা পড়ুন।', arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى'},
    {title: 'দুই সিজদার মাঝে বসা', text: 'কিছুক্ষণ বসে আবার দ্বিতীয় সিজদা করুন।'},
    {title: 'বাকি রাকআত', text: 'পরের রাকআতের জন্য দাঁড়িয়ে একইভাবে আদায় করুন। দ্বিতীয় রাকআত ও শেষে তাশাহহুদের জন্য বসুন।'},
    {title: 'তাশাহহুদ ও দরূদ', text: 'শেষ বৈঠকে তাশাহহুদ, দরূদ ও দোয়া পড়ুন।'},
    {title: 'সালাম', text: 'আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ বলে ডানে ও বামে মুখ ফেরান।', arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ'},
  ],
};

export const ADHKAR: Record<Lang, Step[]> = {
  en: [
    {title: 'Istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', count: 3, text: 'I seek forgiveness from Allah.'},
    {title: 'Peace', arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', text: 'O Allah, You are Peace and from You comes peace. Blessed are You, Owner of Majesty and Honour.'},
    {title: 'Subhanallah', arabic: 'سُبْحَانَ اللَّهِ', count: 33, text: 'Glory be to Allah.'},
    {title: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', count: 33, text: 'All praise is for Allah.'},
    {title: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', count: 34, text: 'Allah is the Greatest.'},
    {title: 'Tawhid', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', text: 'None has the right to be worshipped but Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things capable.'},
    {title: 'Ayat al-Kursi', arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', text: 'Recite Ayat al-Kursi (Surah Al-Baqarah 2:255) after each obligatory prayer.'},
  ],
  bn: [
    {title: 'ইস্তিগফার', arabic: 'أَسْتَغْفِرُ اللَّهَ', count: 3, text: 'আমি আল্লাহর কাছে ক্ষমা চাই।'},
    {title: 'শান্তির দোয়া', arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', text: 'হে আল্লাহ, আপনিই শান্তি এবং আপনার কাছ থেকেই শান্তি আসে। আপনি বরকতময়, হে মহিমা ও সম্মানের অধিকারী।'},
    {title: 'সুবহানাল্লাহ', arabic: 'سُبْحَانَ اللَّهِ', count: 33, text: 'আল্লাহ পবিত্র।'},
    {title: 'আলহামদুলিল্লাহ', arabic: 'الْحَمْدُ لِلَّهِ', count: 33, text: 'সকল প্রশংসা আল্লাহর।'},
    {title: 'আল্লাহু আকবার', arabic: 'اللَّهُ أَكْبَرُ', count: 34, text: 'আল্লাহ সর্বমহান।'},
    {title: 'তাওহীদ', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', text: 'আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি একক, তাঁর কোনো শরীক নেই। রাজত্ব ও প্রশংসা তাঁরই এবং তিনি সর্ববিষয়ে ক্ষমতাবান।'},
    {title: 'আয়াতুল কুরসী', arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ', text: 'প্রতি ফরয নামাযের পর আয়াতুল কুরসী (সূরা বাকারা ২:২৫৫) পড়ুন।'},
  ],
};
