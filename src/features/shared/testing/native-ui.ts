import { fireEvent, screen } from '@testing-library/react-native';

/**
 * `@expo/ui` controls under Jest. They render as native SwiftUI views (Jest runs as iOS), so there
 * is no text node inside a button and no `press` / `changeText` to fire — but the views receive
 * their label, state and event props, and these helpers read and fire those, by `testID`.
 *
 * They exercise what the screen wires up; the native controls themselves are covered by the
 * Maestro flows.
 */

interface Modifier {
  $type: string;
  [key: string]: unknown;
}

function element(testID: string) {
  return screen.getByTestId(testID);
}

/** The text a `Button` shows (its `Text` child, or its `label`). */
export function buttonText(testID: string): string {
  const { children, label } = element(testID).props as {
    children?: { props?: { children?: unknown } };
    label?: string;
  };
  return String(children?.props?.children ?? label ?? '');
}

/** Whether the control is disabled (the SwiftUI `disabled` modifier). */
export function isDisabled(testID: string): boolean {
  const modifiers = (element(testID).props.modifiers ?? []) as Modifier[];
  return modifiers.some((modifier) => modifier.$type === 'disabled' && modifier.disabled === true);
}

export async function pressButton(testID: string): Promise<void> {
  await fireEvent(element(testID), 'buttonPress');
}

/** Types into a `TextInput` (the whole new value, as the native field reports it). */
export async function typeText(testID: string, value: string): Promise<void> {
  await fireEvent(element(testID), 'textChange', { nativeEvent: { value } });
}

/** Whether a `Switch` is on. */
export function isSwitchOn(testID: string): boolean {
  return element(testID).props.isOn === true;
}

export async function setSwitch(testID: string, isOn: boolean): Promise<void> {
  await fireEvent(element(testID), 'isOnChange', { nativeEvent: { isOn } });
}
