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
import { useLocalSearchParams, useRouter } from '@/lib/router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale, PrimaryButton, RoundIconButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { Text, type as T } from '@/components/Text';
import { config } from '@/lib/config';
import { isCompleteCode, normalizeCode, normalizeServer, parseLinkPayload, parseUserId } from '@/lib/linkPayload';
import { loadPrefs } from '@/lib/prefs';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';
import { easeOut } from '@/theme/motion';

/** Typed fallback for the QR: the user ID and one-time device code shown in the admin panel. */
export default function EnterCode() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; server?: string; userId?: string }>();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState(params.userId ?? '');
  const [code, setCode] = useState(normalizeCode(params.code ?? ''));
  const [server, setServer] = useState(params.server ?? '');
  const [showServer, setShowServer] = useState(!!params.server);

  useEffect(() => {
    void loadPrefs().then((p) => {
      if (!params.server && p.lastServer) setServer(p.lastServer);
    });
  }, [params.server]);

  const chevron = useSharedValue(showServer ? 1 : 0);
  useEffect(() => {
    chevron.value = withTiming(showServer ? 1 : 0, { duration: 200, easing: easeOut });
  }, [showServer, chevron]);
  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${chevron.value * 180}deg` }] }));

  const paste = async () => {
    const text = (await Clipboard.getString()).trim();
    if (!text) return;
    // A whole QR payload or link fills every field; anything else is taken as the code.
    const payload = parseLinkPayload(text);
    if (!payload) return setCode(normalizeCode(text));
    setCode(payload.code);
    setUserId(String(payload.userId));
    if (payload.server) {
      setServer(payload.server);
      setShowServer(true);
    }
  };

  const id = parseUserId(userId);
  const serverOk = !server.trim() || !!normalizeServer(server);
  const complete = id !== null && isCompleteCode(code) && serverOk && (!!server.trim() || !!config.defaultServer);
  const link = () => {
    if (complete) router.push({ pathname: '/linking', params: { code, userId: String(id), server: server.trim() } });
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace('/scan'));

  const field = [styles.input, { borderColor: colors.line, backgroundColor: colors.field, color: colors.textStrong, fontFamily: fonts.mono400 }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 9, paddingBottom: insets.bottom + 6 }]} keyboardShouldPersistTaps="handled" bounces={false}>
        <View style={styles.topBar}>
          <RoundIconButton icon="chevronLeft" accessibilityLabel="Back to scanner" background="transparent" color={colors.text} onPress={back} />
        </View>

        <View style={{ marginTop: 20, gap: 10 }}>
          <View style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <Icon name="keyboard" size={24} color={colors.accent} strokeWidth={1.8} />
          </View>
          <Text {...T.titleSm} color={colors.textStrong} accessibilityRole="header">
            Enter your link code
          </Text>
          <Text {...T.body} color={colors.muted}>
            In N-Ops on the web, open Account → Devices → Link a mobile device. It shows your user ID and a one-time device code.
          </Text>
        </View>

        <Text {...T.label} color={colors.text2} style={{ marginTop: 32 }} nativeID="uid-label">
          User ID
        </Text>
        <TextInput
          value={userId}
          onChangeText={(v) => setUserId(v.replace(/\D/g, ''))}
          placeholder="e.g. 1024"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          keyboardAppearance={scheme}
          accessibilityLabelledBy="uid-label"
          style={[field, { marginTop: 8 }]}
        />

        <Text {...T.label} color={colors.text2} style={{ marginTop: 20 }} nativeID="code-label">
          Device code
        </Text>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(normalizeCode(v))}
          placeholder="Paste or type the code"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          keyboardAppearance={scheme}
          returnKeyType="go"
          onSubmitEditing={link}
          accessibilityLabelledBy="code-label"
          style={[field, { marginTop: 8 }]}
        />

        <View style={styles.helperRow}>
          <PressableScale onPress={() => void paste()} accessibilityLabel="Paste code" style={[styles.paste, { borderColor: colors.line, backgroundColor: colors.surface }]}>
            <Icon name="clipboard" size={15} color={colors.text2} />
            <Text f="body500" size={13} lh={18} color={colors.text2}>
              Paste
            </Text>
          </PressableScale>
          <Text {...T.caption} color={colors.muted}>
            Codes expire after 5 minutes
          </Text>
        </View>

        <View style={[styles.serverBlock, { borderTopColor: colors.line2 }]}>
          <PressableScale onPress={() => setShowServer((v) => !v)} accessibilityLabel="Self-hosted? Set server address" accessibilityState={{ selected: showServer }} style={styles.serverToggle}>
            <Icon name="servers" size={16} color={colors.muted} />
            <Text f="body500" size={14} lh={19} color={colors.muted}>
              Self-hosted? Set server address
            </Text>
            <Animated.View style={chevronStyle}>
              <Icon name="chevronDown" size={14} color={colors.muted} strokeWidth={2.2} />
            </Animated.View>
          </PressableScale>
          {showServer ? (
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text {...T.label} color={colors.text2} nativeID="server-label">
                API address
              </Text>
              <TextInput
                value={server}
                onChangeText={setServer}
                placeholder={config.defaultServer || 'https://api.yourcompany.com'}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                textContentType="URL"
                keyboardAppearance={scheme}
                accessibilityLabelledBy="server-label"
                style={[field, !serverOk && { borderColor: colors.crit }]}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.bottom}>
          <PrimaryButton label="Link this phone" disabled={!complete} onPress={link} />
          <TextButton label="Use the camera instead" size={14} color={colors.accent} onPress={back} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24 },
  topBar: { height: 44, marginHorizontal: -8, flexDirection: 'row', alignItems: 'center' },
  tile: { width: 48, height: 48, marginBottom: 10, borderRadius: radius.tile, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { height: 52, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1.5, fontSize: 16 },
  helperRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paste: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1 },
  serverBlock: { marginTop: 24, paddingTop: 16, borderTopWidth: 1 },
  serverToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, alignSelf: 'flex-start' },
  bottom: { marginTop: 'auto', paddingTop: 24, gap: 8 },
});
