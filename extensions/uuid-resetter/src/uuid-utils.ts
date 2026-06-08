/**
 * Cocos Creator UUID 壓縮/解壓工具
 * 用於處理場景中 __type__ 欄位的壓縮 UUID 格式
 *
 * 原始 UUID: 08ad7bf9-e10c-4e5c-af56-d1c2428bdc3c (36 chars with dashes)
 * 壓縮格式:  08ad7v54QxOXK9W0cJCi9w8 (23 chars)
 *
 * 規則：前 5 個 hex 字元直接保留 + 剩餘 27 hex 字元轉為 18 個 base64 字元
 */

const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
const BASE64_VALUES = new Array(123);
for (let i = 0; i < 123; ++i) {
    BASE64_VALUES[i] = 64;
}
for (let i = 0; i < 64; ++i) {
    BASE64_VALUES[BASE64_KEYS.charCodeAt(i)] = i;
}

/**
 * 壓縮 UUID（36 字元 → 23 字元）
 * 規則：前5 hex直接保留，剩餘27 hex → 18 base64
 */
export function compressUuid(uuid: string): string {
    // 去掉 dash
    const hex = uuid.replace(/-/g, '');
    if (hex.length !== 32) {
        return uuid; // 不是有效 UUID
    }

    const first5 = hex.slice(0, 5);
    const rest = hex.slice(5); // 27 hex chars

    // 將 27 hex 字元轉為 binary string (108 bits)
    let bits = '';
    for (const ch of rest) {
        bits += parseInt(ch, 16).toString(2).padStart(4, '0');
    }

    // 每 6 bits 編碼為一個 base64 字元 (108 / 6 = 18 chars)
    let b64 = '';
    for (let i = 0; i < bits.length; i += 6) {
        const chunk = bits.slice(i, i + 6).padEnd(6, '0');
        b64 += BASE64_KEYS[parseInt(chunk, 2)];
    }

    return first5 + b64;
}

/**
 * 解壓縮 UUID（23 字元 → 36 字元帶 dash）
 */
export function decompressUuid(compressed: string): string {
    if (compressed.length !== 23) {
        return compressed;
    }

    const first5 = compressed.slice(0, 5);
    const b64Part = compressed.slice(5); // 18 base64 chars

    // 將 18 base64 字元解碼為 binary (108 bits)
    let bits = '';
    for (const ch of b64Part) {
        const val = BASE64_VALUES[ch.charCodeAt(0)];
        bits += val.toString(2).padStart(6, '0');
    }

    // 每 4 bits 轉為一個 hex 字元 (108 / 4 = 27 chars)
    let hex = first5;
    for (let i = 0; i < 108; i += 4) {
        hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }

    // 加入 dashes: 8-4-4-4-12
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * 判斷是否為壓縮格式的 UUID（23 字元，非 cc. 開頭）
 */
export function isCompressedUuid(str: string): boolean {
    if (!str || str.length !== 23) return false;
    return !str.startsWith('cc.');
}
