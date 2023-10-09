import type { ContextBridge, IpcMain, IpcRenderer } from 'electron';

const channel = {
  fetchRSS: 'fetch:rss',
  fetchImage: 'fetch:image',
};

const fetchRSS = async (url: string) => {
  try {
    const resp = await fetch(url);
    return await resp.text();
  } catch (e) {
    console.log(e);
  }
};

const fetchImage = async (url: string) => {
  try {
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    const headers = {};

    for (const [key, value] of resp.headers.entries()) {
      headers[key] = value;
    }

    return {
      status: resp.status,
      data: Buffer.from(data).toString('base64'),
      headers,
    };
  } catch (e) {
    console.log(e);
  }
};

export const registerAPI = (ipcMain: IpcMain) => {
  ipcMain.handle(channel.fetchRSS, async (event, url) => {
    const resp = await fetchRSS(url);
    return resp;
  });
  ipcMain.handle(channel.fetchImage, async (event, url) => {
    const resp = await fetchImage(url);
    return resp;
  });
};

export const preloadAPI = (
  contextBridge: ContextBridge,
  ipcRenderer: IpcRenderer
) => {
  contextBridge.exposeInMainWorld('electronAPI', {
    fetchRSS: (url: string) => ipcRenderer.invoke(channel.fetchRSS, url),
    fetchImage: (url: string) => ipcRenderer.invoke(channel.fetchImage, url),
  });
};
