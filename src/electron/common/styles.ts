// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

export const CLASS_PAGINATED = "r2-css-paginated";

export const ZERO_TRANSFORM_CLASS = "r2-zeroTransform";
export const SKIP_LINK_ID = "r2-skip-link";
export const LINK_TARGET_CLASS = "r2-link-target";

export const ROOT_CLASS_REDUCE_MOTION = "r2-reduce-motion";
export const ROOT_CLASS_NO_FOOTNOTES = "r2-no-popup-foonotes";
export const ROOT_CLASS_MATHJAX = "r2-mathjax";
export const POPUP_DIALOG_CLASS = "r2-popup-dialog";
export const FOOTNOTES_CONTAINER_CLASS = "r2-footnote-container";
export const FOOTNOTES_CLOSE_BUTTON_CLASS = "r2-footnote-close";
export const FOOTNOTE_FORCE_SHOW = "r2-footnote-force-show";

// 'a' element: noteref biblioref glossref annoref
//
// @namespace epub "http://www.idpf.org/2007/ops";
// [epub|type~="footnote"]
// VS.
// *[epub\\:type~="footnote"]
//
// :root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="biblioentry"],
// :root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="annotation"]
export const footnotesCssStyles = `
@namespace epub "http://www.idpf.org/2007/ops";

:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="footnote"]:not(.${FOOTNOTE_FORCE_SHOW}),
:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="note"]:not(.${FOOTNOTE_FORCE_SHOW}),
:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="endnote"]:not(.${FOOTNOTE_FORCE_SHOW}),
:root:not(.${ROOT_CLASS_NO_FOOTNOTES}) aside[epub|type~="rearnote"]:not(.${FOOTNOTE_FORCE_SHOW}) {
    display: none;
}

/*
:root.${POPUP_DIALOG_CLASS} {
    overflow: hidden !important;
}
*/

:root[style] dialog#${POPUP_DIALOG_CLASS}::backdrop,
:root dialog#${POPUP_DIALOG_CLASS}::backdrop {
    background: rgba(0, 0, 0, 0.3) !important;
}
:root[style*="readium-night-on"] dialog#${POPUP_DIALOG_CLASS}::backdrop {
    background: rgba(0, 0, 0, 0.65) !important;
}

:root[style] dialog#${POPUP_DIALOG_CLASS},
:root dialog#${POPUP_DIALOG_CLASS} {
    z-index: 3;

    position: fixed;

    width: 90%;
    max-width: 40em;

    bottom: 1em;
    height: 7em;

    margin: 0 auto;
    padding: 0;

    border-radius: 0.3em;
    border-width: 1px;

    background: white !important;
    border-color: black !important;

    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: 1.5em auto 1.5em;
    grid-template-rows: auto 1.5em;
}
:root[style*="readium-night-on"] dialog#${POPUP_DIALOG_CLASS} {
    background: #333333 !important;
    border-color: white !important;
}
:root[style*="readium-sepia-on"] dialog#${POPUP_DIALOG_CLASS} {
    background: var(--RS__backgroundColor) !important;
}
:root[style*="--USER__backgroundColor"] dialog#${POPUP_DIALOG_CLASS} {
    background: var(--USER__backgroundColor) !important;
}
:root[style] .${FOOTNOTES_CONTAINER_CLASS},
:root .${FOOTNOTES_CONTAINER_CLASS} {
    overflow: auto;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 3;

    padding: 0.3em;
    margin: 0.2em;
}

:root[style] .${FOOTNOTES_CONTAINER_CLASS} > div > *,
:root .${FOOTNOTES_CONTAINER_CLASS} > div > * {
    margin: 0 !important;
    padding: 0 !important;
}

/*
:root[style] .${FOOTNOTES_CLOSE_BUTTON_CLASS},
:root .${FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid black;
    background: white !important;
    color: black !important;

    border-radius: 0.8em;
    position: absolute;
    top: -0.9em;
    left: -0.9em;
    width: 1.8em;
    height: 1.8em;
    font-size: 1em !important;
    font-family: Arial !important;
    cursor: pointer;
}
:root[style*="readium-night-on"] .${FOOTNOTES_CLOSE_BUTTON_CLASS} {
    border: 1px solid white !important;
    background: black !important;
    color: white !important;
}
*/
`;

export const TTS_ID_PREVIOUS = "r2-tts-previous";
export const TTS_ID_NEXT = "r2-tts-next";
export const TTS_ID_SLIDER = "r2-tts-slider";
export const TTS_ID_ACTIVE_WORD = "r2-tts-active-word";
export const TTS_ID_ACTIVE_UTTERANCE = "r2-tts-active-utterance";
export const TTS_CLASS_UTTERANCE = "r2-tts-utterance";
export const TTS_ID_CONTAINER = "r2-tts-txt";
export const TTS_ID_INFO = "r2-tts-info";
export const TTS_NAV_BUTTON_CLASS = "r2-tts-button";
export const TTS_ID_SPEAKING_DOC_ELEMENT = "r2-tts-speaking-el";
export const TTS_CLASS_INJECTED_SPAN = "r2-tts-speaking-txt";
export const TTS_CLASS_INJECTED_SUBSPAN = "r2-tts-speaking-word";
export const TTS_ID_INJECTED_PARENT = "r2-tts-speaking-txt-parent";
export const TTS_POPUP_DIALOG_CLASS = "r2-tts-popup-dialog";

export const ttsCssStyles = `

:root[style] dialog#${POPUP_DIALOG_CLASS}.${TTS_POPUP_DIALOG_CLASS},
:root dialog#${POPUP_DIALOG_CLASS}.${TTS_POPUP_DIALOG_CLASS} {
    width: auto;
    max-width: 100%;

    height: auto;
    max-height: 100%;

    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;

    margin: 0;
    padding: 0;

    box-shadow: none;

    border-radius: 0;
    border-style: solid;
    border-width: 2px;
    border-color: black !important;
}

:root[style] div#${TTS_ID_CONTAINER},
:root div#${TTS_ID_CONTAINER} {
    overflow: auto;
    overflow-x: hidden;

    grid-column-start: 1;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    padding: 1em;
    margin: 0;
    margin-left: 0.2em;
    margin-top: 0.2em;
    margin-right: 0.2em;

    hyphens: none !important;
    word-break: keep-all !important;
    word-wrap: break-word !important;

    font-size: 120% !important;

    line-height: initial !important;

    color: #999999 !important;
}
:root[style*="--USER__lineHeight"] div#${TTS_ID_CONTAINER} {
    line-height: calc(var(--USER__lineHeight) * 1.2) !important;
}
:root[style*="readium-night-on"] div#${TTS_ID_CONTAINER} {
    color: #bbbbbb !important;
}
:root[style*="readium-sepia-on"] div#${TTS_ID_CONTAINER}{
    background: var(--RS__backgroundColor) !important;
    color: var(--RS__textColor) !important;
}
:root[style*="--USER__backgroundColor"] div#${TTS_ID_CONTAINER} {
    background: var(--USER__backgroundColor) !important;
}
:root[style*="--USER__textColor"] div#${TTS_ID_CONTAINER} {
    color: var(--USER__textColor) !important;
}
:root[style] #${TTS_ID_INFO},
:root #${TTS_ID_INFO} {
    display: none;

    padding: 0;
    margin: 0;

    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 2;
    grid-row-end: 3;

    font-family: Arial !important;
    font-size: 90% !important;
}

:root[style] #${TTS_ID_SLIDER},
:root #${TTS_ID_SLIDER} {
    padding: 0;
    margin: 0;
    margin-left: 6px;
    margin-right: 6px;
    margin-top: 6px;
    margin-bottom: 6px;

    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 2;
    grid-row-end: 3;

    cursor: pointer;
    -webkit-appearance: none;

    background: transparent !important;
}
:root #${TTS_ID_SLIDER}::-webkit-slider-runnable-track {
    cursor: pointer;

    width: 100%;
    height: 0.5em;

    background: #999999;

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] #${TTS_ID_SLIDER}::-webkit-slider-runnable-track {
    background: #545454;
}
:root #${TTS_ID_SLIDER}::-webkit-slider-thumb {
    -webkit-appearance: none;

    cursor: pointer;

    width: 0.8em;
    height: 1.5em;

    padding: 0;
    margin: 0;
    margin-top: -0.5em;

    border: none;
    border-radius: 0.2em;

    background: #333333;
}
:root[style*="readium-night-on"] #${TTS_ID_SLIDER}::-webkit-slider-thumb {
    background: white;
}
:root[style] button.${TTS_NAV_BUTTON_CLASS} > span,
:root button.${TTS_NAV_BUTTON_CLASS} > span {
    vertical-align: baseline;
}
:root[style] button.${TTS_NAV_BUTTON_CLASS},
:root button.${TTS_NAV_BUTTON_CLASS} {
    border: none;

    font-size: 100% !important;
    font-family: Arial !important;
    cursor: pointer;

    padding: 0;
    margin-top: 0.2em;
    margin-bottom: 0.2em;

    background: transparent !important;
    color: black !important;
}
:root[style*="readium-night-on"] button.${TTS_NAV_BUTTON_CLASS} {
    color: white !important;
}
/*
:root[style*="readium-sepia-on"] button.${TTS_NAV_BUTTON_CLASS} {
    background: var(--RS__backgroundColor) !important;
}
:root[style*="--USER__backgroundColor"] button.${TTS_NAV_BUTTON_CLASS} {
    background: var(--USER__backgroundColor) !important;
}
*/
:root[style] #${TTS_ID_PREVIOUS},
:root #${TTS_ID_PREVIOUS} {
    margin-left: 0.2em;

    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 2;
    grid-row-end: 3;
}
:root[style] #${TTS_ID_NEXT},
:root #${TTS_ID_NEXT} {
    margin-right: 0.2em;

    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 2;
    grid-row-end: 3;
}

:root[style] .${TTS_ID_SPEAKING_DOC_ELEMENT},
:root .${TTS_ID_SPEAKING_DOC_ELEMENT} {
    /*
    outline-color: silver;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
    */
}
:root[style] .${TTS_CLASS_INJECTED_SPAN},
:root .${TTS_CLASS_INJECTED_SPAN} {
    color: black !important;
    background: #FFFFCC !important;

    /* text-decoration: underline; */

    padding: 0;
    margin: 0;
}
/*
:root[style*="readium-night-on"] .${TTS_CLASS_INJECTED_SPAN} {
    color: white !important;
    background: #333300 !important;
}
:root[style] .${TTS_CLASS_INJECTED_SUBSPAN},
:root .${TTS_CLASS_INJECTED_SUBSPAN} {
    text-decoration: underline;
    padding: 0;
    margin: 0;
}
*/
:root[style] .${TTS_ID_INJECTED_PARENT},
:root .${TTS_ID_INJECTED_PARENT} {
    /*
    outline-color: black;
    outline-style: solid;
    outline-width: 2px;
    outline-offset: 1px;
    */
}
:root[style*="readium-night-on"] .${TTS_ID_INJECTED_PARENT} {
    /*
    outline-color: white !important;
    */
}

.${TTS_CLASS_UTTERANCE} {
    margin-bottom: 1em;
    padding: 0;
    display: block;
}

:root[style] div#${TTS_ID_ACTIVE_UTTERANCE},
:root div#${TTS_ID_ACTIVE_UTTERANCE} {
    /* background-color: yellow !important; */

    color: black !important;
}
:root[style*="readium-night-on"] div#${TTS_ID_ACTIVE_UTTERANCE} {
    color: white !important;
}
:root[style*="readium-sepia-on"] div#${TTS_ID_ACTIVE_UTTERANCE} {
    color: black !important;
}
:root[style*="--USER__textColor"] div#${TTS_ID_ACTIVE_UTTERANCE} {
    color: var(--USER__textColor) !important;
}

:root[style] span#${TTS_ID_ACTIVE_WORD},
:root span#${TTS_ID_ACTIVE_WORD} {
    color: black !important;

    /*
    text-decoration: underline;
    text-underline-position: under;
    */
    outline-color: black;
    outline-offset: 2px;
    outline-style: solid;
    outline-width: 1px;

    padding: 0;
    margin: 0;
}
:root[style*="readium-night-on"] span#${TTS_ID_ACTIVE_WORD} {
    color: white !important;
    outline-color: white;
}
:root[style*="readium-sepia-on"] span#${TTS_ID_ACTIVE_WORD} {
    color: black !important;
    outline-color: black;
}
:root[style*="--USER__textColor"] span#${TTS_ID_ACTIVE_WORD} {
    color: var(--USER__textColor) !important;
    outline-color: var(--USER__textColor);
}
`;

export const ROOT_CLASS_INVISIBLE_MASK = "r2-visibility-mask-class";
export const visibilityMaskCssStyles = `

:root.${ROOT_CLASS_INVISIBLE_MASK}[style] > body,
:root.${ROOT_CLASS_INVISIBLE_MASK} > body {
    visibility: hidden !important;
}
`;

export const ROOT_CLASS_KEYBOARD_INTERACT = "r2-keyboard-interact";
export const CSS_CLASS_NO_FOCUS_OUTLINE = "r2-no-focus-outline";
export const focusCssStyles = `

#${SKIP_LINK_ID} {
    display: block;
    overflow: hidden;
    visibility: visible;
    opacity: 1;
    position: absolute;
    left: 10px;
    top: 10px;
    width: 1px;
    height: 1px;
    background-color: transparent;
    color: transparent;
    padding: 0;
    margin: 0;
    border: 0;
    outline: 0;
}
/*
#${SKIP_LINK_ID}:focus {
    width: auto;
    height: auto;
}
*/

@keyframes readium2ElectronAnimation_FOCUS {
    0% {
    }
    100% {
        outline: inherit;
    }
}
:root[style] *:focus,
:root *:focus {
    outline: none;
}
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} *.${CSS_CLASS_NO_FOCUS_OUTLINE}:focus:not(:target):not(.${LINK_TARGET_CLASS}),
:root.${ROOT_CLASS_KEYBOARD_INTERACT} *.${CSS_CLASS_NO_FOCUS_OUTLINE}:focus:not(:target):not(.${LINK_TARGET_CLASS}) {
    outline: none !important;
}
:root[style].${ROOT_CLASS_KEYBOARD_INTERACT} *:focus:not(:target):not(.${LINK_TARGET_CLASS}),
:root.${ROOT_CLASS_KEYBOARD_INTERACT} *:focus:not(:target):not(.${LINK_TARGET_CLASS}) {
    outline-color: blue !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;
}
/*
:root[style]:not(.${ROOT_CLASS_KEYBOARD_INTERACT}) *:focus,
:root:not(.${ROOT_CLASS_KEYBOARD_INTERACT}) *:focus {
    animation-name: readium2ElectronAnimation_FOCUS;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}
*/
`;

export const targetCssStyles = `
@keyframes readium2ElectronAnimation_TARGET {
    0% {
    }
    100% {
        outline: inherit;
    }
}
:root[style] *:target,
:root *:target,
:root[style] *.${LINK_TARGET_CLASS},
:root *.${LINK_TARGET_CLASS}
{
    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 2px !important;

    animation-name: readium2ElectronAnimation_TARGET;
    animation-duration: 3s;
    animation-delay: 1s;
    animation-fill-mode: forwards;
    animation-timing-function: linear;
}
:root[style] *.r2-no-target-outline:target,
:root *.r2-no-target-outline:target,
:root[style] *.r2-no-target-outline.${LINK_TARGET_CLASS},
:root *.r2-no-target-outline.${LINK_TARGET_CLASS} {
    outline: inherit !important;
}
`;

export const selectionCssStyles = `

.${ZERO_TRANSFORM_CLASS} {
    will-change: scroll-position;
    transform: translateX(0px);
}

:root[style] ::selection,
:root ::selection {
background: rgb(155, 179, 240) !important;
color: black !important;
}

:root[style*="readium-night-on"] ::selection {
background: rgb(100, 122, 177) !important;
color: white !important;
}
`;

export const scrollBarCssStyles = `
::-webkit-scrollbar-button {
height: 0px !important;
width: 0px !important;
}

::-webkit-scrollbar-corner {
background: transparent !important;
}

/*::-webkit-scrollbar-track-piece {
background: red;
} */

::-webkit-scrollbar {
width:  14px;
height: 14px;
}

::-webkit-scrollbar-thumb {
background: #727272;
background-clip: padding-box !important;
border: 3px solid transparent !important;
border-radius: 30px;
}

::-webkit-scrollbar-thumb:hover {
background: #4d4d4d;
}

::-webkit-scrollbar-track {
box-shadow: inset 0 0 3px rgba(40, 40, 40, 0.2);
background: #dddddd;
box-sizing: content-box;
}

::-webkit-scrollbar-track:horizontal {
border-top: 1px solid silver;
}
::-webkit-scrollbar-track:vertical {
border-left: 1px solid silver;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-thumb {
background: #a4a4a4;
border: 3px solid #545454;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-thumb:hover {
background: #dedede;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-track {
background: #545454;
}

:root[style*="readium-night-on"] ::-webkit-scrollbar-track:horizontal {
border-top: 1px solid black;
}
:root[style*="readium-night-on"] ::-webkit-scrollbar-track:vertical {
border-left: 1px solid black;
}`;

export const readPosCssStylesAttr1 = "data-readium2-read-pos1";
export const readPosCssStylesAttr2 = "data-readium2-read-pos2";
export const readPosCssStylesAttr3 = "data-readium2-read-pos3";
export const readPosCssStylesAttr4 = "data-readium2-read-pos4";
export const readPosCssStyles = `
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr1}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr1}],
:root[style] *[${readPosCssStylesAttr1}],
:root *[${readPosCssStylesAttr1}] {
    color: black !important;
    background: magenta !important;

    outline-color: magenta !important;
    outline-style: solid !important;
    outline-width: 6px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr2}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr2}],
:root[style] *[${readPosCssStylesAttr2}],
:root *[${readPosCssStylesAttr2}] {
    color: black !important;
    background: yellow !important;

    outline-color: yellow !important;
    outline-style: solid !important;
    outline-width: 4px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr3}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr3}],
:root[style] *[${readPosCssStylesAttr3}],
:root *[${readPosCssStylesAttr3}] {
    color: black !important;
    background: green !important;

    outline-color: green !important;
    outline-style: solid !important;
    outline-width: 2px !important;
    outline-offset: 0px !important;
}
:root[style*="readium-sepia-on"] *[${readPosCssStylesAttr4}],
:root[style*="readium-night-on"] *[${readPosCssStylesAttr4}],
:root[style] *[${readPosCssStylesAttr4}],
:root *[${readPosCssStylesAttr4}] {
    color: black !important;
    background: silver !important;

    outline-color: silver !important;
    outline-style: solid !important;
    outline-width: 1px !important;
    outline-offset: 0px !important;
}`;

export const AUDIO_BUFFER_CANVAS_ID = "r2-audio-buffer-canvas";
export const AUDIO_PROGRESS_CLASS = "r2-audio-progress";
export const AUDIO_ID = "r2-audio";
export const AUDIO_BODY_ID = "r2-audio-body";
export const AUDIO_SECTION_ID = "r2-audio-section";
export const AUDIO_CONTROLS_ID = "r2-audio-controls";
export const AUDIO_COVER_ID = "r2-audio-cover";
export const AUDIO_TITLE_ID = "r2-audio-title";
export const AUDIO_SLIDER_ID = "r2-audio-slider";
export const AUDIO_TIME_ID = "r2-audio-time";
export const AUDIO_PERCENT_ID = "r2-audio-percent";
export const AUDIO_RATE_ID = "r2-audio-rate";
export const AUDIO_PLAYPAUSE_ID = "r2-audio-playPause";
export const AUDIO_PREVIOUS_ID = "r2-audio-previous";
export const AUDIO_NEXT_ID = "r2-audio-next";
export const AUDIO_REWIND_ID = "r2-audio-rewind";
export const AUDIO_FORWARD_ID = "r2-audio-forward";

export const audioCssStyles = `

#${AUDIO_BODY_ID} {
    padding: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    height: 100vh !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    user-select: none;
}

#${AUDIO_SECTION_ID} {
    margin: 0;
    padding: 0;
    min-width: 500px;
}

#${AUDIO_TITLE_ID} {
    margin-top: 1em;
    margin-bottom: 0;
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
    width: 80%;
    text-align: center;
}

#${AUDIO_COVER_ID} {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 500px !important;
    max-height: 250px !important;
    margin-top: 0.4em;
    margin-bottom: 0.6em;
    cursor: pointer;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_COVER_ID} {
    cursor: wait;
}

#${AUDIO_BUFFER_CANVAS_ID} {
    width: 500px;
    height: 20px;

    margin-left: auto;
    margin-right: auto;

    margin-bottom: 1em;

    display: block;
}

#${AUDIO_ID} {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
    height: 2.5em;
    width: 80%;
}

#${AUDIO_CONTROLS_ID} {
    display: block;
    padding: 0;
    margin: 0;
    margin-left: auto;
    margin-right: auto;

    max-width: 500px;
    min-width: 500px;
    width: 500px;
    height: auto;

    display: grid;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

    grid-template-columns: auto 3em 7em 3em auto;
    grid-template-rows: auto 1.5em auto;
}

#${AUDIO_CONTROLS_ID} button {
    border: 0 !important;
    background-color: transparent !important;
    background: transparent !important;
    text-align: center;
    padding: 0;
    margin: 0;
    display: block;
    cursor: pointer;
    position: relative;
}

#${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} {
    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 1;
    grid-row-end: 2;

    box-sizing: border-box;

    justify-self: center;

    width: 60px;
    height: 60px;
}

:root #${AUDIO_CONTROLS_ID} svg,
:root[style] #${AUDIO_CONTROLS_ID} svg {
    fill: #202020;
}
:root[style*="readium-night-on"] #${AUDIO_CONTROLS_ID} svg {
    fill: #999999;
}

:root:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} #${AUDIO_PLAYPAUSE_ID}_0,
:root[style]:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} #${AUDIO_PLAYPAUSE_ID}_0 {

    display: none;
}

:root:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}.pause #${AUDIO_PLAYPAUSE_ID}_1 {
    display: none;
}

:root:not(.${AUDIO_PROGRESS_CLASS}) #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}.pause #${AUDIO_PLAYPAUSE_ID}_0 {
    display: block;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} svg {
    display: none;
}
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID} {
    cursor: wait;
}
:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}:after {
    content: "";
    border-radius: 50%;

    position: absolute;
    width: 60px;
    height: 60px;
    left: 0px;
    top: 0px;

    transform: translateZ(0);
    animation: readium2ElectronAnimation_audioLoad-spin 1.1s infinite linear;

    border-top: 3px solid #999999;
    border-right: 3px solid #999999;
    border-bottom: 3px solid #999999;
    border-left: 3px solid #333333;
}
:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_CONTROLS_ID} #${AUDIO_PLAYPAUSE_ID}:after {

    border-top: 3px solid #202020;
    border-right: 3px solid #202020;
    border-bottom: 3px solid #202020;
    border-left: 3px solid white;
}
@keyframes readium2ElectronAnimation_audioLoad-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

#${AUDIO_CONTROLS_ID} #${AUDIO_NEXT_ID},
#${AUDIO_CONTROLS_ID} #${AUDIO_PREVIOUS_ID},
#${AUDIO_CONTROLS_ID} #${AUDIO_REWIND_ID},
#${AUDIO_CONTROLS_ID} #${AUDIO_FORWARD_ID} {
    width: 48px;
    height: 48px;
    position: relative;
    align-self: center;
}

#${AUDIO_CONTROLS_ID} #${AUDIO_PREVIOUS_ID} {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: left;
}

#${AUDIO_CONTROLS_ID} #${AUDIO_NEXT_ID} {
    grid-column-start: 5;
    grid-column-end: 6;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: right;
}
#${AUDIO_CONTROLS_ID} #${AUDIO_REWIND_ID} {
    grid-column-start: 2;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: right;
}
#${AUDIO_CONTROLS_ID} #${AUDIO_FORWARD_ID} {
    grid-column-start: 4;
    grid-column-end: 5;
    grid-row-start: 1;
    grid-row-end: 2;

    justify-self: left;
}
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_FORWARD_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_REWIND_ID} {
    display: none;
}

#${AUDIO_PERCENT_ID}, #${AUDIO_TIME_ID}, #${AUDIO_RATE_ID} {
    font-size: 0.9em !important;
    font-family: sans-serif !important;
}
#${AUDIO_PERCENT_ID}, #${AUDIO_TIME_ID} {
    margin-top: -0.5em;
}
#${AUDIO_RATE_ID} {
    grid-column-start: 3;
    grid-column-end: 4;
    grid-row-start: 3;
    grid-row-end: 4;

    font-size: 0.8em !important;
    width: 4em;

    justify-self: center;

    text-align: center !important;

    margin-top: -0.5em;

    -webkit-appearance: none;
    border: 1px solid #aaa;
    border-radius: .4em;
    box-sizing: border-box;
    padding: .15em .15em .15em .3em;
    background-color: transparent;

    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23aaa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
    background-repeat: no-repeat, repeat;
    background-position: right .3em top 50%, 0 0;
    background-size: .7em auto, 100%;
}
#${AUDIO_TIME_ID} {
    grid-column-start: 1;
    grid-column-end: 2;
    grid-row-start: 3;
    grid-row-end: 4;

    text-align: left !important;
}
#${AUDIO_PERCENT_ID} {
    grid-column-start: 5;
    grid-column-end: 6;
    grid-row-start: 3;
    grid-row-end: 4;

    text-align: right !important;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_RATE_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_PERCENT_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_TIME_ID} {
    visibility: hidden;
}

:root[style] #${AUDIO_SLIDER_ID},
:root #${AUDIO_SLIDER_ID} {
padding: 0;
margin: 0;

display: block;

grid-column-start: 1;
grid-column-end: 6;
grid-row-start: 2;
grid-row-end: 3;

cursor: pointer;
-webkit-appearance: none;

background: transparent !important;

background-clip: padding-box;
border-radius: 2px;
overflow: hidden;

position: relative;
}

:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID},
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID} {

cursor: wait;
}

:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:before,
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:before {
    content: '';
    position: absolute;
    background-color: #999999;
    left: 0;
    top: 1em;
    height: 0.4em;
    transform: translateZ(0);
    will-change: left, right;
    animation: readium2ElectronAnimation_audioLoad 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
}

:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:after,
:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:after {
    content: '';
    position: absolute;
    background-color: #999999;
    left: 0;
    top: 1em;
    height: 0.4em;
    transform: translateZ(0);
    will-change: left, right;
    animation: readium2ElectronAnimation_audioLoad-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) infinite;
    animation-delay: 1.15s;
}

:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}:after {
    background: #545454;
}

@keyframes readium2ElectronAnimation_audioLoad {
0% {
left: -35%;
right: 100%; }
60% {
left: 100%;
right: -90%; }
100% {
left: 100%;
right: -90%; } }

@keyframes readium2ElectronAnimation_audioLoad-short {
0% {
left: -200%;
right: 100%; }
60% {
left: 107%;
right: -8%; }
100% {
left: 107%;
right: -8%; } }

:root #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track,
:root[style] #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    cursor: pointer;

    width: 100%;
    height: 0.5em;

    background: #999999;

    padding: 0;
    margin: 0;

    border: none;
    border-radius: 0.2em;
}
:root[style*="readium-night-on"] #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: #545454;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track,
:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: transparent !important;
    cursor: wait;
}
:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-runnable-track {
    background: transparent !important;
}

:root #${AUDIO_SLIDER_ID}::-webkit-slider-thumb,
:root[style] #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    -webkit-appearance: none;

    cursor: pointer;

    width: 0.5em;
    height: 1em;

    padding: 0;
    margin: 0;
    margin-top: -0.2em;

    border: none;
    border-radius: 0.2em;

    background: #333333;
}
:root[style*="readium-night-on"] #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: white;
}

:root.${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-thumb,
:root[style].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: transparent !important;
    cursor: wait;
}
:root[style*="readium-night-on"].${AUDIO_PROGRESS_CLASS} #${AUDIO_SLIDER_ID}::-webkit-slider-thumb {
    background: transparent !important;
}
`;
