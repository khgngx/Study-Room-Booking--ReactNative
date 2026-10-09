import { act, create, type ReactTestRenderer, type ReactTestRendererNode } from 'react-test-renderer';

import App from '../../App';
import { useBookingStore } from '../store/useBookingStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@expo-google-fonts/inter', () => ({ useFonts: () => [true, null] }));

function collectText(node: ReactTestRendererNode | ReactTestRendererNode[] | null): string {
  if (node === null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(collectText).join(' ');
  return collectText(node.children);
}

async function renderAs(userId: string | null): Promise<string> {
  useBookingStore.setState({ session: userId ? { userId } : null });
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(<App />);
  });
  if (!renderer) throw new Error('App did not render');
  const output = collectText(renderer.toJSON());
  await act(async () => renderer?.unmount());
  return output;
}

describe('App smoke test', () => {
  it('shows the login screen when signed out', async () => {
    expect(await renderAs(null)).toContain('Đăng nhập');
  });

  it.each([
    ['user-student', 'Khám phá', 'Tổng quan'],
    ['user-staff', 'Ca trực', 'Tài khoản'],
    ['user-manager', 'Tổng quan', 'Khám phá'],
  ])('renders the %s navigator with only its own tabs', async (userId, expected, absent) => {
    const output = await renderAs(userId);
    expect(output).toContain(expected);
    expect(output).not.toContain(absent);
  });
});
