import { NativeTabs } from 'expo-router/native-tabs';

import { F } from '@/constants/theme';
import { useCores } from '@/lib/tema';

export default function AppTabs() {
  const c = useCores();
  return (
    <NativeTabs
      backgroundColor={c.background}
      indicatorColor={c.surface3}
      tintColor={c.accent}
      iconColor={{ default: c.dim, selected: c.accent }}
      labelStyle={{
        default: { color: c.dim, fontFamily: F.medium },
        selected: { color: c.text, fontFamily: F.semibold },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'scope', selected: 'scope' }} md="my_location" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bloqueios">
        <NativeTabs.Trigger.Label>Bloqueios</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'nosign', selected: 'nosign' }} md="block" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="desbloqueio">
        <NativeTabs.Trigger.Label>Desbloqueio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'lock', selected: 'lock.fill' }} md="lock_clock" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mensagens">
        <NativeTabs.Trigger.Label>Mensagens</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'message', selected: 'message.fill' }}
          md={{ default: 'chat_bubble_outline', selected: 'chat_bubble' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
