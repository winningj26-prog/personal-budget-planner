import { describe, expect, it } from 'vitest'
import { budgetDifference, budgetStatus, budgetUtilization, savings, savingsRate, sumAmounts } from '../src/lib/calculations'

describe('calculation helpers', () => {
  it('sums values', () => expect(sumAmounts([5600, '100', null])).toBe(5700))
  it('calculates savings', () => expect(savings(5600, 2460)).toBe(3140))
  it('calculates savings rate', () => expect(savingsRate(5600, 2460)).toBeCloseTo(0.560714, 5))
  it('calculates budget difference', () => expect(budgetDifference(800, 750)).toBe(50))
  it('calculates utilization', () => expect(budgetUtilization(500, 450)).toBe(0.9))
  it('marks 90 percent near limit', () => expect(budgetStatus(500, 450)).toBe('Near Limit'))
  it('marks overspending over budget', () => expect(budgetStatus(500, 600)).toBe('Over Budget'))
  it('handles zero planned amount safely', () => expect(budgetStatus(0, 50)).toBe('Over Budget'))
})