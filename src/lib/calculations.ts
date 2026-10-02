export type BudgetStatus = 'On Track' | 'Near Limit' | 'Over Budget'

export function sumAmounts(values: Array<number | string | null | undefined>): number {
  return values.reduce<number>((sum, value) => sum + (Number(value) || 0), 0)
}

export function savings(income: number, expenses: number): number { return income - expenses }
export function savingsRate(income: number, expenses: number): number { return income > 0 ? savings(income, expenses) / income : 0 }
export function budgetDifference(planned: number, actual: number): number { return planned - actual }
export function budgetUtilization(planned: number, actual: number): number { return planned > 0 ? actual / planned : 0 }
export function budgetStatus(planned: number, actual: number): BudgetStatus {
  if (planned === 0 && actual > 0) return 'Over Budget'
  const ratio = budgetUtilization(planned, actual)
  if (ratio > 1) return 'Over Budget'
  if (ratio >= 0.81) return 'Near Limit'
  return 'On Track'
}
