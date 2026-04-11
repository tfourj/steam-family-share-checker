export function extractAppId(input: string) {
  const match = input.match(/\/app\/(\d+)/);
  return match ? match[1] : null;
}

export function isRawAppId(input: string) {
  return /^\d{1,10}$/.test(input.trim());
}
