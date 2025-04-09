/**
 * Generates a 6-digit share code in the format XXX-XXX
 * This is used for connecting devices for screen sharing
 */
export function generateShareCode(): string {
  // Generate 6 random digits
  const digits = [];
  for (let i = 0; i < 6; i++) {
    digits.push(Math.floor(Math.random() * 10).toString());
  }
  
  // Format as XXX-XXX
  const firstPart = digits.slice(0, 3).join("");
  const secondPart = digits.slice(3, 6).join("");
  
  return `${firstPart}-${secondPart}`;
}

/**
 * Validates a share code format (XXX-XXX)
 * @param code The code to validate
 * @returns boolean indicating if the code is valid
 */
export function isValidShareCode(code: string): boolean {
  // Code should match the pattern XXX-XXX where X is a digit
  const pattern = /^\d{3}-\d{3}$/;
  return pattern.test(code);
}

/**
 * Formats a raw 6-digit string into a properly formatted share code
 * @param digits The raw digits (up to 6)
 * @returns A formatted share code with a dash in the middle
 */
export function formatShareCode(digits: string): string {
  // Remove any non-digit characters
  const cleanDigits = digits.replace(/\D/g, "").slice(0, 6);
  
  // If less than 4 digits, no dash
  if (cleanDigits.length < 4) return cleanDigits;
  
  // Add dash after the third digit
  return `${cleanDigits.substring(0, 3)}-${cleanDigits.substring(3)}`;
}
