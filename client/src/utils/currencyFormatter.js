/**
 * CURRENCY FORMATTING UTILITY
 * ===========================
 * Formats numbers as currency (PKR for Pakistan)
 */

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rs. 0';
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  
  return new Intl.NumberFormat('en-US').format(number);
};

