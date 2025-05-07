// GlobalStyles.js
import { StyleSheet } from 'react-native';

// Typography definitions
export const typography = {
  // Font families
  regular: 'BalladofaThinMan',
  bold: 'System-Bold',
  medium: 'System-Medium',
  body: 'ReenieBeanie_Regular', // For body text if you're using this font
  
  // Font sizes
  fontSize: {
    tiny: 10,      // Very small text, disclaimers
    small: 12,     // Secondary information, captions
    regular: 14,   // Regular body text
    medium: 16,    // Important body text
    large: 18,     // Subheadings
    xl: 22,        // Section headers
    xxl: 26,       // Screen titles
    huge: 32       // Large titles, splash screen
  }
};

// Color palette
export const colors = {
  primary: '#d96c47',    // Main brand color (coral/orange)
  secondary: '#a25c47',  // Secondary brand color (darker rust)
  accent: '#e5b769',     // Accent color (mustard yellow)
  background: '#f5efe7', // Background color (soft beige)
  card: '#fffaf5',       // Card background (cream)
  text: {
    dark: '#2f2f2f',     // Primary text (almost black)
    medium: '#555555',   // Secondary text (dark gray)
    light: '#888888'     // Tertiary text (light gray)
  },
  success: '#9cbf9c',    // Success color (sage green)
  error: '#e74c3c',      // Error color (red)
  border: '#f4d6c2'      // Border color (light peach)
};

// Shared styles that can be used across components
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenTitle: {
    fontFamily: typography.regular,
    fontSize: typography.fontSize.huge,
    color: colors.primary,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: typography.regular,
    fontSize: typography.fontSize.xl,
    color: colors.secondary,
    marginBottom: 12,
  },
  paragraph: {
    fontFamily: typography.body || typography.regular,
    fontSize: typography.fontSize.medium,
    color: colors.text.dark,
    lineHeight: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.regular,
    fontSize: typography.fontSize.medium,
    color: colors.text.dark,
  }
});

// Spacing constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

// Border radius constants
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  round: 999 // For circular elements
};