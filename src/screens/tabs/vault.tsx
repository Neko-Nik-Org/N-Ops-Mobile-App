/*
 * Copyright (C) 2026 Neko Nik <nikhil@nekonik.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import Clipboard from '@react-native-clipboard/clipboard';
import { useState } from 'react';
import { View } from 'react-native';

import { PressableScale } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Empty, ListCard, ListRow, Screen } from '@/components/Page';
import { Text } from '@/components/Text';
import { api } from '@/lib/api';
import { useDashboard } from '@/lib/dashboard';
import { confirmOwner } from '@/lib/ownerConfirm';
import { messageOf } from '@/lib/errors';
import { ago } from '@/lib/format';
import { useSession } from '@/lib/session';
import type { SecretKey, VaultProject } from '@/lib/types';
import { useLoad } from '@/lib/useLoad';
import { useTheme } from '@/theme/ThemeProvider';

// shortcut: only secrets (env keys) are built; config files and notes need their own screens. The API lists keys per project AND tag, so "All tags" fans out over every tag.
/** How long a copied secret stays on the clipboard. */
const CLIPBOARD_CLEAR_MS = 30_000;

export default function Vault() {
  const { colors } = useTheme();
  const { session } = useSession();
  const { tags, selectedTagId } = useDashboard();
  const { data: projects, loading, error, reload } = useLoad((s) => api.listVaultProjects(s), []);
  const [open, setOpen] = useState<number | null>(null);
  const [keys, setKeys] = useState<Record<number, SecretKey[] | 'loading'>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const tagIds = selectedTagId === null ? (tags ?? []).map((t) => t.tagId) : [selectedTagId];

  const toggle = async (p: VaultProject) => {
    if (open === p.projectId) return setOpen(null);
    setOpen(p.projectId);
    if (!session) return;
    setKeys((k) => ({ ...k, [p.projectId]: 'loading' }));
    try {
      const lists = await Promise.all(tagIds.map((t) => api.listSecrets(session, p.projectId, t)));
      setKeys((k) => ({ ...k, [p.projectId]: lists.flat() }));
      setMsg(null);
    } catch (e) {
      setKeys((k) => ({ ...k, [p.projectId]: [] }));
      setMsg(messageOf(e));
    }
  };

  const copy = async (k: SecretKey) => {
    if (!session) return;
    if (!(await confirmOwner(`Copy ${k.name}`))) return;
    try {
      const secret = await api.revealSecret(session, k.secretId, k.currentVersion);
      Clipboard.setString(secret);
      // Don't leave the secret on the clipboard: clear it after a short while, unless something else was copied since.
      setTimeout(() => void Clipboard.getString().then((now) => now === secret && Clipboard.setString('')).catch(() => undefined), CLIPBOARD_CLEAR_MS);
      setCopied(k.secretId);
      setTimeout(() => setCopied((c) => (c === k.secretId ? null : c)), 2000);
    } catch (e) {
      setMsg(messageOf(e));
    }
  };

  return (
    <Screen title="Vault" loading={loading} error={error ?? msg} onRefresh={() => void reload()}>
      <Text size={13} lh={19} color={colors.muted} style={{ marginTop: 12 }}>
        Values stay hidden. Copying asks for Face ID or your PIN.
      </Text>
      {projects?.length ? (
        projects.map((p) => {
          const list = keys[p.projectId];
          const isOpen = open === p.projectId;
          return (
            <View key={p.projectId}>
              <PressableScale accessibilityLabel={`${p.projectName}, ${isOpen ? 'collapse' : 'expand'}`} onPress={() => void toggle(p)} style={{ marginTop: 20, marginBottom: 8, marginLeft: 4, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <GroupTitleInline name={p.projectName} count={Array.isArray(list) ? list.length : undefined} />
                <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} color={colors.muted} />
              </PressableScale>
              {isOpen ? (
                list === 'loading' || !list ? (
                  <Text size={13} color={colors.muted} style={{ marginLeft: 4 }}>
                    Loading keys…
                  </Text>
                ) : list.length ? (
                  <ListCard>
                    {list.map((k, i) => (
                      <ListRow key={k.secretId} first={i === 0} height={60} label={k.name}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text f="mono500" size={14} lh={18} color={colors.textStrong} numberOfLines={1}>
                            {k.name}
                          </Text>
                          <Text size={12} lh={16} color={colors.muted}>
                            {k.isHidden ? 'Hidden: usable, never shown' : `v${k.currentVersion} · updated ${ago(k.updatedAt)}`}
                          </Text>
                        </View>
                        {k.isHidden ? (
                          <Icon name="lock" size={18} color={colors.muted} />
                        ) : (
                          <PressableScale accessibilityLabel={`Copy ${k.name}`} onPress={() => void copy(k)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={copied === k.secretId ? 'check' : 'copy'} size={18} color={copied === k.secretId ? colors.accent : colors.muted} />
                          </PressableScale>
                        )}
                      </ListRow>
                    ))}
                  </ListCard>
                ) : (
                  <Text size={13} color={colors.muted} style={{ marginLeft: 4 }}>
                    No keys for this tag.
                  </Text>
                )
              ) : null}
            </View>
          );
        })
      ) : (
        <Empty icon="vaultBox" title="No projects yet" body="Projects created in the web admin will show here with their keys." />
      )}
    </Screen>
  );
}

function GroupTitleInline({ name, count }: { name: string; count?: number }) {
  const { colors } = useTheme();
  return (
    <>
      <Text f="body600" size={13} lh={18} color={colors.text2}>
        {name}
      </Text>
      {count !== undefined ? (
        <Text f="mono500" size={12} lh={16} color={colors.muted}>
          {count}
        </Text>
      ) : null}
    </>
  );
}
