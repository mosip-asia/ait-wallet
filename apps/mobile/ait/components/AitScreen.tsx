import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../theme';

interface Props {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
}

/** White canvas, generous spacing, optional pinned footer for the primary CTA. */
export const AitScreen: React.FC<Props> = ({
  title,
  subtitle,
  children,
  footer,
  contentStyle,
}) => {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, {backgroundColor: theme.colors.surface}]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      <View style={styles.container}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {title ? (
            <Text style={[styles.title, {color: theme.colors.textPrimary}]}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.subtitle, {color: theme.colors.textMuted}]}>
              {subtitle}
            </Text>
          ) : null}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1},
  container: {flex: 1, paddingHorizontal: 24},
  flex: {flex: 1},
  scrollContent: {flexGrow: 1, paddingTop: 24, paddingBottom: 16},
  title: {fontSize: 26, fontWeight: '700', marginBottom: 8},
  subtitle: {fontSize: 15, lineHeight: 22, marginBottom: 24},
  content: {flex: 1},
  footer: {paddingVertical: 16, gap: 12},
});
