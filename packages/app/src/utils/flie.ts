export const readFileAsString = (accept = '*') => {
  return new Promise<string | undefined>((resolve) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', accept);
    input.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files && input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          const result = event.target?.result?.toString();
          resolve(result);
        });
        reader.readAsText(file);
      }
    });
    input.click();
  });
};

export const downloadFile = (data: string, name: string) => {
  const blob = new Blob([data], {
    type: 'text/plain',
  });

  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('target', '_blank');
  link.setAttribute('href', blobUrl);
  link.setAttribute('download', name);
  link.click();

  window.URL.revokeObjectURL(blobUrl);
};
