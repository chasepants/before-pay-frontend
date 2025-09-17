import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  const defaultProps = {
    name: 'Test Product',
    price: '$99.99',
    url: 'https://example.com/product',
    imageUrl: 'https://example.com/image.jpg',
    source: 'Test Store',
    sourceIcon: 'https://example.com/icon.png',
    onButtonClick: jest.fn(),
    isInSavings: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render product card with basic information', () => {
    render(<ProductCard {...defaultProps} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('Test Store')).toBeInTheDocument();
    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
    expect(screen.getByAltText('Test Store icon')).toBeInTheDocument();
  });

  it('should render product card with placeholder image when imageUrl is not provided', () => {
    const propsWithoutImage = { ...defaultProps, imageUrl: undefined };
    render(<ProductCard {...propsWithoutImage} />);
    
    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', 'https://via.placeholder.com/200');
  });

  it('should render old price when provided', () => {
    const propsWithOldPrice = { ...defaultProps, oldPrice: '$149.99' };
    render(<ProductCard {...propsWithOldPrice} />);
    
    expect(screen.getByText('$149.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toHaveClass('text-muted');
  });

  it('should not render old price when not provided', () => {
    render(<ProductCard {...defaultProps} />);
    
    expect(screen.queryByText('$149.99')).not.toBeInTheDocument();
  });

  it('should render rating and reviews when provided', () => {
    const propsWithRating = {
      ...defaultProps,
      rating: 4.5,
      reviews: 123
    };
    render(<ProductCard {...propsWithRating} />);
    
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/123 reviews/)).toBeInTheDocument();
  });

  it('should not render rating when not provided', () => {
    render(<ProductCard {...defaultProps} />);
    
    expect(screen.queryByText(/4\.5/)).not.toBeInTheDocument();
    expect(screen.queryByText(/123 reviews/)).not.toBeInTheDocument();
  });

  it('should render "ADD TO SAVINGS" button when not in savings', () => {
    render(<ProductCard {...defaultProps} />);
    
    const button = screen.getByText('ADD TO SAVINGS');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-primary', 'w-100');
  });

  it('should render "Added ✓" when in savings', () => {
    const propsInSavings = { ...defaultProps, isInSavings: true };
    render(<ProductCard {...propsInSavings} />);
    
    expect(screen.getByText('Added ✓')).toBeInTheDocument();
    expect(screen.getByText('Added ✓')).toHaveClass('text-success');
    expect(screen.queryByText('ADD TO SAVINGS')).not.toBeInTheDocument();
  });

  it('should call onButtonClick when "ADD TO SAVINGS" button is clicked', () => {
    const mockOnButtonClick = jest.fn();
    const propsWithClick = { ...defaultProps, onButtonClick: mockOnButtonClick };
    render(<ProductCard {...propsWithClick} />);
    
    const button = screen.getByText('ADD TO SAVINGS');
    fireEvent.click(button);
    
    expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
  });

  it('should prevent default behavior when button is clicked', () => {
    const mockOnButtonClick = jest.fn();
    const propsWithClick = { ...defaultProps, onButtonClick: mockOnButtonClick };
    render(<ProductCard {...propsWithClick} />);
    
    const button = screen.getByText('ADD TO SAVINGS');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault');
    
    fireEvent(button, clickEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should render all optional props when provided', () => {
    const propsWithAllOptions = {
      ...defaultProps,
      oldPrice: '$149.99',
      rating: 4.5,
      reviews: 123,
      badge: 'Best Seller',
      tag: 'Electronics',
      delivery: 'Free Shipping'
    };
    render(<ProductCard {...propsWithAllOptions} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
    expect(screen.getByText('Test Store')).toBeInTheDocument();
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/123 reviews/)).toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    render(<ProductCard {...defaultProps} />);
    
    const card = screen.getByText('Test Product').closest('.card');
    expect(card).toHaveClass('card', 'h-100');
    
    const cardBody = screen.getByText('Test Product').closest('.card-body');
    expect(cardBody).toHaveClass('card-body', 'd-flex', 'flex-column');
    
    const cardTitle = screen.getByText('Test Product');
    expect(cardTitle).toHaveClass('card-title');
    
    const price = screen.getByText('$99.99');
    expect(price).toHaveClass('text-success', 'fw-bold');
  });

  it('should render star icons for rating', () => {
    const propsWithRating = {
      ...defaultProps,
      rating: 4.5,
      reviews: 123
    };
    const { container } = render(<ProductCard {...propsWithRating} />);
    
    const starFillIcons = container.querySelectorAll('.bi-star-fill');
    const starHalfIcons = container.querySelectorAll('.bi-star-half');
    
    expect(starFillIcons).toHaveLength(4);
    expect(starHalfIcons).toHaveLength(1);
  });
});
