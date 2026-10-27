/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// Notifee wants a background handler registered even when nothing needs handling.
notifee.onBackgroundEvent(async () => {});

AppRegistry.registerComponent(appName, () => App);
