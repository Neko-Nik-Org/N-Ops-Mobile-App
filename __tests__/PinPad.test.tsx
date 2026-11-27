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

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { PinPad } from '../src/components/PinPad';

jest.mock('react-native-keychain', () => ({ ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'x' } }));
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const id = (v: unknown) => v;
  return {
    __esModule: true,
    default: { View },
    Easing: { linear: id, ease: id, inOut: id, out: id },
    useReducedMotion: () => true,
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    cancelAnimation: () => undefined,
    withRepeat: id,
    withSequence: id,
    withTiming: id,
  };
});
jest.mock('../src/components/Loading', () => ({ Spinner: () => null }));
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View, Path: View };
});
jest.mock('../src/lib/haptics', () => ({ Haptics: { light: jest.fn(), success: jest.fn(), error: jest.fn(), warning: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../src/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: new Proxy({}, { get: () => '#000' }) }),
}));

const render = (props: Partial<React.ComponentProps<typeof PinPad>> = {}) => {
  const onDigit = jest.fn();
  const onBack = jest.fn();
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(<PinPad pin="12" state="idle" message="Enter your PIN" onDigit={onDigit} onBack={onBack} {...props} />);
  });
  return { r, onDigit, onBack };
};
const press = (r: ReactTestRenderer.ReactTestRenderer, label: string) => act(() => r.root.findByProps({ accessibilityLabel: label }).props.onPress());

describe('PinPad', () => {
  it('sends the digit that was pressed', () => {
    const { r, onDigit } = render();
    press(r, '7');
    expect(onDigit).toHaveBeenCalledWith('7');
  });
  it('shows how many digits are entered', () => {
    const { r } = render();
    expect(r.root.findByProps({ accessibilityLabel: '2 of 6 digits entered' })).toBeTruthy();
  });
  it('keeps all six dots filled while verifying, and disables the keys', () => {
    const { r } = render({ state: 'verifying', pin: '' });
    expect(r.root.findByProps({ accessibilityLabel: '6 of 6 digits entered' })).toBeTruthy();
    expect(r.root.findByProps({ accessibilityLabel: '5' }).props.disabled).toBe(true);
  });
  it('shows the biometric view and dims the keys while the prompt is up', () => {
    const { r } = render({ bioActive: { icon: 'faceId', text: 'Look at your phone to unlock' } });
    expect(r.root.findByProps({ accessibilityLabel: 'Look at your phone to unlock' })).toBeTruthy();
    expect(r.root.findByProps({ accessibilityLabel: '1' }).props.disabled).toBe(true);
  });
  it('offers the biometric key only when given one', () => {
    const onPress = jest.fn();
    const { r } = render({ bio: { icon: 'faceId', label: 'Unlock with Face ID', onPress } });
    press(r, 'Unlock with Face ID');
    expect(onPress).toHaveBeenCalled();
  });
});
