export const dec2hex = (dec: number): string => {
    return dec.toString(16).padStart(2, '0');
}

export const generateId = (): string => {
    const arr = new Uint8Array(4);
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('').toLowerCase();
}
