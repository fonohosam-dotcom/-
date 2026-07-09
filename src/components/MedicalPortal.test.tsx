import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MedicalPortal from './MedicalPortal';
import '@testing-library/jest-dom';

describe('MedicalPortal Component', () => {
  it('renders the header correctly', () => {
    render(<MedicalPortal />);
    const heading = screen.getByText(/بوابة العلاج الشاملة/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders all three navigation tabs', () => {
    render(<MedicalPortal />);
    
    expect(screen.getByText('المرضى والحالات')).toBeInTheDocument();
    expect(screen.getByText('صيدلية التكافل (الأدوية)')).toBeInTheDocument();
    expect(screen.getByText('المعدات الطبية')).toBeInTheDocument();
  });

  it('switches between tabs when clicked', () => {
    render(<MedicalPortal />);
    
    // Click on medicines tab
    const medicinesTab = screen.getByText('صيدلية التكافل (الأدوية)');
    fireEvent.click(medicinesTab);

    // Click on equipment tab
    const equipmentTab = screen.getByText('المعدات الطبية');
    fireEvent.click(equipmentTab);
  });
});
