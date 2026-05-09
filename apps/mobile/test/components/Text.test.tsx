import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from '../../src/components/ui/Text';

const flatStyles = (style: unknown) =>
  Array.isArray(style)
    ? Object.assign({}, ...(style as unknown[]).flat(Infinity).filter(Boolean))
    : style;

describe('<Text />', () => {
  it('renders children', () => {
    render(<Text>Hello world</Text>);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('applies the default bodyMedium variant', () => {
    render(<Text>Default</Text>);
    const node = screen.getByText('Default');
    expect(flatStyles(node.props.style).fontFamily).toBe('Inter');
  });

  it('applies headlineLarge variant styles', () => {
    render(<Text variant="headlineLarge">Big</Text>);
    const node = screen.getByText('Big');
    const styles = flatStyles(node.props.style);
    expect(styles.fontFamily).toBe('Manrope');
    expect(styles.fontSize).toBe(32);
  });

  it('overrides color prop', () => {
    render(<Text color="#ff0000">Red</Text>);
    const node = screen.getByText('Red');
    expect(flatStyles(node.props.style).color).toBe('#ff0000');
  });

  it('forwards extra style prop', () => {
    render(<Text style={{ marginTop: 10 }}>Spaced</Text>);
    const node = screen.getByText('Spaced');
    expect(flatStyles(node.props.style).marginTop).toBe(10);
  });
});
