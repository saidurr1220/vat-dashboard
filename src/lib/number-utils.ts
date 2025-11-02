/**
 * Rounds a number to 2 decimal places with proper rounding
 * If 3rd decimal >= 5, rounds up the 2nd decimal
 */
export function roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a number with proper rounding and locale string
 */
export function formatCurrency(num: number): string {
    const rounded = roundToTwoDecimals(num);
    return rounded.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Calculates total cost with proper rounding
 */
export function calculateTotalCost(
    assessableValue: number = 0,
    baseVat: number = 0,
    sd: number = 0,
    vat: number = 0,
    at: number = 0
): number {
    const total = assessableValue + baseVat + sd + vat + at;
    return roundToTwoDecimals(total);
}