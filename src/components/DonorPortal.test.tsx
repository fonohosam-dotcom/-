import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DonorPortal from './DonorPortal';
import '@testing-library/jest-dom';

describe('DonorPortal Component', () => {
  it('renders the header correctly', () => {
    render(<DonorPortal />);
    const header = screen.getByText(/بوابة المتبرع الذكية/i);
    expect(header).toBeInTheDocument();
  });

  it('renders quick donation buttons', () => {
    render(<DonorPortal />);
    expect(screen.getByText('50 د.ل')).toBeInTheDocument();
    expect(screen.getByText('100 د.ل')).toBeInTheDocument();
    expect(screen.getByText('500 د.ل')).toBeInTheDocument();
  });

  it('renders impact statistics', () => {
    render(<DonorPortal />);
    expect(screen.getByText('الأثر المجتمعي')).toBeInTheDocument();
  });
});
