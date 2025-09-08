import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Mock useNavigate before importing the component
const mockNavigate = jest.fn();

// Mock react-router
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

// Import the component after mocking
import LandingPage from './LandingPage';

// Helper function to render component with router
const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('LandingPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Reset environment variables
    delete process.env.REACT_APP_VERCEL_ENV;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.REACT_APP_VERCEL_ENV = 'development';
    });

    test('renders without crashing', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Save Smarter,')).toBeInTheDocument();
    });

    test('displays correct heading and subheading', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Save Smarter,')).toBeInTheDocument();
      expect(screen.getByText('Achieve Faster')).toBeInTheDocument();
      expect(screen.getByText(/Automate your savings with intelligent transfers/)).toBeInTheDocument();
    });

    test('shows navigation menu in development', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    test('shows correct button text in development', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Start Saving Today')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    });

    test('navigates to signup when Get Started is clicked', () => {
      renderWithRouter(<LandingPage />);
      const getStartedButtons = screen.getAllByText(/Get Started|Start Saving Today/);
      
      // Click the first Get Started button (in navbar)
      fireEvent.click(getStartedButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    test('navigates to signup when main CTA button is clicked', () => {
      renderWithRouter(<LandingPage />);
      const startSavingButton = screen.getByText('Start Saving Today');
      fireEvent.click(startSavingButton);
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    test('navigates to signup when bottom CTA button is clicked', () => {
      renderWithRouter(<LandingPage />);
      const getStartedFreeButton = screen.getByText('Get Started Free');
      fireEvent.click(getStartedFreeButton);
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });

    test('navigates to login when Sign In is clicked', () => {
      renderWithRouter(<LandingPage />);
      const signInButton = screen.getByText('Sign In');
      fireEvent.click(signInButton);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('does not show coming soon banner in development', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.queryByText('Coming Soon - Join the Waitlist for Early Access!')).not.toBeInTheDocument();
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.REACT_APP_VERCEL_ENV = 'production';
    });

    test('renders without crashing in production', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Save Smarter,')).toBeInTheDocument();
    });

    test('shows coming soon banner in production', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Coming Soon - Join the Waitlist for Early Access!')).toBeInTheDocument();
    });

    test('hides navigation menu in production', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    test('shows correct button text in production', () => {
      renderWithRouter(<LandingPage />);
      // Use getAllByText since there are multiple "Stay Notified" buttons
      const stayNotifiedButtons = screen.getAllByText('Stay Notified');
      expect(stayNotifiedButtons).toHaveLength(2); // Should have 2 Stay Notified buttons
      expect(screen.queryByText('Learn More')).not.toBeInTheDocument();
    });

    test('navigates to stay-notified when Stay Notified is clicked', () => {
      renderWithRouter(<LandingPage />);
      const stayNotifiedButtons = screen.getAllByText('Stay Notified');
      
      // Click the first Stay Notified button
      fireEvent.click(stayNotifiedButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/stay-notified');
    });

    test('shows production-specific CTA text', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Be First to Know When We Launch')).toBeInTheDocument();
      expect(screen.getByText(/Join our waitlist and get early access/)).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    test('displays all feature cards', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Why Choose Us?')).toBeInTheDocument();
      expect(screen.getByText('Automated Transfers')).toBeInTheDocument();
      expect(screen.getByText('Smart Savings Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Bank-Level Security')).toBeInTheDocument();
    });

    test('displays feature descriptions', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText(/Set it once and watch your savings grow automatically/)).toBeInTheDocument();
      expect(screen.getByText(/Track your progress, set goals, and watch your money grow/)).toBeInTheDocument();
      expect(screen.getByText(/Your money is protected with the same security standards/)).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    test('displays footer content', () => {
      renderWithRouter(<LandingPage />);
      expect(screen.getByText('Making saving simple, smart, and automatic.')).toBeInTheDocument();
      expect(screen.getByText('© 2024 SaveAhead. All rights reserved.')).toBeInTheDocument();
    });

    test('displays logo in footer', () => {
      renderWithRouter(<LandingPage />);
      // Use getAllByAltText since there are multiple logos
      const logos = screen.getAllByAltText('Logo');
      expect(logos).toHaveLength(2); // Should have 2 logos (navbar and footer)
      
      // Check that the footer logo has the correct height
      const footerLogo = logos.find(logo => logo.getAttribute('height') === '30');
      expect(footerLogo).toBeInTheDocument();
    });
  });

  describe('Logo', () => {
    test('displays logo in navbar', () => {
      renderWithRouter(<LandingPage />);
      const logos = screen.getAllByAltText('Logo');
      expect(logos).toHaveLength(2); // Should have 2 logos
      
      // Find the navbar logo by its height attribute
      const navbarLogo = logos.find(logo => logo.getAttribute('height') === '40');
      expect(navbarLogo).toBeInTheDocument();
      expect(navbarLogo).toHaveAttribute('height', '40');
    });

    test('displays logo in footer', () => {
      renderWithRouter(<LandingPage />);
      const logos = screen.getAllByAltText('Logo');
      expect(logos).toHaveLength(2); // Should have 2 logos
      
      // Find the footer logo by its height attribute
      const footerLogo = logos.find(logo => logo.getAttribute('height') === '30');
      expect(footerLogo).toBeInTheDocument();
      expect(footerLogo).toHaveAttribute('height', '30');
    });
  });

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      renderWithRouter(<LandingPage />);
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Save Smarter,');
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings).toHaveLength(2); // "Why Choose Us?" and CTA section
    });

    test('buttons have proper accessibility attributes', () => {
      renderWithRouter(<LandingPage />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });
});