import { contextBridge, ipcRenderer } from 'electron';

import { preloadAPI } from './api';

require('./rt/electron-rt');
//////////////////////////////
// User Defined Preload scripts below
console.log('User Preload!');

preloadAPI(contextBridge, ipcRenderer);
