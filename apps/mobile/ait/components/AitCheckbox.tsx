import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testID?: string;
}

export const AitCheckbox: React.FC<Props> = ({
  checked,
  onToggle,
  label,
  testID,
}) => {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      style={styles.row}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{checked}}>
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.colors.primary : '#C2CAC6',
            backgroundColor: checked ? theme.colors.primary : 'transparent',
            borderRadius: theme.radius.sm,
          },
        ]}>
        {checked ? <Text style={styles.tick}>✓</Text> : null}
      </View>
      <Text style={[styles.label, {color: theme.colors.textPrimary}]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tick: {color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 16},
  label: {flex: 1, fontSize: 14, lineHeight: 20},
});
