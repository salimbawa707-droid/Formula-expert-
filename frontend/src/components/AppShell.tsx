import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { useTheme } from '@/src/theme/ThemeContext';
import { layout } from '@/src/theme/tokens';
import { Sidebar } from './Sidebar';
import { TopAppBar } from './TopAppBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= layout.desktopBreakpoint;

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer if we cross the breakpoint into desktop
  useEffect(() => {
    if (isDesktop && drawerOpen) setDrawerOpen(false);
  }, [isDesktop, drawerOpen]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <SafeAreaView
      testID="app-shell"
      edges={['top', 'left', 'right']}
      style={[styles.root, { backgroundColor: colors.surface }]}
    >
      <View style={styles.row}>
        {isDesktop ? (
          <View style={styles.permanentSidebar}>
            <Sidebar variant="permanent" />
          </View>
        ) : null}

        <View style={[styles.contentColumn, { backgroundColor: colors.surfaceSecondary }]}>
          <TopAppBar showMenu={!isDesktop} onMenuPress={openDrawer} />
          <View style={[styles.pageArea, { backgroundColor: colors.surfaceSecondary }]}>
            {children}
          </View>
        </View>
      </View>

      {!isDesktop ? (
        <DrawerOverlay open={drawerOpen} onClose={closeDrawer} />
      ) : null}
    </SafeAreaView>
  );
}

function DrawerOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const translateX = useSharedValue(-layout.sidebarWidth);
  const backdropOpacity = useSharedValue(0);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      translateX.value = withTiming(0, { duration: 220 });
      backdropOpacity.value = withTiming(0.55, { duration: 220 });
    } else if (mounted) {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateX.value = withTiming(-layout.sidebarWidth, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
      hardwareAccelerated
      // On web, Modal from RN-web uses fixed position full-screen overlay
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          testID="drawer-backdrop"
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Close menu"
          />
        </Animated.View>

        <Animated.View
          testID="drawer-panel"
          style={[
            styles.drawerPanel,
            drawerStyle,
            Platform.select({
              web: { boxShadow: '4px 0 16px rgba(0,0,0,0.15)' } as any,
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 4, height: 0 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 12,
              },
            }),
          ]}
        >
          <SafeAreaView edges={['top', 'left', 'bottom']} style={{ flex: 1 }}>
            <Sidebar variant="drawer" onNavigate={onClose} />
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  permanentSidebar: {
    width: layout.sidebarWidth,
    height: '100%',
  },
  contentColumn: {
    flex: 1,
    minWidth: 0,
  },
  pageArea: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: '#000',
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: layout.sidebarWidth,
  },
});
