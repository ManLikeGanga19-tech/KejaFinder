import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Badge } from '../../src/components/ui/Badge';

describe('<Badge />', () => {
  it('renders the label', () => {
    render(<Badge label="Featured" variant="featured" />);
    expect(screen.getByText('Featured')).toBeTruthy();
  });

  it('renders all variants without crashing', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'surface', 'verified', 'featured', 'locked'] as const;
    for (const v of variants) {
      const { unmount } = render(<Badge label={v} variant={v} />);
      expect(screen.getByText(v)).toBeTruthy();
      unmount();
    }
  });

  it('uppercases label visually via textTransform', () => {
    render(<Badge label="verified" variant="verified" />);
    const text = screen.getByText('verified');
    const flat = Array.isArray(text.props.style)
      ? Object.assign({}, ...(text.props.style as unknown[]).flat(Infinity).filter(Boolean))
      : text.props.style;
    expect(flat.textTransform).toBe('uppercase');
  });
});
