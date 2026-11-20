import AdminIcon from '@expo/material-symbols/admin_panel_settings.xml';
import BlockIcon from '@expo/material-symbols/block.xml';
import CheckIcon from '@expo/material-symbols/check_circle.xml';
import EditIcon from '@expo/material-symbols/edit.xml';
import MailIcon from '@expo/material-symbols/mail.xml';
import MoreIcon from '@expo/material-symbols/more_vert.xml';
import { Stack } from 'expo-router/stack';
import type { ComponentProps } from 'react';

import type { UserAction } from '@/features/users/utils/user-actions';

const ios = process.env.EXPO_OS === 'ios';

type MenuIcon = ComponentProps<typeof Stack.Toolbar.MenuAction>['icon'];

/** Each action's words and icons — SF Symbols on iOS, Material Symbols on Android. */
const ITEMS: Record<UserAction, { label: string; icon: MenuIcon; destructive?: boolean }> = {
  edit: { label: 'Izmeni podatke', icon: ios ? 'pencil' : EditIcon },
  changeRole: { label: 'Promeni ulogu', icon: ios ? 'person.badge.shield.checkmark' : AdminIcon },
  resendActivation: { label: 'Pošalji aktivacioni link', icon: ios ? 'envelope' : MailIcon },
  reactivate: { label: 'Uključi nalog', icon: ios ? 'checkmark.circle' : CheckIcon },
  deactivate: {
    label: 'Isključi nalog',
    icon: ios ? 'person.crop.circle.badge.xmark' : BlockIcon,
    destructive: true,
  },
};

/**
 * The account's actions in the header's native menu — a pull-down on iOS, a dropdown on
 * Android — with the same entries, words and rules as the web's row menu. Hidden when the viewer
 * may do nothing.
 */
export function UserActionsMenu({
  actions,
  disabled,
  onChoose,
}: {
  actions: UserAction[];
  disabled: boolean;
  onChoose: (action: UserAction) => void;
}) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu
        hidden={actions.length === 0}
        disabled={disabled}
        icon={ios ? 'ellipsis' : MoreIcon}
        accessibilityLabel="Radnje">
        {actions.map((action) => (
          <Stack.Toolbar.MenuAction
            key={action}
            icon={ITEMS[action].icon}
            destructive={ITEMS[action].destructive}
            onPress={() => onChoose(action)}>
            {ITEMS[action].label}
          </Stack.Toolbar.MenuAction>
        ))}
      </Stack.Toolbar.Menu>
    </Stack.Toolbar>
  );
}
