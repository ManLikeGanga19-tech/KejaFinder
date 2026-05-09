import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../../src/components/ui/Button';

describe('<Button />', () => {
  it('renders the label', () => {
    render(<Button label="Continue" onPress={() => {}} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="Tap me" onPress={onPress} />);
    fireEvent.press(screen.getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Disabled" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button label="Loading" onPress={onPress} loading />);
    expect(screen.queryByText('Loading')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it.each(['primary', 'secondary', 'outline', 'ghost', 'mpesa'] as const)(
    'renders %s variant',
    (variant) => {
      render(<Button label={variant} variant={variant} onPress={() => {}} />);
      expect(screen.getByText(variant)).toBeTruthy();
    },
  );
});
