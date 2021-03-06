// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import {
    IEventPayload_R2_EVENT_TTS_CLICK_ENABLE, IEventPayload_R2_EVENT_TTS_DO_PLAY,
    R2_EVENT_TTS_CLICK_ENABLE, R2_EVENT_TTS_DO_NEXT, R2_EVENT_TTS_DO_PAUSE, R2_EVENT_TTS_DO_PLAY,
    R2_EVENT_TTS_DO_PREVIOUS, R2_EVENT_TTS_DO_RESUME, R2_EVENT_TTS_DO_STOP, R2_EVENT_TTS_IS_PAUSED,
    R2_EVENT_TTS_IS_PLAYING, R2_EVENT_TTS_IS_STOPPED,
} from "../common/events";
import { getCurrentReadingLocation } from "./location";
import { IReadiumElectronBrowserWindow, IReadiumElectronWebview } from "./webview/state";

// import * as debug_ from "debug";
// const debug = debug_("r2:navigator#electron/renderer/index");
// const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const win = window as IReadiumElectronBrowserWindow;

export function ttsHandleIpcMessage(
    eventChannel: string,
    _eventArgs: any[],
    _eventCurrentTarget: IReadiumElectronWebview): boolean {

    if (eventChannel === R2_EVENT_TTS_IS_PAUSED) {
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PAUSED);
        }
    } else if (eventChannel === R2_EVENT_TTS_IS_STOPPED) {
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.STOPPED);
        }
    } else if (eventChannel === R2_EVENT_TTS_IS_PLAYING) {
        if (_ttsListener) {
            _ttsListener(TTSStateEnum.PLAYING);
        }
    } else {
        return false;
    }
    return true;
}

export enum TTSStateEnum {
    PAUSED = "PAUSED",
    PLAYING = "PLAYING",
    STOPPED = "STOPPED",
}
let _ttsListener: ((ttsState: TTSStateEnum) => void) | undefined;
export function ttsListen(ttsListener: (ttsState: TTSStateEnum) => void) {
    _ttsListener = ttsListener;
}

export function ttsPlay() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    let startElementCSSSelector: string | undefined;
    const loc = getCurrentReadingLocation();
    if (loc && activeWebView.READIUM2 && activeWebView.READIUM2.link) {
        if (loc.locator.href === activeWebView.READIUM2.link.Href) {
            startElementCSSSelector = loc.locator.locations.cssSelector;
        }
    }

    const payload: IEventPayload_R2_EVENT_TTS_DO_PLAY = {
        rootElement: "html > body", // window.document.body
        startElement: startElementCSSSelector,
    };

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_DO_PLAY, payload);
    }, 0);
}

export function ttsPause() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_DO_PAUSE);
    }, 0);
}
export function ttsStop() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_DO_STOP);
    }, 0);
}
export function ttsResume() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_DO_RESUME);
    }, 0);
}
export function ttsPrevious() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_DO_PREVIOUS);
    }, 0);
}
export function ttsNext() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_DO_NEXT);
    }, 0);
}

export function ttsClickEnable(doEnable: boolean) {

    if (win.READIUM2) {
        win.READIUM2.ttsClickEnabled = doEnable;
    }

    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    const payload: IEventPayload_R2_EVENT_TTS_CLICK_ENABLE = {
        doEnable,
    };

    setTimeout(async () => {
        await activeWebView.send(R2_EVENT_TTS_CLICK_ENABLE, payload);
    }, 0);
}
