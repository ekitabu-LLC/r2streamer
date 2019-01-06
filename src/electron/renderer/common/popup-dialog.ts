// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

function getFocusables(rootElement: Element): HTMLOrSVGElement[] {
    const FOCUSABLE_ELEMENTS = [
        "a[href]:not([tabindex^=\"-\"]):not([inert])",
        "area[href]:not([tabindex^=\"-\"]):not([inert])",
        "input:not([disabled]):not([inert])",
        "select:not([disabled]):not([inert])",
        "textarea:not([disabled]):not([inert])",
        "button:not([disabled]):not([inert])",
        "iframe:not([tabindex^=\"-\"]):not([inert])",
        "audio:not([tabindex^=\"-\"]):not([inert])",
        "video:not([tabindex^=\"-\"]):not([inert])",
        "[contenteditable]:not([tabindex^=\"-\"]):not([inert])",
        "[tabindex]:not([tabindex^=\"-\"]):not([inert])",
    ];

    const focusables: HTMLOrSVGElement[] = [];
    const focusableElements = rootElement.querySelectorAll(FOCUSABLE_ELEMENTS.join(","));
    focusableElements.forEach((focusableElement) => {
        if ((focusableElement as HTMLElement).offsetWidth ||
            (focusableElement as HTMLElement).offsetHeight ||
            focusableElement.getClientRects().length) {

            focusables.push((focusableElement as unknown) as HTMLOrSVGElement); // weird TypeScript!
        }
    });
    return focusables;
}
function focusInside(rootElement: Element) {
    const toFocus = rootElement.querySelector("[autofocus]") || getFocusables(rootElement)[0];
    if (toFocus) {
        (toFocus as HTMLOrSVGElement).focus();
    }
}

// interface IEventMap { [key: string]: Array<() => void>; }

let _focusedBeforeDialog: HTMLOrSVGElement | null;

export class PopupDialog {
    private readonly role: string;
    // private shown: boolean;
    private readonly documant: Document;

    // private listeners: IEventMap;

    constructor(readonly dialog: HTMLDialogElement) {

        this.documant = dialog.ownerDocument as Document;

        this.role = this.dialog.getAttribute("role") || "dialog";

        // this.shown = this.dialog.hasAttribute("open");

        // this.listeners = {};
    }

    // public on(type: string, handler: () => void) {
    //     if (!this.listeners[type]) {
    //         this.listeners[type] = [];
    //     }

    //     this.listeners[type].push(handler);

    //     return this;
    // }

    // public off(type: string, handler: () => void) {
    //     const index = this.listeners[type].indexOf(handler);
    //     if (index >= 0) {
    //         this.listeners[type].splice(index, 1);
    //     }
    //     return this;
    // }

    public show() {
        // if (this.shown) {
        //     return;
        // }
        // this.shown = true;

        if (this.dialog.hasAttribute("open")) {
            return;
        }

        _focusedBeforeDialog = (this.documant.activeElement as unknown) as HTMLOrSVGElement; // weird TypeScript

        this.dialog.showModal();

        focusInside(this.dialog);

        this.documant.body.addEventListener("focus", this.maintainFocus, true);
        this.documant.body.addEventListener("keyup", this.bindKeyUp, true);
        this.documant.addEventListener("keydown", this.bindKeyDown);

        // this.fire("show");
    }

    public refocus() {
        if (!_focusedBeforeDialog) {
            return;
        }
        const toFocus = _focusedBeforeDialog;
        setTimeout(() => {
            // console.log("_focusedBeforeDialog");
            // console.log((toFocus as HTMLElement).outerHTML);
            toFocus.focus();
        }, 200);
    }

    public hide() {
        // if (!this.shown) {
        //     return;
        // }
        // this.shown = false;

        this.documant.body.removeEventListener("focus", this.maintainFocus, true);
        this.documant.body.removeEventListener("keyup", this.bindKeyUp, true);
        this.documant.removeEventListener("keydown", this.bindKeyDown);

        this.refocus();
        _focusedBeforeDialog = null;

        // let the above occur even if not open!
        if (this.dialog.hasAttribute("open")) {
            this.dialog.close();
        }

        // this.fire("hide");
    }

    // public destroy() {
    //     this.hide();

    //     // this.fire("destroy");

    //     // this.listeners = {};
    // }

    // private fire(type: string) {
    //     if (!this.listeners[type]) {
    //         return;
    //     }
    //     this.listeners[type].forEach((listener) => {
    //         listener();
    //     });
    // }

    private bindKeyUp(ev: KeyboardEvent) {
        // if (!this.shown) {
        //     return;
        // }

        const ESCAPE_KEY = 27;
        if (ev.which === ESCAPE_KEY) {
            if (this.role !== "alertdialog") {
                ev.preventDefault();
                this.hide();
                return;
            }
        }
    }

    private bindKeyDown(ev: KeyboardEvent) {
        // if (!this.shown) {
        //     return;
        // }

        const TAB_KEY = 9;
        if (ev.which === TAB_KEY) {

            const focusables = getFocusables(this.dialog);

            const focusedItemIndex = this.documant.activeElement ?
                focusables.indexOf((this.documant.activeElement as unknown) as HTMLOrSVGElement) : // weird TypeScript!
                -1;

            const isLast = focusedItemIndex === focusables.length - 1;
            const isFirst = focusedItemIndex === 0;

            let toFocus: HTMLOrSVGElement | undefined;

            if (ev.shiftKey && isFirst) {
                toFocus = focusables[focusables.length - 1];
            } else if (!ev.shiftKey && isLast) {
                toFocus = focusables[0];
            }

            if (toFocus) {
                ev.preventDefault();
                toFocus.focus();
            }
        }
    }

    private maintainFocus(ev: Event) {
        // if (!this.shown) {
        //     return;
        // }

        if (!this.dialog.contains(ev.target as Node)) {
            ev.preventDefault();
            focusInside(this.dialog);
        }
    }
}