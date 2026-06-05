export const CurrencySymbolTable: {[key: string]: string} = {
  USD: '$', // United States Dollar
  EUR: '€', // Euro
  GBP: '£', // British Pound Sterling
  JPY: '¥', // Japanese Yen
  CNY: '¥', // Chinese Yuan
  INR: '₹', // Indian Rupee
  RUB: '₽', // Russian Ruble
  CHF: 'Fr', // Swiss Franc
  AUD: 'A$', // Australian Dollar
  CAD: 'C$', // Canadian Dollar
  BRL: 'R$', // Brazilian Real
  MXN: 'Mex$', // Mexican Peso
  ZAR: 'R', // South African Rand
  KRW: '₩', // South Korean Won
  SGD: 'S$', // Singapore Dollar
  HKD: 'HK$', // Hong Kong Dollar
  TWD: 'NT$', // New Taiwan Dollar
  THB: '฿', // Thai Baht
  VND: '₫', // Vietnamese Dong
  IDR: 'Rp', // Indonesian Rupiah
  MYR: 'RM', // Malaysian Ringgit
  PHP: '₱', // Philippine Peso
  PKR: '₨', // Pakistani Rupee
  BDT: '৳', // Bangladeshi Taka
  NPR: '₨', // Nepalese Rupee
  LKR: '₨', // Sri Lankan Rupee
  KHR: '៛', // Cambodian Riel
  MMK: 'K', // Myanmar Kyat
  LAK: '₭', // Lao Kip
  MNT: '₮', // Mongolian Tugrik
  SEK: 'kr', // 瑞典(Sweden) -> 瑞典克朗
  RON: 'L', // 羅馬尼亞(Romania) -> 羅馬尼亞幣
};

// Function to get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  return CurrencySymbolTable[currencyCode.toUpperCase()] || currencyCode;
}
