import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/** AIT primary action = filled forest green; secondary = green outline; ghost = text only. */
export const AitButton: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}) => {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const backgroundColor = disabled
    ? '#C8D6CE'
    : isPrimary
    ? theme.colors.primary
    : 'transparent';
  const textColor = isPrimary
    ? theme.colors.navBarText
    : disabled
    ? theme.colors.textMuted
    : theme.colors.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        {
          backgroundColor,
          borderColor: isSecondary ? theme.colors.primary : 'transparent',
          borderWidth: isSecondary ? 1.5 : 0,
          borderRadius: theme.radius.md,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, {color: textColor}]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 54,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {fontSize: 16, fontWeight: '600', letterSpacing: 0.2},
});
