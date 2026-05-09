import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ListingCard } from '../../src/components/listing/ListingCard';

const pushMock = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const baseProps = {
  id: 'listing-1',
  slug: 'apt-kilimani',
  title: '2BR Apartment in Kilimani',
  priceKes: 65000,
  bedrooms: 2,
  bathrooms: 2,
  propertyType: 'apartment',
  city: 'Nairobi',
  area: { name: 'Kilimani', slug: 'kilimani' },
  isLocked: true,
  isVerified: true,
  isFeatured: true,
  unlockPriceKes: 499,
  photos: [],
};

beforeEach(() => { pushMock.mockReset(); });

describe('<ListingCard />', () => {
  it('renders title, location, price', () => {
    render(<ListingCard {...baseProps} />);
    expect(screen.getByText('2BR Apartment in Kilimani')).toBeTruthy();
    expect(screen.getByText('Kilimani')).toBeTruthy();
    expect(screen.getByText('KES 65,000')).toBeTruthy();
  });

  it('shows the unlock chip when locked', () => {
    render(<ListingCard {...baseProps} isLocked />);
    expect(screen.getByText('Unlock KES 499')).toBeTruthy();
  });

  it('hides the unlock chip when unlocked', () => {
    render(<ListingCard {...baseProps} isLocked={false} />);
    expect(screen.queryByText(/Unlock KES/)).toBeNull();
  });

  it('shows Featured + Verified badges when applicable', () => {
    render(<ListingCard {...baseProps} isFeatured isVerified isLocked />);
    expect(screen.getByText('Featured')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('renders bed/bath stats', () => {
    render(<ListingCard {...baseProps} bedrooms={3} bathrooms={2} />);
    expect(screen.getByText('3 bd')).toBeTruthy();
    expect(screen.getByText('2 ba')).toBeTruthy();
  });

  it('navigates to /listing/:id when tapped', () => {
    render(<ListingCard {...baseProps} />);
    fireEvent.press(screen.getByText('2BR Apartment in Kilimani'));
    expect(pushMock).toHaveBeenCalledWith('/listing/listing-1');
  });

  it('falls back to city when no area is provided', () => {
    render(<ListingCard {...baseProps} area={undefined} />);
    expect(screen.getByText('Nairobi')).toBeTruthy();
  });

  it('formats large prices with thousand separators', () => {
    render(<ListingCard {...baseProps} priceKes={1250000} />);
    expect(screen.getByText('KES 1,250,000')).toBeTruthy();
  });
});
