export interface FilterOption {
    id: string,
    label: string,
    tags?: string[],
    values: string[],
    selection: string[],
    tooltip?: string,
}