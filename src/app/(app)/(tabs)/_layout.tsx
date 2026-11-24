import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';

import { font } from '@/features/shared/utils/typography';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <NativeTabs labelStyle={font('medium')}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
