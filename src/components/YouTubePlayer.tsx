import React, {useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import {useSettings} from '../state/settings';
import PlayerChrome, {RoundBtn} from './PlayerChrome';

type State = {playing: boolean; time: number; duration: number; title: string; error?: number};

// "list" for playlists, "video" for a single video. Parsed by regex (RN's URL polyfill is incomplete).
export function parseYouTube(url: string): {list?: string; video?: string} | null {
  const list = url.match(/[?&]list=([\w-]+)/);
  if (list) {
    return {list: list[1]};
  }
  const video =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([\w-]{6,})/);
  return video ? {video: video[1]} : null;
}

// The YouTube IFrame API drives the player; the app draws its own controls (like deluxsalon.in).
const page = (cfg: {list?: string; video?: string}) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}#p{width:100%;height:100%}</style></head>
<body><div id="p"></div>
<script src="https://www.youtube.com/iframe_api"></script>
<script>
var cfg=${JSON.stringify(cfg)},player,timer;
function send(extra){
  var d=player&&player.getVideoData?player.getVideoData():{};
  var m={playing:player.getPlayerState&&player.getPlayerState()===1,
    time:player.getCurrentTime?player.getCurrentTime():0,
    duration:player.getDuration?player.getDuration():0,title:d.title||''};
  for(var k in extra)m[k]=extra[k];
  window.ReactNativeWebView.postMessage(JSON.stringify(m));
}
function onYouTubeIframeAPIReady(){
  var vars={origin:'${APP_ORIGIN}',playsinline:1,controls:0,modestbranding:1,rel:0,fs:0,disablekb:1,iv_load_policy:3};
  if(cfg.list){vars.listType='playlist';vars.list=cfg.list;}
  player=new YT.Player('p',{width:'100%',height:'100%',videoId:cfg.video,playerVars:vars,events:{
    onReady:function(){if(cfg.list){player.setShuffle(true);player.playVideo();}else{player.playVideo();}
      timer=setInterval(send,500);send();},
    onStateChange:function(e){send();},
    onError:function(e){send({error:e.data});}
  }});
}
window.ctl=function(a){
  if(!player)return;
  if(a==='toggle'){player.getPlayerState()===1?player.pauseVideo():player.playVideo();}
  else if(a==='next'){player.nextVideo();}
  else if(a==='prev'){player.previousVideo();}
  else if(a==='shuffle'){player.setShuffle(true);player.nextVideo();}
  else if(a.indexOf('seek:')===0){player.seekTo(parseFloat(a.slice(5)),true);}
  send();
};
true;
</script></body></html>`;

// YouTube rejects embeds with no/own-domain referrer (error 152/153), so give the page an app origin.
const APP_ORIGIN = 'https://muntakhab.app';

export default function YouTubePlayer({cfg, cover}: {cfg: {list?: string; video?: string}; cover?: string}) {
  const {t} = useSettings();
  const web = useRef<WebView>(null);
  const [st, setSt] = useState<State>({playing: false, time: 0, duration: 0, title: ''});
  const isList = !!cfg.list;

  const ctl = (a: string) => web.current?.injectJavaScript(`window.ctl(${JSON.stringify(a)});true;`);
  const onMessage = (e: WebViewMessageEvent) => {
    try {
      setSt(JSON.parse(e.nativeEvent.data));
    } catch {}
  };

  return (
    <View style={{flex: 1}}>
      <View style={styles.video}>
        <WebView
          ref={web}
          style={{backgroundColor: '#000'}}
          source={{html: page(cfg), baseUrl: APP_ORIGIN}}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          onMessage={onMessage}
          onError={e => console.warn('YT WebView error', e.nativeEvent.description)}
        />
      </View>
      <PlayerChrome
        title={st.title}
        station="YouTube"
        cover={cover}
        playing={st.playing}
        time={st.time}
        duration={st.duration}
        notice={st.error ? t.listen.cannotEmbed : undefined}
        onSeek={s => ctl('seek:' + s)}>
        {isList && <RoundBtn label="⏮" desc={t.listen.prev} onPress={() => ctl('prev')} />}
        <RoundBtn label={st.playing ? '❚❚' : '▶'} desc={st.playing ? t.listen.pause : t.listen.play} big onPress={() => ctl('toggle')} />
        {isList && <RoundBtn label="⏭" desc={t.listen.next} onPress={() => ctl('next')} />}
        {isList && <RoundBtn label="⇄" desc={t.listen.shuffle} onPress={() => ctl('shuffle')} />}
      </PlayerChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  video: {width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000'},
});
