import React from 'react';
import { StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';
import { Text } from './Text';

interface Props {
  children: React.ReactNode;
  color?: string;
}

/** Small uppercase eyebrow label per wireframes — e.g. "HANDPICKED FOR YOU". */
export function Eyebrow({ children, color = Colors.secondary }: Props) {
  return <Text style={[styles.text, { color }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
