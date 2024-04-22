export const decodeDataUrl = (dataUrl: string): string => {
  const inputBase64 = dataUrl.replace(dataUrlPrefix, "");
  const inputBase64Bytes = Uint8Array.from(atob(inputBase64), m => m?.codePointAt(0) ?? 0);
  return new TextDecoder().decode(inputBase64Bytes);
};

export const encodeToDataUrl = (fileContent: string): string => {
  const resultBytes = new TextEncoder().encode(fileContent);
  const resultBase64 = btoa(String.fromCodePoint(...resultBytes));

  return dataUrlPrefix + resultBase64;
};

const dataUrlPrefix = "data:image/svg+xml;base64,";
