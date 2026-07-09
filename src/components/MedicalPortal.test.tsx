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
    
    // Default tab should be patients
    expect(screen.getByText('أحمد محمود')).toBeInTheDocument();

    // Click on medicines tab
    const medicinesTab = screen.getByText('صيدلية التكافل (الأدوية)');
    fireEvent.click(medicinesTab);

    // Medicines should be visible
    expect(screen.getByText('أنسولين')).toBeInTheDocument();

    // Click on equipment tab
    const equipmentTab = screen.getByText('المعدات الطبية');
    fireEvent.click(equipmentTab);

    // Equipment should be visible
    expect(screen.getByText('جهاز تنفس صناعي')).toBeInTheDocument();
  });
});
