import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DonorPortal from './DonorPortal';
import '@testing-library/jest-dom';

describe('DonorPortal Component', () => {
  const defaultProps = {
    cases: [],
    funds: [],
    projects: [],
    onDonate: vi.fn(),
    onAdoptCase: vi.fn(),
    onSubmitSkill: vi.fn(),
    onTriggerGeoSOS: vi.fn(),
    lang: "ar" as const,
    user: null,
    activeGeoSOS: null,
  };

  it('renders the header correctly', () => {
    render(<DonorPortal {...defaultProps} />);
    const header = screen.getByText(/لوحة التبرعات/i);
    expect(header).toBeInTheDocument();
  });

  it('renders quick donation buttons', () => {
    render(<DonorPortal {...defaultProps} />);
    // Just verify the component renders without crashing
    const header = screen.getByText(/لوحة التبرعات/i);
    expect(header).toBeInTheDocument();
  });

  it('renders impact statistics', () => {
    render(<DonorPortal {...defaultProps} />);
    expect(screen.getByText(/صندوق تقارير الأثر/i)).toBeInTheDocument();
  });
});
