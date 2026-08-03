import { ContextKeyServiceId } from '@openenvx/core';
import { useWorkbenchContext } from '@openenvx/headless/react';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from 'react';

import {
  HtmlPreviewChromeServiceId,
  type HtmlPreviewChromeState,
} from '../preview/html-preview-chrome-service';
import {
  resolveAutoZoom,
  resolveFrameWidth as defaultResolveFrameWidth,
  resolveScaledFrameWidth,
  type HtmlDevicePreset,
} from './html-device-preview';
import { useHtmlDeviceStageMetrics } from './use-html-device-stage-metrics';

export interface HtmlPreviewChromeView {
  preset: HtmlDevicePreset;
  zoom: number;
  autoZoom: boolean;
  autoZoomValue: number;
  frameWidth: number;
  stageWidth: number;
  scaledWidth: number;
  scaledHeight: number | undefined;
  artboardRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  artboardHeight: number;
}

const EMPTY_STATE: HtmlPreviewChromeState = {
  autoZoom: false,
  autoZoomValue: 1,
  manualZoom: 1,
  preset: 'fluid',
};

export function useHtmlPreviewChrome(options?: {
  initialPreset?: HtmlDevicePreset;
  resolveFrameWidth?: (
    preset: HtmlDevicePreset,
    availableWidth: number
  ) => number;
}): HtmlPreviewChromeView {
  const { api } = useWorkbenchContext();
  const chrome = api.getService(HtmlPreviewChromeServiceId);
  const keys = api.getService(ContextKeyServiceId);
  const chromeRef = useRef(chrome);
  const keysRef = useRef(keys);
  const initialPresetRef = useRef(options?.initialPreset);
  chromeRef.current = chrome;
  keysRef.current = keys;
  initialPresetRef.current = options?.initialPreset;

  const resolveWidth = options?.resolveFrameWidth ?? defaultResolveFrameWidth;

  // Subscribe must be referentially stable — a new function each render
  // unsubscribes/resubscribes, flipping setActive and context keys in a loop.
  const subscribe = useCallback((onStoreChange: () => void) => {
    const instance = chromeRef.current;
    if (!instance) {
      return () => {};
    }
    instance.bindContextKeys(keysRef.current ?? null);
    instance.setActive(true);
    const preset = initialPresetRef.current;
    if (preset) {
      instance.seedPreset(preset);
    }
    const sub = instance.onDidChange(() => onStoreChange());
    return () => {
      sub.dispose();
      instance.setActive(false);
    };
  }, []);

  const getSnapshot = useCallback(
    (): HtmlPreviewChromeState => chromeRef.current?.getState() ?? EMPTY_STATE,
    []
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_STATE);

  const { artboardRef, artboardHeight, stageRef, stageWidth } =
    useHtmlDeviceStageMetrics(state.preset);

  const frameWidth = resolveWidth(state.preset, stageWidth);
  const autoZoomValue = resolveAutoZoom(frameWidth, stageWidth);

  useLayoutEffect(() => {
    chrome?.reportAutoZoomValue(autoZoomValue);
  }, [autoZoomValue, chrome]);

  const zoom = state.autoZoom ? autoZoomValue : state.manualZoom;
  const scaledWidth = resolveScaledFrameWidth(frameWidth, zoom);
  const scaledHeight = artboardHeight > 0 ? artboardHeight * zoom : undefined;

  return {
    artboardHeight,
    artboardRef,
    autoZoom: state.autoZoom,
    autoZoomValue,
    frameWidth,
    preset: state.preset,
    scaledHeight,
    scaledWidth,
    stageRef,
    stageWidth,
    zoom,
  };
}
