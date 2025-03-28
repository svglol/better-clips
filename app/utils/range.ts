export const rangeOptions = [
  { label: 'All time', duration: { years: 100 }, query: 'all' },
  { label: 'Last year', duration: { years: 1 }, query: 'year' },
  { label: 'Last 6 months', duration: { months: 6 }, query: '6m' },
  { label: 'Last 3 months', duration: { months: 3 }, query: '3m' },
  { label: 'Last 30 days', duration: { days: 30 }, query: '30d' },
  { label: 'Last 14 days', duration: { days: 14 }, query: '14d' },
  { label: 'Last 7 days', duration: { days: 7 }, query: '7d' },
  { label: 'Last day', duration: { days: 1 }, query: '1d' },
  { label: 'Custom', duration: { days: 1 }, query: 'custom' },
]
