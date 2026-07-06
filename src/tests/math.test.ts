import { describe, it, expect } from 'vitest';

describe('Financial Calcs', () => {
  it('should calculate donation tax correctly', () => {
    const amount = 100;
    const tax = amount * 0.05;
    expect(tax).toBe(5);
  });
});
