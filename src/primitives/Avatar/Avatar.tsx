import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Image as RNImage,
  StyleSheet,
  View,
  type ImageProps,
  type ViewProps,
} from 'react-native';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface AvatarContextValue {
  imageLoadingStatus: ImageLoadingStatus;
  onImageLoadingStatusChange: (status: ImageLoadingStatus) => void;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

function useAvatarContext(component: string): AvatarContextValue {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error(`Avatar.${component} must be used within an Avatar.Root`);
  }
  return context;
}

export type AvatarRootProps = ViewProps;

function Root({ children, ...viewProps }: AvatarRootProps) {
  const [imageLoadingStatus, setImageLoadingStatus] =
    useState<ImageLoadingStatus>('idle');

  const contextValue = useMemo(
    () => ({
      imageLoadingStatus,
      onImageLoadingStatusChange: setImageLoadingStatus,
    }),
    [imageLoadingStatus]
  );

  return (
    <AvatarContext.Provider value={contextValue}>
      <View {...viewProps}>{children}</View>
    </AvatarContext.Provider>
  );
}
Root.displayName = 'Avatar.Root';

export interface AvatarImageProps extends Omit<
  ImageProps,
  'onLoad' | 'onError'
> {
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
}

function Image({
  onLoadingStatusChange,
  source,
  style,
  ...imageProps
}: AvatarImageProps) {
  const { imageLoadingStatus, onImageLoadingStatusChange } =
    useAvatarContext('Image');

  // Re-attempt loading whenever `source` changes identity. Pass a stable
  // `source` reference (e.g. via `useMemo`) to avoid unnecessary reloads.
  useEffect(() => {
    onImageLoadingStatusChange('loading');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    onLoadingStatusChange?.(imageLoadingStatus);
  }, [imageLoadingStatus, onLoadingStatusChange]);

  if (imageLoadingStatus === 'error') {
    return null;
  }

  return (
    <RNImage
      source={source}
      onLoad={() => onImageLoadingStatusChange('loaded')}
      onError={() => onImageLoadingStatusChange('error')}
      style={[styles.image, style]}
      {...imageProps}
    />
  );
}
Image.displayName = 'Avatar.Image';

export interface AvatarFallbackProps extends ViewProps {
  /**
   * Delay in ms before rendering the fallback, so it only shows up if the
   * image is genuinely slow/failing to load instead of flashing on every
   * render.
   */
  delayMs?: number;
}

function Fallback({ delayMs, children, ...viewProps }: AvatarFallbackProps) {
  const { imageLoadingStatus } = useAvatarContext('Fallback');
  const [canRender, setCanRender] = useState(delayMs === undefined);

  useEffect(() => {
    if (delayMs === undefined) return;
    setCanRender(false);
    const timer = setTimeout(() => setCanRender(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (imageLoadingStatus === 'loaded' || !canRender) {
    return null;
  }

  return <View {...viewProps}>{children}</View>;
}
Fallback.displayName = 'Avatar.Fallback';

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});

export const Avatar = {
  Root,
  Image,
  Fallback,
};
