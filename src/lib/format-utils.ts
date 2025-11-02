/**
 * Utility functions for formatting numbers and currency
 */

/**
 * Format number to millions with appropriate suffix
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with M suffix for millions
 */
export function formatToMillions(value: number, decimals: number = 1): string {
    if (value === 0) return '0';

    const millions = value / 1000000;

    if (millions >= 1) {
        return `${millions.toFixed(decimals)}M`;
    } else if (value >= 1000) {
        const thousands = value / 1000;
        return `${thousands.toFixed(decimals)}K`;
    } else {
        return value.toFixed(0);
    }
}

/**
 * Format currency with Taka symbol and millions
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted currency string
 */
export function formatCurrencyToMillions(value: number, decimals: number = 1): string {
    return `Tk${formatToMillions(value, decimals)}`;
}

/**
 * Format number with commas for regular display
 * @param value - The number to format
 * @returns Formatted string with commas
 */
export function formatWithCommas(value: number): string {
    return value.toLocaleString();
}

/**
 * Format currency with Taka symbol and commas
 * @param value - The number to format
 * @returns Formatted currency string with commas
 */
export function formatCurrency(value: number): string {
    return `Tk${formatWithCommas(value)}`;
}

/**
 * Get appropriate display format based on value size
 * @param value - The number to check
 * @param threshold - Threshold for switching to millions (default: 1000000)
 * @returns Object with formatted value and whether it's in millions
 */
export function getDisplayFormat(value: number, threshold: number = 1000000) {
    const useMillions = value >= threshold;
    return {
        formatted: useMillions ? formatCurrencyToMillions(value) : formatCurrency(value),
        isMillions: useMillions,
        original: value
    };
}