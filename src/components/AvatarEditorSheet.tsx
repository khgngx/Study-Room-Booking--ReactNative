import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clampOffset, clampZoom, cropRect, displayedSize, MAX_ZOOM, MIN_ZOOM, type CropRect, type Point } from '../domain/crop';
import { showMessage } from '../services/dialog';
import { CAN_CROP_IN_APP, chooseImage, type PickedImage } from '../services/images';
import { themed } from '../theme/themed';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { Button } from './Button';

const MAX_VIEWPORT = 280;
const PREVIEW_SIZE = 160;
const ZOOM_STEP = 0.25;
const CENTRE: Point = { x: 0, y: 0 };

/** What confirming will do to the account's picture. */
export type AvatarChange = { kind: 'remove' } | { kind: 'replace'; image: PickedImage; crop?: CropRect };

interface AvatarEditorSheetProps {
  visible: boolean;
  name: string;
  currentUrl?: string;
  /** Resolves once the change is saved; the sheet stays open and re-enabled if it rejects. */
  onConfirm: (change: AvatarChange) => Promise<void>;
  onClose: () => void;
}

/** Pick, frame or remove the account picture; nothing changes until "Xác nhận". */
export function AvatarEditorSheet({ visible, name, currentUrl, onConfirm, onClose }: AvatarEditorSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Đóng" style={styles.scrim} onPress={onClose} />
      {/* Mounted per opening so an abandoned draft never comes back. */}
      {visible ? <Editor name={name} currentUrl={currentUrl} onConfirm={onConfirm} onClose={onClose} /> : null}
    </Modal>
  );
}

type Draft = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; image: PickedImage };

function Editor({ name, currentUrl, onConfirm, onClose }: Omit<AvatarEditorSheetProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const viewport = Math.min(MAX_VIEWPORT, width - spacing.lg * 2);
  const [draft, setDraft] = useState<Draft>({ kind: 'keep' });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState(CENTRE);
  const [busy, setBusy] = useState(false);

  const image = draft.kind === 'replace' ? draft.image : null;
  const cropping = image !== null && CAN_CROP_IN_APP;
  const shownUrl = draft.kind === 'keep' ? currentUrl : image?.uri;
  const removable = draft.kind === 'replace' || (draft.kind === 'keep' && currentUrl !== undefined);

  const choose = async () => {
    try {
      const picked = await chooseImage('avatar', { cropInApp: true });
      if (!picked) return;
      setDraft({ kind: 'replace', image: picked });
      setZoom(MIN_ZOOM);
      setOffset(CENTRE);
    } catch (error) {
      console.warn('Choosing an avatar failed', error);
      showMessage('Chưa chọn được ảnh', 'Không mở được ảnh vừa chọn. Vui lòng thử ảnh khác.');
    }
  };

  const changeZoom = (delta: number) => {
    if (!image) return;
    const next = clampZoom(zoom + delta);
    setZoom(next);
    setOffset((current) => clampOffset(current, image, viewport, next));
  };

  const confirm = async () => {
    if (draft.kind === 'keep') return;
    setBusy(true);
    try {
      await onConfirm(
        draft.kind === 'remove'
          ? draft
          : { kind: 'replace', image: draft.image, crop: cropping ? cropRect(draft.image, viewport, zoom, offset) : undefined },
      );
      onClose();
    } catch (error) {
      console.warn('Saving the avatar failed', error);
      showMessage('Chưa lưu được ảnh', 'Không xử lý được ảnh vừa chọn. Vui lòng thử ảnh khác.');
      setBusy(false);
    }
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.base }]}>
      <View style={styles.handle} />
      <AppText variant="displayMd" accessibilityRole="header">
        Ảnh đại diện
      </AppText>

      {cropping ? (
        <>
          <CropStage image={image} viewport={viewport} zoom={zoom} offset={offset} onPan={setOffset} />
          <View style={styles.zoomRow}>
            <ZoomButton icon="remove" label="Thu nhỏ" disabled={zoom <= MIN_ZOOM} onPress={() => changeZoom(-ZOOM_STEP)} />
            <AppText variant="caption" color="muted" style={styles.zoomValue}>
              {Math.round(zoom * 100)}%
            </AppText>
            <ZoomButton icon="add" label="Phóng to" disabled={zoom >= MAX_ZOOM} onPress={() => changeZoom(ZOOM_STEP)} />
          </View>
          <AppText variant="captionSm" color="muted" style={styles.center}>
            Kéo ảnh để căn vào khung tròn, dùng − và + để phóng.
          </AppText>
        </>
      ) : (
        <View style={styles.preview}>
          <Avatar name={name} imageUrl={shownUrl} size={PREVIEW_SIZE} />
          <AppText variant="captionSm" color="muted" style={styles.center}>
            {draft.kind === 'remove'
              ? 'Ảnh sẽ được gỡ. Tài khoản hiển thị chữ cái đầu của tên bạn.'
              : shownUrl
                ? 'Chọn ảnh khác để thay, hoặc gỡ ảnh hiện tại.'
                : 'Chưa có ảnh. Chọn một ảnh từ thư viện của bạn.'}
          </AppText>
        </View>
      )}

      <View style={styles.actions}>
        <Button label={shownUrl ? 'Chọn ảnh khác' : 'Chọn ảnh'} variant="secondary" onPress={() => void choose()} disabled={busy} style={styles.action} />
        {removable ? <Button label="Gỡ ảnh" variant="secondary" onPress={() => setDraft({ kind: 'remove' })} disabled={busy} style={styles.action} /> : null}
      </View>
      <Button label={busy ? 'Đang lưu…' : 'Xác nhận'} onPress={() => void confirm()} disabled={draft.kind === 'keep' || busy} />
      <Button label="Huỷ" variant="tertiary" onPress={onClose} disabled={busy} />
    </View>
  );
}

interface CropStageProps {
  image: PickedImage;
  viewport: number;
  zoom: number;
  offset: Point;
  onPan: (update: (current: Point) => Point) => void;
}

/** The square that will be kept: the photo slides underneath a rule-of-thirds grid and the round avatar outline. */
function CropStage({ image, viewport, zoom, offset, onPan }: CropStageProps) {
  // Where the finger was at the last event, so each move applies only the distance added since.
  const lastTouch = useRef(CENTRE);
  const track = (event: GestureResponderEvent) => {
    const touch = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
    const step = { x: touch.x - lastTouch.current.x, y: touch.y - lastTouch.current.y };
    lastTouch.current = touch;
    return step;
  };

  const shown = displayedSize(image, viewport, zoom);
  return (
    <View style={[styles.stage, { width: viewport, height: viewport }]}>
      <Image
        source={image.uri}
        contentFit="fill"
        style={{
          position: 'absolute',
          width: shown.width,
          height: shown.height,
          left: (viewport - shown.width) / 2 + offset.x,
          top: (viewport - shown.height) / 2 + offset.y,
        }}
      />
      {/* The overlay takes the drag, which also stops the browser from dragging the picture itself. */}
      <View
        accessibilityLabel="Khung cắt ảnh, kéo để căn"
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={track}
        onResponderMove={(event) => {
          const step = track(event);
          onPan((current) => clampOffset({ x: current.x + step.x, y: current.y + step.y }, image, viewport, zoom));
        }}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.gridLine, styles.vertical, { left: viewport / 3 }]} />
        <View style={[styles.gridLine, styles.vertical, { left: (viewport * 2) / 3 }]} />
        <View style={[styles.gridLine, styles.horizontal, { top: viewport / 3 }]} />
        <View style={[styles.gridLine, styles.horizontal, { top: (viewport * 2) / 3 }]} />
        <View style={styles.circle} />
      </View>
    </View>
  );
}

function ZoomButton({ icon, label, disabled, onPress }: { icon: 'add' | 'remove'; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-disabled={disabled}
      disabled={disabled}
      hitSlop={spacing.xs}
      onPress={onPress}
      style={[styles.zoomButton, disabled && styles.zoomButtonDisabled]}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

const styles = themed(() => ({
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    marginTop: -radius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.canvas,
  },
  handle: { alignSelf: 'center', width: 32, height: 4, marginBottom: spacing.sm, borderRadius: radius.full, backgroundColor: colors.hairline },
  center: { textAlign: 'center' },
  preview: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  stage: { alignSelf: 'center', overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.ink },
  gridLine: { position: 'absolute', backgroundColor: colors.glassBorder },
  vertical: { top: 0, bottom: 0, width: 1 },
  horizontal: { left: 0, right: 0, height: 1 },
  circle: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.full, borderWidth: 2, borderColor: colors.canvas },
  zoomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  zoomValue: { minWidth: 48, textAlign: 'center' },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  zoomButtonDisabled: { opacity: 0.4 },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
}));
