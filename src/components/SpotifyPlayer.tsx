import React, {useRef, useState} from 'react';
import {View} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import {useSettings} from '../state/settings';
import PlayerChrome, {RoundBtn} from './PlayerChrome';

type State = {playing: boolean; time: number; duration: number};

// "spotify:show:ID" style URI from a public link, or null.
export function spotifyUri(url: string): string | null {
  const m = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?(show|episode|playlist|album|track|artist)\/([A-Za-z0-9]+)/);
  return m ? `spotify:${m[1]}:${m[2]}` : null;
}

// NB: the page's controller must not be named ctl (that is window.ctl, the function the app calls).
// Spotify's iFrame API drives the embed so the app can draw its own controls.
// Without a Spotify login in the WebView, Spotify itself limits playback to previews.
const page = (uri: string) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:#120806}iframe{border:0}</style></head>
<body><div id="e"></div>
<script src="https://open.spotify.com/embed/iframe-api/v1" async></script>
<script>
var ctrl;
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
window.onSpotifyIframeApiReady=function(api){
  api.createController(document.getElementById('e'),{uri:${JSON.stringify(uri)},width:'100%',height:152},function(c){
    ctrl=c;
    c.addListener('playback_update',function(e){
      var d=e.data||{};
      post({playing:!d.isPaused,time:(d.position||0)/1000,duration:(d.duration||0)/1000});
    });
  });
};
window.ctl=function(a){
  if(!ctrl)return;
  if(a==='toggle')ctrl.togglePlay();
  else if(a.indexOf('seek:')===0)ctrl.seek(parseFloat(a.slice(5)));
};
true;
</script></body></html>`;

export default function SpotifyPlayer({uri, title, cover}: {uri: string; title: string; cover?: string}) {
  const {t} = useSettings();
  const web = useRef<WebView>(null);
  const [st, setSt] = useState<State>({playing: false, time: 0, duration: 0});
  const stRef = useRef(st);
  stRef.current = st;

  const ctl = (a: string) => web.current?.injectJavaScript(`window.ctl(${JSON.stringify(a)});true;`);
  const seekBy = (d: number) => ctl('seek:' + Math.max(0, stRef.current.time + d));
  const onMessage = (e: WebViewMessageEvent) => {
    try {
      setSt(JSON.parse(e.nativeEvent.data));
    } catch {}
  };

  return (
    <View style={{flex: 1}}>
      <View style={{height: 152}}>
        <WebView
          ref={web}
          style={{backgroundColor: '#120806'}}
          source={{html: page(uri), baseUrl: 'https://open.spotify.com'}}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={req => /^(https?:|about:|data:)/.test(req.url)}
          onError={e => console.warn('Spotify WebView error', e.nativeEvent.description)}
        />
      </View>
      <PlayerChrome
        title={title}
        station="Spotify"
        cover={cover}
        playing={st.playing}
        time={st.time}
        duration={st.duration}
        onSeek={s => ctl('seek:' + s)}>
        <RoundBtn label="↺15" desc={t.listen.prev} onPress={() => seekBy(-15)} />
        <RoundBtn label={st.playing ? '❚❚' : '▶'} desc={st.playing ? t.listen.pause : t.listen.play} big onPress={() => ctl('toggle')} />
        <RoundBtn label="15↻" desc={t.listen.next} onPress={() => seekBy(15)} />
      </PlayerChrome>
    </View>
  );
}
