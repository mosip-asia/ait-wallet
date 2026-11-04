import React, {useRef} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useTheme} from '../theme';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  length?: number;
  mask?: boolean;
  testID?: string;
}

/** Boxed code field: visible digit boxes over one hidden input. mask=true shows dots (PIN). */
export const AitOtpInput: React.FC<Props> = ({
  value,
  onChangeText,
  length = 6,
  mask = false,
  testID,
}) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const boxes = Array.from({length});

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {boxes.map((_, i) => {
        const char = value[i] ?? '';
        const filled = char !== '';
        return (
          <View
            key={i}
            style={[
              styles.box,
              {
                borderColor: filled ? theme.colors.primary : '#D8DEDB',
                borderRadius: theme.radius.md,
              },
            ]}>
            <Text style={[styles.char, {color: theme.colors.textPrimary}]}>
              {filled ? (mask ? '●' : char) : ''}
            </Text>
          </View>
        );
      })}
      <TextInput
        testID={testID}
        ref={inputRef}
        style={styles.hidden}
        value={value}
        onChangeText={t => onChangeText(t.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        secureTextEntry={mask}
        autoFocus
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', justifyContent: 'space-between', width: '100%'},
  box: {
    flex: 1,
    height: 56,
    marginHorizontal: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  char: {fontSize: 22, fontWeight: '700'},
  hidden: {position: 'absolute', opacity: 0, height: 56, width: '100%'},
});
