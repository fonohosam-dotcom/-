import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CitizenPortal from './CitizenPortal';
import '@testing-library/jest-dom';

describe('CitizenPortal Component', () => {
  const mockUser = {
    id: "u1",
    role: "citizen" as const,
    name: "مواطن تجريبي",
    fullName: "مواطن تجريبي",
    email: "citizen@example.com",
    nationalId: "111222333",
    gamificationPoints: 0
  };

  it('renders the portal with empty case state', () => {
    render(
      <CitizenPortal 
        user={mockUser} 
        citizenCase={null} 
        onRegisterCase={vi.fn()} 
        onUpdateFamily={vi.fn()} 
      />
    );
    
    // Check for the call to action when no case exists
    const newCaseBtn = screen.getByText(/تسجيل طلب مساعدة جديد/i);
    expect(newCaseBtn).toBeInTheDocument();
  });
});
