export const b64toBlob = (
  b64Data: string,
  contentType = '',
  sliceSize = 512
) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export const isImageRequest = (request: Request) => {
  if (request.destination === 'image') {
    return true;
  }
  const url = new URL(request.url);
  if (/\.(jpg|jpeg|png|webp|avif|gif)$/.test(url.pathname)) {
    return true;
  }
};

export const isSameOrigin = (request: Request) => {
  const url = new URL(request.url);
  return url.hostname === location.hostname;
};
