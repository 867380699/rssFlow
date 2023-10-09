declare let electronAPI: {
  fetchRSS: (url: string) => Promise<string>;
  fetchImage: (url: string) => Promise<ArrayBuffer>;
};
