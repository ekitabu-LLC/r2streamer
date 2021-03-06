// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { ipcRenderer, shell } from "electron";
import * as path from "path";
import { URL } from "url";

import { Locator, LocatorLocations } from "@r2-shared-js/models/locator";
import { Link } from "@r2-shared-js/models/publication-link";
import { encodeURIComponent_RFC3986 } from "@r2-utils-js/_utils/http/UrlUtils";

import { DEBUG_AUDIO, IAudioPlaybackInfo } from "../common/audiobook";
import { IDocInfo } from "../common/document";
import {
    IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE, IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK,
    IEventPayload_R2_EVENT_LINK, IEventPayload_R2_EVENT_LOCATOR_VISIBLE,
    IEventPayload_R2_EVENT_PAGE_TURN, IEventPayload_R2_EVENT_READING_LOCATION,
    IEventPayload_R2_EVENT_READIUMCSS, IEventPayload_R2_EVENT_SCROLLTO,
    IEventPayload_R2_EVENT_SHIFT_VIEW_X, R2_EVENT_AUDIO_PLAYBACK_RATE, R2_EVENT_AUDIO_SOUNDTRACK,
    R2_EVENT_LINK, R2_EVENT_LOCATOR_VISIBLE, R2_EVENT_PAGE_TURN, R2_EVENT_PAGE_TURN_RES,
    R2_EVENT_READING_LOCATION, R2_EVENT_SCROLLTO, R2_EVENT_SHIFT_VIEW_X,
} from "../common/events";
import { IPaginationInfo } from "../common/pagination";
import { READIUM2_BASEURL_ID, readiumCssTransformHtml } from "../common/readium-css-inject";
import { ISelectionInfo } from "../common/selection";
import {
    READIUM2_ELECTRON_HTTP_PROTOCOL, convertCustomSchemeToHttpUrl, convertHttpUrlToCustomScheme,
} from "../common/sessions";
import {
    AUDIO_BODY_ID, AUDIO_BUFFER_CANVAS_ID, AUDIO_CONTROLS_ID, AUDIO_COVER_ID, AUDIO_FORWARD_ID,
    AUDIO_ID, AUDIO_NEXT_ID, AUDIO_PERCENT_ID, AUDIO_PLAYPAUSE_ID, AUDIO_PREVIOUS_ID, AUDIO_RATE_ID,
    AUDIO_REWIND_ID, AUDIO_SECTION_ID, AUDIO_SLIDER_ID, AUDIO_TIME_ID, AUDIO_TITLE_ID,
} from "../common/styles";
import { getCurrentAudioPlaybackRate, setCurrentAudioPlaybackRate } from "./audiobook";
import {
    URL_PARAM_CLIPBOARD_INTERCEPT, URL_PARAM_CSS, URL_PARAM_DEBUG_VISUALS,
    URL_PARAM_EPUBREADINGSYSTEM, URL_PARAM_GOTO, URL_PARAM_PREVIOUS, URL_PARAM_REFRESH,
    URL_PARAM_SESSION_INFO,
} from "./common/url-params";
import { getEpubReadingSystemInfo } from "./epubReadingSystem";
import { adjustReadiumCssJsonMessageForFixedLayout, isRTL, obtainReadiumCss } from "./readium-css";
import {
    IReadiumElectronBrowserWindow, IReadiumElectronWebview, isScreenReaderMounted,
} from "./webview/state";

import URI = require("urijs");
const debug = debug_("r2:navigator#electron/renderer/location");

const IS_DEV = (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev");

const win = window as IReadiumElectronBrowserWindow;

export function locationHandleIpcMessage(
    eventChannel: string,
    eventArgs: any[],
    eventCurrentTarget: IReadiumElectronWebview): boolean {

    // win.READIUM2.getActiveWebView();
    const activeWebView = eventCurrentTarget;

    if (eventChannel === R2_EVENT_LOCATOR_VISIBLE) {
        // noop
    } else if (eventChannel === R2_EVENT_SHIFT_VIEW_X) {
        // if (!activeWebView) {
        //     return true;
        // }
        shiftWebview(activeWebView,
            (eventArgs[0] as IEventPayload_R2_EVENT_SHIFT_VIEW_X).offset,
            (eventArgs[0] as IEventPayload_R2_EVENT_SHIFT_VIEW_X).backgroundColor);
    } else if (eventChannel === R2_EVENT_PAGE_TURN_RES) {
        // if (!activeWebView) {
        //     return true;
        // }
        const publication = win.READIUM2.publication;
        const publicationURL = win.READIUM2.publicationURL;
        if (!publication) {
            return true;
        }

        const payload = eventArgs[0] as IEventPayload_R2_EVENT_PAGE_TURN;

        const goPREVIOUS = payload.go === "PREVIOUS"; // any other value is NEXT

        if (!activeWebView.READIUM2.link) {
            debug("WEBVIEW READIUM2_LINK ??!!");
            return true;
        }

        let nextOrPreviousSpineItem: Link | undefined;
        if (publication.Spine) {
            for (let i = 0; i < publication.Spine.length; i++) {
                if (publication.Spine[i] === activeWebView.READIUM2.link) {
                    if (goPREVIOUS && (i - 1) >= 0) {
                        nextOrPreviousSpineItem = publication.Spine[i - 1];
                    } else if (!goPREVIOUS && (i + 1) < publication.Spine.length) {
                        nextOrPreviousSpineItem = publication.Spine[i + 1];
                    }
                    break;
                }
            }
        }
        if (!nextOrPreviousSpineItem) {
            return true;
        }
        if (publicationURL) {
            const uri = new URL(nextOrPreviousSpineItem.Href, publicationURL);
            uri.hash = "";
            uri.search = "";
            const urlNoQueryParams = uri.toString(); // publicationURL + "/../" + nextOrPreviousSpineItem.Href;
            debug(`locationHandleIpcMessage R2_EVENT_PAGE_TURN_RES: ${urlNoQueryParams}`);
            // NOTE that decodeURIComponent() must be called on the toString'ed URL urlNoQueryParams
            // tslint:disable-next-line:max-line-length
            // (in case nextOrPreviousSpineItem.Href contains Unicode characters, in which case they get percent-encoded by the URL.toString())
            handleLink(
                urlNoQueryParams,
                goPREVIOUS,
                false,
                activeWebView.READIUM2.readiumCss,
            );
        }
    } else if (eventChannel === R2_EVENT_READING_LOCATION) {
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_READING_LOCATION;

        // if (!activeWebView) {
        //     return true;
        // }
        if (activeWebView.READIUM2.link && _saveReadingLocation) {
            // TODO: position metrics, based on arbitrary number of characters (1034)
            // https://github.com/readium/architecture/tree/master/positions
            // https://github.com/readium/architecture/tree/master/locators#about-the-notion-of-position
            // https://github.com/readium/architecture/blob/master/locators/locator-api.md
            // if (typeof payload.progression !== "undefined" && _publication && activeWebView.READIUM2.link) {
            //     const totalPositions = _publication.getTotalPositions(activeWebView.READIUM2.link);
            //     if (totalPositions) {
            //         payload.position = totalPositions * payload.progression;
            //         const totalSpinePositions = _publication.getTotalSpinePositions();
            //         if (totalSpinePositions) {
            //             payload.globalProgression = payload.position / totalSpinePositions;
            //         }
            //     }
            // }
            _saveReadingLocation(activeWebView.READIUM2.link.Href, payload);
        }
    } else if (eventChannel === R2_EVENT_LINK) {
        // debug("R2_EVENT_LINK (webview.addEventListener('ipc-message')");
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_LINK;
        debug(`locationHandleIpcMessage R2_EVENT_LINK: ${payload.url}`);
        handleLinkUrl(payload.url, activeWebView.READIUM2.readiumCss);
    } else if (eventChannel === R2_EVENT_AUDIO_SOUNDTRACK) {
        // debug("R2_EVENT_AUDIO_SOUNDTRACK (webview.addEventListener('ipc-message')");
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_AUDIO_SOUNDTRACK;
        handleAudioSoundTrack(payload.url);
    } else if (eventChannel === R2_EVENT_AUDIO_PLAYBACK_RATE) {
        // debug("R2_EVENT_AUDIO_PLAYBACK_RATE (webview.addEventListener('ipc-message')");
        const payload = eventArgs[0] as IEventPayload_R2_EVENT_AUDIO_PLAYBACK_RATE;
        setCurrentAudioPlaybackRate(payload.speed);
    } else {
        return false;
    }
    return true;
}

const AUDIO_SOUNDTRACK_ID = "R2_AUDIO_SOUNDTRACK_ID";
let _currentAudioSoundTrack: string | undefined;
function handleAudioSoundTrack(url: string) {
    if (url === _currentAudioSoundTrack) {
        return;
    }
    _currentAudioSoundTrack = url;
    let audioEl = document.getElementById(AUDIO_SOUNDTRACK_ID);
    if (audioEl && audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
    }
    audioEl = document.createElement("audio"); // no controls => should be invisible
    audioEl.setAttribute("style", "display: none");
    audioEl.setAttribute("id", AUDIO_SOUNDTRACK_ID);
    audioEl.setAttribute("src", url);
    audioEl.setAttribute("loop", "loop");
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.setAttribute("role", "ibooks:soundtrack"); // epub:type
    document.body.appendChild(audioEl);
}

// see webview.addEventListener("ipc-message", ...)
// needed for main process browserWindow.webContents.send()
ipcRenderer.on(R2_EVENT_LINK, (_event: any, payload: IEventPayload_R2_EVENT_LINK) => {
    debug("R2_EVENT_LINK (ipcRenderer.on)");
    debug(payload.url);

    const activeWebView = win.READIUM2.getActiveWebView();
    handleLinkUrl(
        payload.url,
        activeWebView ? activeWebView.READIUM2.readiumCss : undefined);
});

export function shiftWebview(webview: IReadiumElectronWebview, offset: number, backgroundColor: string | undefined) {
    if (!offset) {
        webview.style.transform = "none";
        // if (_slidingViewport) {
        //     _slidingViewport.style.backgroundColor = "white";
        // }
    } else {
        // console.log(`backgroundColor:::::::::: ${backgroundColor}`);
        if (backgroundColor) {
            const domSlidingViewport = win.READIUM2.domSlidingViewport;
            domSlidingViewport.style.backgroundColor = backgroundColor;
        }
        webview.style.transform = `translateX(${offset}px)`;
    }
}

export function navLeftOrRight(left: boolean, spineNav?: boolean) {
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return;
    }

    // metadata-level RTL
    const rtl = isRTL();

    if (spineNav) {
        if (!publication.Spine) {
            return;
        }

        if (!_lastSavedReadingLocation) { // getCurrentReadingLocation()
            return;
        }
        const loc = _lastSavedReadingLocation;

        // document-level RTL
        const rtl_ = loc.docInfo && loc.docInfo.isRightToLeft;
        if (rtl_ !== rtl) {
            debug(`RTL differ?! METADATA ${rtl} vs. DOCUMENT ${rtl_}`);
        }

        // array boundaries overflow are checked further down ...
        const offset = (left ? -1 : 1) * (rtl ? -1 : 1);

        const currentSpineIndex = publication.Spine.findIndex((link) => {
            return link.Href === loc.locator.href;
        });
        if (currentSpineIndex >= 0) {
            const spineIndex = currentSpineIndex + offset;

            // array boundaries overflow are checked here:
            if (spineIndex >= 0 && spineIndex <= (publication.Spine.length - 1)) {
                const nextOrPreviousSpineItem = publication.Spine[spineIndex];

                // handleLinkUrl(publicationURL + "/../" + nextOrPreviousSpineItem.Href);

                const uri = new URL(nextOrPreviousSpineItem.Href, publicationURL);
                uri.hash = "";
                uri.search = "";
                const urlNoQueryParams = uri.toString(); // publicationURL + "/../" + nextOrPreviousSpineItem.Href;
                // NOTE that decodeURIComponent() must be called on the toString'ed URL urlNoQueryParams
                // tslint:disable-next-line:max-line-length
                // (in case nextOrPreviousSpineItem.Href contains Unicode characters, in which case they get percent-encoded by the URL.toString())
                const activeWebView = win.READIUM2.getActiveWebView();
                debug(`navLeftOrRight: ${urlNoQueryParams}`);
                handleLink(
                    urlNoQueryParams,
                    false,
                    false,
                    activeWebView ? activeWebView.READIUM2.readiumCss : undefined,
                );

                return;
            } else {
                shell.beep(); // announce boundary overflow (first or last Spine item)
            }
        }
    } else {
        const goPREVIOUS = left ? !rtl : rtl;
        const payload: IEventPayload_R2_EVENT_PAGE_TURN = {
            direction: rtl ? "RTL" : "LTR",
            go: goPREVIOUS ? "PREVIOUS" : "NEXT",
        };
        const activeWebView = win.READIUM2.getActiveWebView();
        if (activeWebView) {
            setTimeout(async () => {
                await activeWebView.send(R2_EVENT_PAGE_TURN, payload); // .getWebContents()
            }, 0);
        }
    }
}

export function handleLink(
    href: string,
    previous: boolean | undefined,
    useGoto: boolean,
    rcss?: IEventPayload_R2_EVENT_READIUMCSS,
) {
    debug(`handleLink: ${href}`);

    const special = href.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://");
    if (special) {
        debug(`handleLink R2 URL`);
        const okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            debug(`Readium link fail?! ${href}`);
        }
    } else {
        debug(`handleLink non-R2 URL`);
        const okay = loadLink(href, previous, useGoto, rcss);
        if (!okay) {
            if (/^http[s]?:\/\/127\.0\.0\.1/.test(href)) { // href.startsWith("https://127.0.0.1")
                debug(`Internal link, fails to match publication document: ${href}`);
            } else {
                debug(`External link: ${href}`);

                // tslint:disable-next-line:no-floating-promises
                (async () => {
                    try {
                        await shell.openExternal(href);
                    } catch (err) {
                        debug(err);
                    }
                })();
            }
        }
    }
}

export function handleLinkUrl(
    href: string,
    rcss?: IEventPayload_R2_EVENT_READIUMCSS,
) {
    debug(`handleLinkUrl: ${href}`);

    handleLink(href, undefined, false, rcss);
}

export function handleLinkLocator(
    location: Locator | undefined,
    rcss?: IEventPayload_R2_EVENT_READIUMCSS,
) {
    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;

    if (!publication || !publicationURL) {
        return;
    }

    let linkToLoad: Link | undefined;
    let linkToLoadGoto: LocatorLocations | undefined;
    if (location && location.href) {
        if (publication.Spine && publication.Spine.length) {
            linkToLoad = publication.Spine.find((spineLink) => {
                return spineLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
        if (!linkToLoad &&
            publication.Resources && publication.Resources.length) {
            linkToLoad = publication.Resources.find((resLink) => {
                return resLink.Href === location.href;
            });
            if (linkToLoad && location.locations) {
                linkToLoadGoto = location.locations;
            }
        }
    }
    if (!linkToLoad) {
        debug(`handleLinkLocator FAIL ${publicationURL} + ${location ? location.href : "NIL"}`);
    }
    if (!linkToLoad) {
        if (publication.Spine && publication.Spine.length) {
            const firstLinear = publication.Spine[0];
            if (firstLinear) {
                linkToLoad = firstLinear;
            }
        }
    }
    if (linkToLoad) {
        const useGoto = typeof linkToLoadGoto !== "undefined"
            // && typeof linkToLoadGoto.cssSelector !== "undefined"
            ;
        const uri = new URL(linkToLoad.Href, publicationURL);
        uri.hash = "";
        uri.search = "";
        const urlNoQueryParams = uri.toString(); // publicationURL + "/../" + linkToLoad.Href;
        const hrefToLoad = urlNoQueryParams +
            ((useGoto) ? ("?" + URL_PARAM_GOTO + "=" +
                encodeURIComponent_RFC3986(Buffer.from(JSON.stringify(linkToLoadGoto, null, "")).toString("base64"))) :
                "");

        debug(`handleLinkLocator: ${hrefToLoad}`);
        // NOTE that decodeURIComponent() must be called on the toString'ed URL hrefToLoad
        // tslint:disable-next-line:max-line-length
        // (in case linkToLoad.Href contains Unicode characters, in which case they get percent-encoded by the URL.toString())
        handleLink(hrefToLoad, undefined, useGoto, rcss);
    }
}

let _reloadCounter = 0;
export function reloadContent() {
    const activeWebView = win.READIUM2.getActiveWebView();
    if (!activeWebView) {
        return;
    }

    setTimeout(() => {
        // const src = activeWebView.getAttribute("src");
        activeWebView.READIUM2.forceRefresh = true;
        if (activeWebView.READIUM2.link) {
            const uri = new URL(activeWebView.READIUM2.link.Href,
                win.READIUM2.publicationURL);
            uri.hash = "";
            uri.search = "";
            const urlNoQueryParams = uri.toString();
            debug(`reloadContent: ${urlNoQueryParams}`);
            handleLinkUrl(urlNoQueryParams, activeWebView.READIUM2.readiumCss);
        }
        // activeWebView.reloadIgnoringCache();
    }, 0);
}

function loadLink(
    hrefToLoad: string,
    previous: boolean | undefined,
    useGoto: boolean,
    rcss: IEventPayload_R2_EVENT_READIUMCSS | undefined,
    ): boolean {

    const publication = win.READIUM2.publication;
    const publicationURL = win.READIUM2.publicationURL;
    if (!publication || !publicationURL) {
        return false;
    }

    let hrefToLoadHttp = hrefToLoad;
    if (hrefToLoadHttp.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://")) {
        hrefToLoadHttp = convertCustomSchemeToHttpUrl(hrefToLoadHttp);
    }

    const pubIsServedViaSpecialUrlProtocol = publicationURL.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://");

    const publicationURLHttp = pubIsServedViaSpecialUrlProtocol ?
        convertCustomSchemeToHttpUrl(publicationURL) : publicationURL;

    let linkPath: string | undefined;

    const hrefToLoadHttpObj = new URL(hrefToLoadHttp);
    hrefToLoadHttpObj.hash = "";
    hrefToLoadHttpObj.search = "";
    const publicationURLHttpObj = new URL(publicationURLHttp);
    publicationURLHttpObj.hash = "";
    publicationURLHttpObj.search = "";
    let iBreak = -1;
    for (let i = 0; i < publicationURLHttpObj.pathname.length; i++) {
        const c1 = publicationURLHttpObj.pathname[i];
        if (i < hrefToLoadHttpObj.pathname.length) {
            const c2 = hrefToLoadHttpObj.pathname[i];
            if (c1 !== c2) {
                iBreak = i;
                break;
            }
        } else {
            break;
        }
    }
    if (iBreak > 0) {
        linkPath = hrefToLoadHttpObj.pathname.substr(iBreak);
    }

    if (!linkPath) {
        debug(`R2LOADLINK?? ${hrefToLoad} ... ${publicationURL} !!! ${hrefToLoadHttp} ... ${publicationURLHttp}`);

        return false;
    }

    // because URL.toString() percent-encodes Unicode characters in the path!
    linkPath = decodeURIComponent(linkPath);

    debug(`R2LOADLINK: ${hrefToLoad} ... ${publicationURL} ==> ${linkPath}`);

    // const pubUri = new URI(pubJsonUri);
    // // "/pub/BASE64_PATH/manifest.json" ==> "/pub/BASE64_PATH/"
    // const pathPrefix = decodeURIComponent(pubUri.path().replace("manifest.json", ""));
    // // "/pub/BASE64_PATH/epub/chapter.html" ==> "epub/chapter.html"
    // const normPath = decodeURIComponent(linkUri.normalizePath().path());
    // const linkPath = normPath.replace(pathPrefix, "");

    let pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
        return spineLink.Href === linkPath;
    }) : undefined;
    if (!pubLink && publication.Resources) {
        pubLink = publication.Resources.find((resLink) => {
            return resLink.Href === linkPath;
        });
    }
    if (!pubLink) {
        let hrefToLoadHttpNoHash: string | undefined;
        try {
            const hrefToLoadHttpObjUri = new URI(hrefToLoadHttp);
            hrefToLoadHttpObjUri.hash("").normalizeHash();
            hrefToLoadHttpObjUri.search((data: any) => {
                // overrides existing (leaves others intact)
                data[URL_PARAM_PREVIOUS] = undefined;
                data[URL_PARAM_GOTO] = undefined;
                data[URL_PARAM_CSS] = undefined;
                data[URL_PARAM_EPUBREADINGSYSTEM] = undefined;
                data[URL_PARAM_DEBUG_VISUALS] = undefined;
                data[URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
                data[URL_PARAM_REFRESH] = undefined;
            });
            hrefToLoadHttpNoHash = hrefToLoadHttpObjUri.toString();
        } catch (err) {
            debug(err);
        }
        if (hrefToLoadHttpNoHash) {
            pubLink = publication.Spine ? publication.Spine.find((spineLink) => {
                return spineLink.Href === hrefToLoadHttpNoHash;
            }) : undefined;
            if (!pubLink && publication.Resources) {
                pubLink = publication.Resources.find((resLink) => {
                    return resLink.Href === hrefToLoadHttpNoHash;
                });
            }
        }
        if (!pubLink) {
            // tslint:disable-next-line: max-line-length
            debug(`CANNOT LOAD EXT LINK ${hrefToLoad} ... ${publicationURL} --- (${hrefToLoadHttpNoHash}) ==> ${linkPath}`);
            return false;
        }
    }

    if (!pubLink) {
        debug(`CANNOT LOAD LINK ${hrefToLoad} ... ${publicationURL} ==> ${linkPath}`);
        return false;
    }

    const activeWebView = win.READIUM2.getActiveWebView();

    const actualReadiumCss = (activeWebView && activeWebView.READIUM2.readiumCss) ?
        activeWebView.READIUM2.readiumCss :
        obtainReadiumCss(rcss);
    if (activeWebView) {
        activeWebView.READIUM2.readiumCss = actualReadiumCss;
    }

    const rcssJson = adjustReadiumCssJsonMessageForFixedLayout(pubLink, actualReadiumCss);

    const rcssJsonstr = JSON.stringify(rcssJson, null, "");
    const rcssJsonstrBase64 = Buffer.from(rcssJsonstr).toString("base64");

    const fileName = path.basename(linkPath);
    const ext = path.extname(fileName).toLowerCase();
    const isAudio =
        publication.Metadata &&
        publication.Metadata.RDFType &&
        /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType) &&
        ((pubLink.TypeLink && pubLink.TypeLink.startsWith("audio/")) ||
        // fallbacks:
        /\.mp[3|4]$/.test(ext) ||
        /\.wav$/.test(ext) ||
        /\.aac$/.test(ext) ||
        /\.og[g|b|a]$/.test(ext) ||
        /\.aiff$/.test(ext) ||
        /\.wma$/.test(ext) ||
        /\.flac$/.test(ext));

    // Note that with URI (unlike URL) if hrefToLoadHttp contains Unicode characters,
    // the toString() function does not percent-encode them.
    // But also note that if hrefToLoadHttp is already percent-encoded, this is returned as-is!
    // (i.e. do not expect toString() to output Unicode chars from their escaped notation)
    // See decodeURIComponent() above,
    // which is necessary in cases where loadLink() is called with URL.toString() for hrefToLoadHttp
    // ... which it is!
    const hrefToLoadHttpUri = new URI(hrefToLoadHttp);
    if (isAudio) {
        if (useGoto) {
            hrefToLoadHttpUri.hash("").normalizeHash();

            if (pubLink.Duration) {
                const gotoBase64 = hrefToLoadHttpUri.search(true)[URL_PARAM_GOTO];

                if (gotoBase64) {
                    const str = Buffer.from(gotoBase64, "base64").toString("utf8");
                    const json = JSON.parse(str);
                    const gotoProgression = (json as LocatorLocations).progression;
                    if (typeof gotoProgression !== "undefined") {
                        const time = gotoProgression * pubLink.Duration;
                        hrefToLoadHttpUri.hash(`t=${time}`).normalizeHash();
                    }
                }
            }
        }

        hrefToLoadHttpUri.search((data: any) => {
            // overrides existing (leaves others intact)
            data[URL_PARAM_PREVIOUS] = undefined;
            data[URL_PARAM_GOTO] = undefined;
            data[URL_PARAM_CSS] = undefined;
            data[URL_PARAM_EPUBREADINGSYSTEM] = undefined;
            data[URL_PARAM_DEBUG_VISUALS] = undefined;
            data[URL_PARAM_CLIPBOARD_INTERCEPT] = undefined;
            data[URL_PARAM_REFRESH] = undefined;
        });
    } else {
        hrefToLoadHttpUri.search((data: any) => {
            // overrides existing (leaves others intact)

            if (typeof previous === "undefined") {
                // erase unwanted forward of query param during linking
                data[URL_PARAM_PREVIOUS] = undefined;
                // delete data[URL_PARAM_PREVIOUS];
            } else {
                data[URL_PARAM_PREVIOUS] = previous ? "true" : "false";
            }

            if (!useGoto) {
                // erase unwanted forward of query param during linking
                data[URL_PARAM_GOTO] = undefined;
                // delete data[URL_PARAM_GOTO];
            }
        });
        if (useGoto) {
            hrefToLoadHttpUri.hash("").normalizeHash();
        }

        // no need for encodeURIComponent_RFC3986, auto-encoded by URI class

        const rersJson = getEpubReadingSystemInfo();
        const rersJsonstr = JSON.stringify(rersJson, null, "");
        const rersJsonstrBase64 = Buffer.from(rersJsonstr).toString("base64");

        hrefToLoadHttpUri.search((data: any) => {
            // overrides existing (leaves others intact)

            // tslint:disable-next-line:no-string-literal
            data[URL_PARAM_CSS] = rcssJsonstrBase64;

            // tslint:disable-next-line:no-string-literal
            data[URL_PARAM_EPUBREADINGSYSTEM] = rersJsonstrBase64;

            // tslint:disable-next-line:no-string-literal
            data[URL_PARAM_DEBUG_VISUALS] = (IS_DEV &&
                win.READIUM2.DEBUG_VISUALS) ?
                "true" : "false";

            // tslint:disable-next-line:no-string-literal
            data[URL_PARAM_CLIPBOARD_INTERCEPT] =
                win.READIUM2.clipboardInterceptor ?
                "true" : "false";
        });
    }

    const webviewNeedsForcedRefresh = !isAudio &&
        activeWebView && activeWebView.READIUM2.forceRefresh;
    if (activeWebView) {
        activeWebView.READIUM2.forceRefresh = undefined;
    }
    const webviewNeedsHardRefresh = !isAudio &&
        (win.READIUM2.enableScreenReaderAccessibilityWebViewHardRefresh
        && isScreenReaderMounted());

    if (!isAudio && !webviewNeedsHardRefresh && !webviewNeedsForcedRefresh &&
        activeWebView && activeWebView.READIUM2.link === pubLink) {

        const goto = useGoto ? hrefToLoadHttpUri.search(true)[URL_PARAM_GOTO] as string : undefined;
        const hash = useGoto ? undefined : hrefToLoadHttpUri.fragment(); // without #

        debug("WEBVIEW ALREADY LOADED: " + pubLink.Href);

        const payload: IEventPayload_R2_EVENT_SCROLLTO = {
            goto,
            hash,
            previous: previous ? true : false,
        };

        if (IS_DEV) {
            const msgStr = JSON.stringify(payload);
            debug(msgStr);
        }
        if (activeWebView) {
            if (activeWebView.style.transform !== "none") {

                setTimeout(async () => {
                    await activeWebView.send("R2_EVENT_HIDE");
                }, 0);

                setTimeout(async () => {
                    shiftWebview(activeWebView, 0, undefined); // reset
                    await activeWebView.send(R2_EVENT_SCROLLTO, payload);
                }, 10);
            } else {
                setTimeout(async () => {
                    await activeWebView.send(R2_EVENT_SCROLLTO, payload);
                }, 0);
            }
        }

        return true;

        // const webviewToReuse = wv1AlreadyLoaded ? _webview1 : _webview2;
        // // const otherWebview = webviewToReuse === _webview2 ? _webview1 : _webview2;
        // if (webviewToReuse !== activeWebView) {

        //     debug("INTO VIEW ...");

        //     const slidingView = document.getElementById(ELEMENT_ID_SLIDING_VIEWPORT) as HTMLElement;
        //     if (slidingView) {
        //         let animate = true;
        //         if (goto || hash) {
        //             debug("DISABLE ANIM");
        //             animate = false;
        //         } else if (previous) {
        //             if (!slidingView.classList.contains(CLASS_SHIFT_LEFT)) {
        //                 debug("DISABLE ANIM");
        //                 animate = false;
        //             }
        //         }
        //         if (animate) {
        //             if (!slidingView.classList.contains(CLASS_ANIMATED)) {
        //                 slidingView.classList.add(CLASS_ANIMATED);
        //                 slidingView.style.transition = "left 500ms ease-in-out";
        //             }
        //         } else {
        //             if (slidingView.classList.contains(CLASS_ANIMATED)) {
        //                 slidingView.classList.remove(CLASS_ANIMATED);
        //                 slidingView.style.transition = "none";
        //             }
        //         }
        //         if (slidingView.classList.contains(CLASS_SHIFT_LEFT)) {
        //             slidingView.classList.remove(CLASS_SHIFT_LEFT);
        //             slidingView.style.left = "0";

        //             // if (_webview1.classList.contains(CLASS_POS_RIGHT)) {
        //             //     // activeWebView === _webview1;
        //             // } else {
        //             //     // activeWebView === _webview2;
        //             // }
        //         } else {
        //             slidingView.classList.add(CLASS_SHIFT_LEFT);
        //             slidingView.style.left = "-100%";

        //             // if (_webview2.classList.contains(CLASS_POS_RIGHT)) {
        //             //     // activeWebView === _webview1;
        //             // } else {
        //             //     // activeWebView === _webview2;
        //             // }
        //         }
        //     }
        // }
    }

    // if (!isFixedLayout(pubLink)) {
    //     if (_rootHtmlElement) {
    //         _rootHtmlElement.dispatchEvent(new Event(DOM_EVENT_HIDE_VIEWPORT));
    //     }
    // }

    if (activeWebView) {

        if (webviewNeedsForcedRefresh) {
            hrefToLoadHttpUri.search((data: any) => {
                // overrides existing (leaves others intact)

                data[URL_PARAM_REFRESH] = `${++_reloadCounter}`;
            });
        }

        if (win.READIUM2.sessionInfo) {
            hrefToLoadHttpUri.search((data: any) => {
                // overrides existing (leaves others intact)

                if (win.READIUM2.sessionInfo) {
                    const b64SessionInfo = Buffer.from(win.READIUM2.sessionInfo).toString("base64");
                    data[URL_PARAM_SESSION_INFO] = b64SessionInfo;
                }
            });
        }

        const uriStr = hrefToLoadHttpUri.toString();

        const uriStr_ = uriStr.startsWith(READIUM2_ELECTRON_HTTP_PROTOCOL + "://") ? uriStr :
            (pubIsServedViaSpecialUrlProtocol ? convertHttpUrlToCustomScheme(uriStr) : uriStr);

        // if (IS_DEV) {
        //     debug("####### >>> ---");
        //     debug(activeWebView.READIUM2.id);
        //     debug(pubLink.Href);
        //     debug(uriStr);
        //     debug(hrefToLoadHttpUri.hash()); // with #
        //     debug(hrefToLoadHttpUri.fragment()); // without #
        //     // tslint:disable-next-line:no-string-literal
        //     const gto = hrefToLoadHttpUri.search(true)[URL_PARAM_GOTO];
        //     debug(gto ? (Buffer.from(gto, "base64").toString("utf8")) : ""); // decodeURIComponent
        //     // tslint:disable-next-line:no-string-literal
        //     debug(hrefToLoadHttpUri.search(true)[URL_PARAM_PREVIOUS]);
        //     // tslint:disable-next-line:no-string-literal
        //     debug(hrefToLoadHttpUri.search(true)[URL_PARAM_CSS]);
        //     debug("####### >>> ---");
        // }
        if (isAudio) {
            if (IS_DEV) {
                debug(`___HARD AUDIO___ WEBVIEW REFRESH: ${uriStr_}`);
            }

            const readiumCssBackup = activeWebView.READIUM2.readiumCss;
            win.READIUM2.destroyActiveWebView();
            win.READIUM2.createActiveWebView();
            const newActiveWebView = win.READIUM2.getActiveWebView();
            if (newActiveWebView) {
                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                newActiveWebView.READIUM2.link = pubLink;

                // let coverImage: string | undefined;
                const coverLink = publication.GetCover();
                // if (coverLink) {
                //     coverImage = coverLink.Href;
                //     // if (coverImage && !isHTTP(coverImage)) {
                //     //     coverImage = absoluteURL(coverImage);
                //     // }
                // }

                let title: string | undefined;
                if (pubLink.Title) {
                    const regExp = /&(nbsp|amp|quot|lt|gt);/g;
                    const map: any = {
                        amp: "&",
                        gt: ">",
                        lt: "<",
                        nbsp: " ",
                        quot: "\"",
                    };
                    title = pubLink.Title.replace(regExp, (_match, entityName) => {
                        return map[entityName] ? map[entityName] : entityName;
                    });
                }

                const audioPlaybackRate = getCurrentAudioPlaybackRate();
                // let audioPlaybackRate = 1;
                if (rcssJson.setCSS) {
                    // if (rcssJson.setCSS.audioPlaybackRate) {
                    //     audioPlaybackRate = rcssJson.setCSS.audioPlaybackRate;
                    // }

                    rcssJson.setCSS.paged = false;
                }

                let htmlMarkup = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <meta charset="utf-8" />
    ${title ? `<title>${title}</title>` : `<!-- NO TITLE -->`}
    <base href="${publicationURLHttp /* publicationURL */ }" id="${READIUM2_BASEURL_ID}" />
    <style type="text/css">
    /*<![CDATA[*/
    /*]]>*/
    </style>

    <script>
    //<![CDATA[

    const DEBUG_AUDIO = ${IS_DEV};
    const DEBUG_AUDIO_X = ${DEBUG_AUDIO};

    document.addEventListener("DOMContentLoaded", () => {
        const _audioElement = document.getElementById("${AUDIO_ID}");
        _audioElement.playbackRate = ${audioPlaybackRate};

        _audioElement.addEventListener("error", function()
            {
                console.debug("-1) error");
                if (_audioElement.error) {
                    // 1 === MEDIA_ERR_ABORTED
                    // 2 === MEDIA_ERR_NETWORK
                    // 3 === MEDIA_ERR_DECODE
                    // 4 === MEDIA_ERR_SRC_NOT_SUPPORTED
                    console.log(_audioElement.error.code);
                    console.log(_audioElement.error.message);
                }
            }
        );

        if (DEBUG_AUDIO)
        {
            _audioElement.addEventListener("load", function()
                {
                    console.debug("0) load");
                }
            );

            _audioElement.addEventListener("loadstart", function()
                {
                    console.debug("1) loadstart");
                }
            );

            _audioElement.addEventListener("durationchange", function()
                {
                    console.debug("2) durationchange");
                }
            );

            _audioElement.addEventListener("loadedmetadata", function()
                {
                    console.debug("3) loadedmetadata");
                }
            );

            _audioElement.addEventListener("loadeddata", function()
                {
                    console.debug("4) loadeddata");
                }
            );

            _audioElement.addEventListener("progress", function()
                {
                    console.debug("5) progress");
                }
            );

            _audioElement.addEventListener("canplay", function()
                {
                    console.debug("6) canplay");
                }
            );

            _audioElement.addEventListener("canplaythrough", function()
                {
                    console.debug("7) canplaythrough");
                }
            );

            _audioElement.addEventListener("play", function()
                {
                    console.debug("8) play");
                }
            );

            _audioElement.addEventListener("pause", function()
                {
                    console.debug("9) pause");
                }
            );

            _audioElement.addEventListener("ended", function()
                {
                    console.debug("10) ended");
                }
            );

            _audioElement.addEventListener("seeked", function()
                {
                    console.debug("11) seeked");
                }
            );

            if (DEBUG_AUDIO_X) {
                _audioElement.addEventListener("timeupdate", function()
                    {
                        console.debug("12) timeupdate");
                    }
                );
            }

            _audioElement.addEventListener("seeking", function()
                {
                    console.debug("13) seeking");
                }
            );

            _audioElement.addEventListener("waiting", function()
                {
                    console.debug("14) waiting");
                }
            );

            _audioElement.addEventListener("volumechange", function()
                {
                    console.debug("15) volumechange");
                }
            );

            _audioElement.addEventListener("suspend", function()
                {
                    console.debug("16) suspend");
                }
            );

            _audioElement.addEventListener("stalled", function()
                {
                    console.debug("17) stalled");
                }
            );

            _audioElement.addEventListener("ratechange", function()
                {
                    console.debug("18) ratechange");
                }
            );

            _audioElement.addEventListener("playing", function()
                {
                    console.debug("19) playing");
                }
            );

            _audioElement.addEventListener("interruptend", function()
                {
                    console.debug("20) interruptend");
                }
            );

            _audioElement.addEventListener("interruptbegin", function()
                {
                    console.debug("21) interruptbegin");
                }
            );

            _audioElement.addEventListener("emptied", function()
                {
                    console.debug("22) emptied");
                }
            );

            _audioElement.addEventListener("abort", function()
                {
                    console.debug("23) abort");
                }
            );
        }
    }, false);

    //]]>
    </script>
</head>
<body id="${AUDIO_BODY_ID}">
<section id="${AUDIO_SECTION_ID}">
${title ? `<h3 id="${AUDIO_TITLE_ID}">${title}</h3>` : ``}
${coverLink ? `<img id="${AUDIO_COVER_ID}" src="${coverLink.Href}" alt="" ${coverLink.Height ? `height="${coverLink.Height}"` : ""} ${coverLink.Width ? `width="${coverLink.Width}"` : ""} ${coverLink.Width || coverLink.Height ? `style="${coverLink.Height ? `height: ${coverLink.Height}px !important;` : ""} ${coverLink.Width ? `width: ${coverLink.Width}px !important;` : ""}"` : ""}/>` : ``}
    <audio
        id="${AUDIO_ID}"
        ${DEBUG_AUDIO ? `controlsx="controlsx"` : ""}
        autoplay="autoplay"
        preload="metadata">

        <source src="${uriStr /* linkPath */}" type="${pubLink.TypeLink}" />
    </audio>
    ${DEBUG_AUDIO ?
    `
<canvas id="${AUDIO_BUFFER_CANVAS_ID}"> </canvas>
    `
    : ""}

    <!-- SVG credits (tweaked sizing and coloring): https://material.io/resources/icons/?style=round -->

    <div id="${AUDIO_CONTROLS_ID}">
        <button id="${AUDIO_PREVIOUS_ID}" title="previous">
            <svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" width="48px" height="48px">
                <path d="M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z"/></svg>
        </button>
        <button id="${AUDIO_REWIND_ID}" title="rewind">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px">
            <path d="M12 5V2.21c0-.45-.54-.67-.85-.35l-3.8 3.79c-.2.2-.2.51 0 .71l3.79 3.79c.32.31.86.09.86-.36V7c3.73 0 6.68 3.42 5.86 7.29-.47 2.27-2.31 4.1-4.57 4.57-3.57.75-6.75-1.7-7.23-5.01-.07-.48-.49-.85-.98-.85-.6 0-1.08.53-1 1.13.62 4.39 4.8 7.64 9.53 6.72 3.12-.61 5.63-3.12 6.24-6.24C20.84 9.48 16.94 5 12 5zm-2.44 8.49h.45c.21 0 .37-.05.48-.16s.16-.25.16-.43c0-.08-.01-.15-.04-.22s-.06-.12-.11-.17-.11-.09-.18-.11-.16-.04-.25-.04c-.08 0-.15.01-.22.03s-.13.05-.18.1-.09.09-.12.15-.05.13-.05.2h-.85c0-.18.04-.34.11-.48s.17-.27.3-.37.27-.18.44-.23.35-.08.54-.08c.21 0 .41.03.59.08s.33.13.46.23.23.23.3.38.11.33.11.53c0 .09-.01.18-.04.27s-.07.17-.13.25-.12.15-.2.22-.17.12-.28.17c.24.09.42.21.54.39s.18.38.18.61c0 .2-.04.38-.12.53s-.18.29-.32.39-.29.19-.48.24-.38.08-.6.08c-.18 0-.36-.02-.53-.07s-.33-.12-.46-.23-.25-.23-.33-.38-.12-.34-.12-.55h.85c0 .08.02.15.05.22s.07.12.13.17.12.09.2.11.16.04.25.04c.1 0 .19-.01.27-.04s.15-.07.2-.12.1-.11.13-.18.04-.15.04-.24c0-.11-.02-.21-.05-.29s-.08-.15-.14-.2-.13-.09-.22-.11-.18-.04-.29-.04h-.47v-.65zm5.74.75c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.1-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.11-.32c.03-.13.04-.29.04-.48v-.97z"/></svg>
        </button>
        <button id="${AUDIO_PLAYPAUSE_ID}" title="play / pause">
            <svg id="${AUDIO_PLAYPAUSE_ID}_0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" width="60px" height="60px">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1zm4 0c-.55 0-1-.45-1-1V9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1z"/></svg>
            <svg id="${AUDIO_PLAYPAUSE_ID}_1" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24" width="60px" height="60px">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 13.5v-7c0-.41.47-.65.8-.4l4.67 3.5c.27.2.27.6 0 .8l-4.67 3.5c-.33.25-.8.01-.8-.4z"/></svg>
        </button>
        <button id="${AUDIO_FORWARD_ID}" title="forward">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48px" height="48px">
            <path d="M18.92 13c-.5 0-.91.37-.98.86-.48 3.37-3.77 5.84-7.42 4.96-2.25-.54-3.91-2.27-4.39-4.53C5.32 10.42 8.27 7 12 7v2.79c0 .45.54.67.85.35l3.79-3.79c.2-.2.2-.51 0-.71l-3.79-3.79c-.31-.31-.85-.09-.85.36V5c-4.94 0-8.84 4.48-7.84 9.6.6 3.11 2.9 5.5 5.99 6.19 4.83 1.08 9.15-2.2 9.77-6.67.09-.59-.4-1.12-1-1.12zm-8.38 2.22c-.06.05-.12.09-.2.12s-.17.04-.27.04c-.09 0-.17-.01-.25-.04s-.14-.06-.2-.11-.1-.1-.13-.17-.05-.14-.05-.22h-.85c0 .21.04.39.12.55s.19.28.33.38.29.18.46.23.35.07.53.07c.21 0 .41-.03.6-.08s.34-.14.48-.24.24-.24.32-.39.12-.33.12-.53c0-.23-.06-.44-.18-.61s-.3-.3-.54-.39c.1-.05.2-.1.28-.17s.15-.14.2-.22.1-.16.13-.25.04-.18.04-.27c0-.2-.04-.37-.11-.53s-.17-.28-.3-.38-.28-.18-.46-.23-.37-.08-.59-.08c-.19 0-.38.03-.54.08s-.32.13-.44.23-.23.22-.3.37-.11.3-.11.48h.85c0-.07.02-.14.05-.2s.07-.11.12-.15.11-.07.18-.1.14-.03.22-.03c.1 0 .18.01.25.04s.13.06.18.11.08.11.11.17.04.14.04.22c0 .18-.05.32-.16.43s-.26.16-.48.16h-.43v.66h.45c.11 0 .2.01.29.04s.16.06.22.11.11.12.14.2.05.18.05.29c0 .09-.01.17-.04.24s-.08.11-.13.17zm3.9-3.44c-.18-.07-.37-.1-.59-.1s-.41.03-.59.1-.33.18-.45.33-.23.34-.29.57-.1.5-.1.82v.74c0 .32.04.6.11.82s.17.42.3.57.28.26.46.33.37.1.59.1.41-.03.59-.1.33-.18.45-.33.22-.34.29-.57.1-.5.1-.82v-.74c0-.32-.04-.6-.11-.82s-.17-.42-.3-.57-.28-.26-.46-.33zm.01 2.57c0 .19-.01.35-.04.48s-.06.24-.11.32-.11.14-.19.17-.16.05-.25.05-.18-.02-.25-.05-.14-.09-.19-.17-.09-.19-.12-.32-.04-.29-.04-.48v-.97c0-.19.01-.35.04-.48s.06-.23.12-.31.11-.14.19-.17.16-.05.25-.05.18.02.25.05.14.09.19.17.09.18.12.31.04.29.04.48v.97z"/></svg>
        </button>
        <button id="${AUDIO_NEXT_ID}" title="next">
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24" width="48px" height="48px">
            <path d="M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>
        </button>
        <input id="${AUDIO_SLIDER_ID}" type="range" min="0" max="100" value="0" step="1" title="progress" />
        <button id="${AUDIO_TIME_ID}" title="time information 1">-</button>
        <button id="${AUDIO_PERCENT_ID}" title="time information 2">-</button>
        <select id="${AUDIO_RATE_ID}" title="playback speed">
            <option value="2">2x</option>
            <option value="1.75">1.75x</option>
            <option value="1.5">1.5x</option>
            <option value="1.25">1.25x</option>
            <option value="1">1x</option>
            <option value="0.75">0.75x</option>
            <option value="0.5">0.5x</option>
            <option value="0.35">0.35x</option>
            <option value="0.25">0.25x</option>
        </select>
    </div>
</section>
</body>
</html>`;

                // const contentType = "text/html";
                const contentType = "application/xhtml+xml";
                htmlMarkup = readiumCssTransformHtml(htmlMarkup, rcssJson, contentType);

                const b64HTML = Buffer.from(htmlMarkup).toString("base64");
                const dataUri = `data:${contentType};base64,${b64HTML}`;
                newActiveWebView.setAttribute("src", dataUri);
                // newActiveWebView.setAttribute("src", uriStr_);
                // newActiveWebView.setAttribute("srcdoc", "<p>TEST</p>");
                // setTimeout(async () => {
                //     await newActiveWebView.getWebContents().loadURL(uriStr_, { extraHeaders: "pragma: no-cache\n" });
                // }, 0);
            }
            return true;
        } else if (webviewNeedsHardRefresh) {
            if (IS_DEV) {
                debug(`___HARD___ WEBVIEW REFRESH: ${uriStr_}`);
            }

            const readiumCssBackup = activeWebView.READIUM2.readiumCss;
            win.READIUM2.destroyActiveWebView();
            win.READIUM2.createActiveWebView();
            const newActiveWebView = win.READIUM2.getActiveWebView();
            if (newActiveWebView) {
                newActiveWebView.READIUM2.readiumCss = readiumCssBackup;
                newActiveWebView.READIUM2.link = pubLink;
                newActiveWebView.setAttribute("src", uriStr_);
            }
            return true;
        } else {
            if (IS_DEV) {
                debug(`___SOFT___ WEBVIEW REFRESH: ${uriStr_}`);
            }

            const webviewAlreadyHasContent = (typeof activeWebView.READIUM2.link !== "undefined")
                && activeWebView.READIUM2.link !== null;
            activeWebView.READIUM2.link = pubLink;

            if (activeWebView.style.transform !== "none") {
                // activeWebView.setAttribute("src", "data:, ");

                if (webviewAlreadyHasContent) {

                    setTimeout(async () => {
                        await activeWebView.send("R2_EVENT_HIDE");
                    }, 0);
                }

                setTimeout(() => {
                    shiftWebview(activeWebView, 0, undefined); // reset
                    activeWebView.setAttribute("src", uriStr_);
                }, 10);
            } else {
                activeWebView.setAttribute("src", uriStr_);
            }
        }
    }

    // activeWebView.getWebContents().loadURL(uriStr_, { extraHeaders: "pragma: no-cache\n" });
    // activeWebView.loadURL(uriStr_, { extraHeaders: "pragma: no-cache\n" });

    // ALWAYS FALSE => let's comment for now...
    // const enableOffScreenRenderPreload = false;
    // if (enableOffScreenRenderPreload) {
    //     setTimeout(() => {
    //         if (!publication || !pubLink) {
    //             return;
    //         }

    //         const otherWebview = activeWebView === _webview2 ? _webview1 : _webview2;

    //         // let inSpine = true;
    //         const index = publication.Spine.indexOf(pubLink);
    //         // if (!index) {
    //         //     inSpine = false;
    //         //     index = publication.Resources.indexOf(pubLink);
    //         // }
    //         if (index >= 0 &&
    //             previous && (index - 1) >= 0 ||
    //             !previous && (index + 1) < publication.Spine.length
    //             // (index + 1) < (inSpine ? publication.Spine.length : publication.Resources.length)
    //         ) {
    //             const nextPubLink = publication.Spine[previous ? (index - 1) : (index + 1)];
    //             // (inSpine ? publication.Spine[index + 1] : publication.Resources[index + 1]);

    //             if (otherWebview.READIUM2.link !== nextPubLink) {
    //                 const linkUriNext = new URI(publicationURL + "/../" + nextPubLink.Href);
    //                 linkUriNext.normalizePath();
    //                 linkUriNext.search((data: any) => {
    //                     // overrides existing (leaves others intact)

    //                     // tslint:disable-next-line:no-string-literal
    //                     data[URL_PARAM_CSS] = rcssJsonstrBase64;
    //                 });
    //                 const uriStrNext = linkUriNext.toString();

    //                 debug("####### ======");
    //                 debug(otherWebview.READIUM2.id);
    //                 debug(nextPubLink.Href);
    //                 debug(linkUriNext.hash()); // with #
    //                 debug(linkUriNext.fragment()); // without #
    //                 // tslint:disable-next-line:no-string-literal
    //                 debug(linkUriNext.search(true)[URL_PARAM_GOTO]);
    //                 // tslint:disable-next-line:no-string-literal
    //                 debug(linkUriNext.search(true)[URL_PARAM_PREVIOUS]);
    //                 debug("####### ======");
    //                 otherWebview.READIUM2.link = nextPubLink;
    //                 otherWebview.setAttribute("src", uriStrNext);
    //             }
    //         }
    //     }, 300);
    // }

    return true;
}

export interface LocatorExtended {
    audioPlaybackInfo: IAudioPlaybackInfo | undefined;
    locator: Locator;
    paginationInfo: IPaginationInfo | undefined;
    selectionInfo: ISelectionInfo | undefined;
    selectionIsNew: boolean | undefined;
    docInfo: IDocInfo | undefined;

    // not NavDoc epub:type="page-list",
    // but target HTML document's epub:type="pagebreak" / role="doc-pagebreak"
    // (nearest preceding ancestor/sibling)
    epubPage: string | undefined;
}

let _lastSavedReadingLocation: LocatorExtended | undefined;
export function getCurrentReadingLocation(): LocatorExtended | undefined {
    return _lastSavedReadingLocation;
}
let _readingLocationSaver: ((locator: LocatorExtended) => void) | undefined;
const _saveReadingLocation = (docHref: string, locator: IEventPayload_R2_EVENT_READING_LOCATION) => {

    const publication = win.READIUM2.publication;

    let position: number | undefined;
    if (publication && publication.Spine) {
        const isAudio =
            publication.Metadata &&
            publication.Metadata.RDFType &&
            /http[s]?:\/\/schema\.org\/Audiobook$/.test(publication.Metadata.RDFType);
        if (isAudio) {
            const metaDuration = publication.Metadata.Duration;
            let totalDuration = 0;
            let timePosition: number | undefined;
            for (const spineItem of publication.Spine) {
                if (typeof spineItem.Duration !== "undefined") {
                    if (docHref === spineItem.Href) {
                        const percent = typeof locator.locations.progression !== "undefined" ?
                            locator.locations.progression : 0;
                        const time = percent * spineItem.Duration;
                        if (typeof timePosition === "undefined") {
                            timePosition = totalDuration + time;
                        }
                    }

                    totalDuration += spineItem.Duration;
                }
            }
            if (totalDuration !== metaDuration) {
                console.log(`DIFFERENT AUDIO DURATIONS?! ${totalDuration} (spines) !== ${metaDuration} (metadata)`);
            }
            if (typeof timePosition !== "undefined") {
                position = timePosition / totalDuration;
                if (locator.audioPlaybackInfo) {
                    locator.audioPlaybackInfo.globalTime = timePosition;
                    locator.audioPlaybackInfo.globalDuration = totalDuration;
                    locator.audioPlaybackInfo.globalProgression = position;
                }
            }
        }
    }

    _lastSavedReadingLocation = {
        audioPlaybackInfo: locator.audioPlaybackInfo,
        docInfo: locator.docInfo,
        epubPage: locator.epubPage,
        locator: {
            href: docHref,
            locations: {
                cfi: locator.locations.cfi ?
                    locator.locations.cfi : undefined,
                cssSelector: locator.locations.cssSelector ?
                    locator.locations.cssSelector : undefined,
                position: (typeof locator.locations.position !== "undefined") ?
                    locator.locations.position : position,
                progression: (typeof locator.locations.progression !== "undefined") ?
                    locator.locations.progression : undefined,
            },
            text: locator.text,
            title: locator.title,
        },
        paginationInfo: locator.paginationInfo,
        selectionInfo: locator.selectionInfo,
        selectionIsNew: locator.selectionIsNew,
    };

    if (IS_DEV) {
        // debug(">->->", JSON.stringify(_lastSavedReadingLocation, null, "  "));
        debug(">->->");
        debug(_lastSavedReadingLocation);
    }

    if (_readingLocationSaver) {
        _readingLocationSaver(_lastSavedReadingLocation);
    }

    // // tslint:disable-next-line:no-floating-promises
    // (async () => {
    //     try {
    //         const visible = await isLocatorVisible(_lastSavedReadingLocation.locator);
    //         debug(`isLocatorVisible async: ${visible}`);
    //     } catch (err) {
    //         debug(err);
    //     }
    // })();
};
export function setReadingLocationSaver(func: (locator: LocatorExtended) => void) {
    _readingLocationSaver = func;
}

export async function isLocatorVisible(locator: Locator): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const activeWebView = win.READIUM2.getActiveWebView();

        if (!activeWebView) {
            reject("No navigator webview?!");
            return;
        }
        if (!activeWebView.READIUM2.link) {
            reject("No navigator webview link?!");
            return;
        }
        if (activeWebView.READIUM2.link.Href !== locator.href) {
            // debug(`isLocatorVisible FALSE: ${activeWebView.READIUM2.link.Href} !== ${locator.href}`);
            resolve(false);
            return;
        }

        // const cb = (_event: any, payload: IEventPayload_R2_EVENT_LOCATOR_VISIBLE) => {
        //     debug("R2_EVENT_LOCATOR_VISIBLE");
        //     debug(payload.visible);
        // };
        // ipcRenderer.once(R2_EVENT_LOCATOR_VISIBLE, cb);

        const cb = (event: Electron.IpcMessageEvent) => {
            if (event.channel === R2_EVENT_LOCATOR_VISIBLE) {
                const webview = event.currentTarget as IReadiumElectronWebview;
                if (webview !== activeWebView) {
                    reject("Wrong navigator webview?!");
                    return;
                }
                const payloadPong = event.args[0] as IEventPayload_R2_EVENT_LOCATOR_VISIBLE;
                // debug(`isLocatorVisible: ${payload_.visible}`);
                activeWebView.removeEventListener("ipc-message", cb);
                resolve(payloadPong.visible);
            }
        };
        activeWebView.addEventListener("ipc-message", cb);
        const payloadPing: IEventPayload_R2_EVENT_LOCATOR_VISIBLE = { location: locator.locations, visible: false };

        setTimeout(async () => {
            await activeWebView.send(R2_EVENT_LOCATOR_VISIBLE, payloadPing);
        }, 0);
    });
}
