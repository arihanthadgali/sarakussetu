import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type TextFieldProps = TextInputProps & {
  label: string;
  /** Fixed, non-editable prefix shown inside the field (display only). */
  prefix?: string;
  error?: string | null;
  hint?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, prefix, error, hint, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.borderStrong;

  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.field, { borderColor }]}>
        {prefix ? (
          <View style={styles.prefix}>
            <AppText variant="label" color="textMuted">
              {prefix}
            </AppText>
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          {...rest}
          accessibilityLabel={rest.accessibilityLabel ?? label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, style]}
        />
      </View>
      {error ? (
        <AppText variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textMuted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  prefix: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRightWidth: 1.5,
    borderRightColor: colors.borderStrong,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.semibold,
    fontSize: 17,
    color: colors.text,
    letterSpacing: 0.5,
  },
});
