import { act, create, type ReactTestRenderer, type ReactTestRendererNode } from 'react-test-renderer';

import App from '../../App';
import { useAccountStore } from '../store/useAccountStore';
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
    ['user-student', 'Trống bây giờ', 'Thêm phòng'],
    ['user-staff', 'Bảo trì', 'Thêm phòng'],
    ['user-manager', 'Thêm phòng', 'Trống bây giờ'],
  ])('gives %s the three shared tabs with its own Phòng screen', async (userId, expected, absent) => {
    const output = await renderAs(userId);
    for (const tab of ['Phòng', 'Lịch của tôi', 'Cá nhân']) expect(output).toContain(tab);
    expect(output).toContain('Trực tiếp');
    expect(output).toContain(expected);
    expect(output).not.toContain(absent);
  });

  it('shows the read-only banner and status to an inactive user', async () => {
    useAccountStore.getState().setPresence('user-student', 'inactive');
    const output = await renderAs('user-student');
    expect(output).toContain('Không hoạt động');
    expect(output).toContain('bạn chỉ xem được');
    useAccountStore.getState().setPresence('user-student', 'online');
  });
});
