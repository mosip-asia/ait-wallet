import React from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useTheme} from '../theme';

interface Props {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  prefix?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  testID?: string;
}

/** Labeled input with an optional static prefix (e.g. a dial code). */
export const AitTextField: React.FC<Props> = ({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  keyboardType = 'default',
  maxLength,
  testID,
}) => {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, {color: theme.colors.textMuted}]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {borderColor: '#D8DEDB', borderRadius: theme.radius.md},
        ]}>
        {prefix ? (
          <Text style={[styles.prefix, {color: theme.colors.textPrimary}]}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          testID={testID}
          style={[styles.input, {color: theme.colors.textPrimary}]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {width: '100%'},
  label: {fontSize: 13, fontWeight: '500', marginBottom: 8},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    height: 54,
    paddingHorizontal: 16,
  },
  prefix: {fontSize: 16, fontWeight: '600', marginRight: 8},
  input: {flex: 1, fontSize: 16, padding: 0},
});
