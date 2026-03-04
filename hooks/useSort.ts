import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
    key: keyof T | string;
    direction: SortDirection;
}

/**
 * A highly performant global sorting hook.
 * @param data Array of objects to sort
 * @param defaultSort Optional default sorting configuration
 * @param valueExtractors Optional map of functions to extract/resolve values for specific keys (e.g. mapping IDs to Names in O(1))
 */
export function useSort<T>(
    data: T[],
    defaultSort: SortConfig<T> | null = null,
    valueExtractors?: Record<string, (item: T) => any>
) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultSort);

    const handleSort = (key: keyof T | string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;

        const sortableItems = [...data];

        sortableItems.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            // Use custom extractor if provided for the specific key, otherwise access directly
            if (valueExtractors && valueExtractors[sortConfig.key as string]) {
                aValue = valueExtractors[sortConfig.key as string](a);
                bValue = valueExtractors[sortConfig.key as string](b);
            } else {
                aValue = a[sortConfig.key as keyof T];
                bValue = b[sortConfig.key as keyof T];
            }

            // Normalization for robust comparison
            if (typeof aValue === 'string') aValue = aValue.toLowerCase().trim();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase().trim();

            // Handling nulls/undefined natively
            if (aValue == null) aValue = '';
            if (bValue == null) bValue = '';

            // Boolean resolution (true -> 1, false -> 0)
            if (typeof aValue === 'boolean') aValue = aValue ? 1 : 0;
            if (typeof bValue === 'boolean') bValue = bValue ? 1 : 0;

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sortableItems;
    }, [data, sortConfig, valueExtractors]);

    return {
        sortedData,
        sortConfig,
        handleSort,
    };
}
