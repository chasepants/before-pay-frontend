import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingAnimation from './LoadingAnimation';

describe('LoadingAnimation', () => {
  it('should render loading animation with logo', () => {
    render(<LoadingAnimation />);
    
    expect(screen.getByAltText('Stashpay Logo')).toBeInTheDocument();
    expect(screen.getByAltText('Stashpay Logo')).toHaveAttribute('src', expect.stringContaining('beforepay-logo.png'));
  });

  it('should render three dots for animation', () => {
    render(<LoadingAnimation />);
    
    const dots = screen.getAllByRole('generic');
    const dotElements = dots.filter(dot => dot.classList.contains('dot'));
    expect(dotElements).toHaveLength(3);
  });

  it('should have correct CSS classes', () => {
    render(<LoadingAnimation />);
    
    const container = screen.getByAltText('Stashpay Logo').closest('.loading-container');
    expect(container).toBeInTheDocument();
    
    const logo = screen.getByAltText('Stashpay Logo');
    expect(logo).toHaveClass('logo');
  });

  it('should render all elements in correct structure', () => {
    const { container } = render(<LoadingAnimation />);
    
    const loadingContainer = container.querySelector('.loading-container');
    expect(loadingContainer).toBeInTheDocument();
    
    const dots = loadingContainer.querySelectorAll('.dot');
    expect(dots).toHaveLength(3);
    
    const logo = loadingContainer.querySelector('.logo');
    expect(logo).toBeInTheDocument();
  });
});
