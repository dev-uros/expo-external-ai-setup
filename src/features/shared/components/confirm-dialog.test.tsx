import { render } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { ConfirmDialog } from '@/features/shared/components/confirm-dialog';

/**
 * The system-alert variant (iOS, and the default file). The Android Material dialog is native
 * Compose and is covered by the Maestro flows.
 */

const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

beforeEach(() => alertSpy.mockClear());

async function show(props: { destructive?: boolean; cancelLabel?: string } = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const view = await render(
    <ConfirmDialog
      visible
      title="Odjava"
      message="Da li ste sigurni?"
      confirmLabel="Odjavi se"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  const [title, message, buttons, options] = alertSpy.mock.calls.at(-1)!;
  return { view, title, message, buttons: buttons as AlertButton[], options, onConfirm, onCancel };
}

test('asks the question with a cancel and a confirm', async () => {
  const { title, message, buttons } = await show();

  expect(title).toBe('Odjava');
  expect(message).toBe('Da li ste sigurni?');
  expect(buttons.map((b) => [b.text, b.style])).toEqual([
    ['Otkaži', 'cancel'],
    ['Odjavi se', 'default'],
  ]);
});

test('a destructive confirm is marked so, and the cancel label can change', async () => {
  const { buttons } = await show({ destructive: true, cancelLabel: 'Nastavi izmenu' });

  expect(buttons.map((b) => [b.text, b.style])).toEqual([
    ['Nastavi izmenu', 'cancel'],
    ['Odjavi se', 'destructive'],
  ]);
});

test('each button reports its own choice', async () => {
  const { buttons, onConfirm, onCancel } = await show();

  buttons[0]!.onPress?.();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();

  buttons[1]!.onPress?.();
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('dismissing it any other way counts as cancel', async () => {
  const { options, onCancel } = await show();

  expect(options).toMatchObject({ cancelable: true });
  options?.onDismiss?.();
  expect(onCancel).toHaveBeenCalledTimes(1);
});

test('opens once, not on every re-render', async () => {
  const { view } = await show();

  await view.rerender(
    <ConfirmDialog
      visible
      title="Odjava"
      message="Da li ste sigurni?"
      confirmLabel="Odjavi se"
      onConfirm={jest.fn()}
      onCancel={jest.fn()}
    />
  );

  expect(alertSpy).toHaveBeenCalledTimes(1);
});

test('nothing is shown while it is not visible', async () => {
  await render(
    <ConfirmDialog
      visible={false}
      title="Odjava"
      message="?"
      confirmLabel="Da"
      onConfirm={jest.fn()}
      onCancel={jest.fn()}
    />
  );

  expect(alertSpy).not.toHaveBeenCalled();
});
