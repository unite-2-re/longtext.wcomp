//
import { doButtonAction, makeInput, MOC, styles } from "./Utils";
import { computeCaretPositionFromClient, measureInputInFocus } from "./Measure";
import { zoomOf } from "./Zoom";

// @ts-ignore
import html from "./FocusText.html?raw";

//
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));
export class UIFocusTextElement extends HTMLElement {
    //#input?: HTMLInputElement | null;
    #focus?: HTMLInputElement | null;
    #selectionRange: [number, number] = [0, 0];

    //
    get #input(): HTMLInputElement|null { return this.querySelector("input"); };
    #themeStyle?: HTMLStyleElement;
    #initialized: boolean = false;
    constructor() { super(); }
    #initialize() {
        if (!this.#initialized) {
            this.#initialized = true;
            this.#selectionRange = [0, 0];

            //
            const exists = this.querySelector("input");
            const parser = new DOMParser();
            const dom = parser.parseFromString(html, "text/html");

            //
            const shadowRoot = this.attachShadow({ mode: "open" });
            dom.querySelector("template")?.content?.childNodes.forEach(cp => {
                shadowRoot.appendChild(cp.cloneNode(true));
            });

            // @ts-ignore
            const THEME_URL = "/externals/core/theme.js";
            import(/* @vite-ignore */ "" + `${THEME_URL}`).then((module)=>{
                // @ts-ignore
                this.#themeStyle = module?.default?.(this.shadowRoot);
                if (this.#themeStyle) { this.shadowRoot?.appendChild?.(this.#themeStyle); }
            }).catch(console.warn.bind(console));

            //
            const style = document.createElement("style");
            style.innerHTML = `@import url("${preInit}");`;
            shadowRoot.appendChild(style);

            //
            //const next = this.querySelector("input");
            //this.#input = exists ?? next;
            this.#focus = null;

            //
            this?.addEventListener?.("change", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content") && input?.matches?.("input")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            this?.addEventListener?.("input", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content") && input?.matches?.("input")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            this?.addEventListener?.("focusin", (ev)=>{
                requestIdleCallback(()=>{
                    this.#focus?.setAttribute?.("disabled", "");
                }, {timeout: 1000});
            });

            //
            if (!CSS.supports("field-sizing", "content")) {
                this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
            }

            //
            // @ts-ignore
            navigator?.virtualKeyboard?.hide?.();
            if (this.dataset.hidden == null) { this.#input?.blur?.(); this.dataset.hidden = ""; };
            this?.addEventListener?.("change", (ev)=>{ this.reflectInput(null, ev.type); });
            this?.addEventListener?.("input", (ev)=>{ this.reflectInput(null, ev.type); });
            this?.addEventListener?.("focusout", (ev)=>{
                if ((ev.target as HTMLInputElement)?.matches?.("input")) {
                    this.#selectionRange[0] = (ev.target as HTMLInputElement)?.selectionStart || 0;
                    this.#selectionRange[1] = (ev.target as HTMLInputElement)?.selectionEnd   || this.#selectionRange[0];

                    //
                    //requestIdleCallback(()=>{
                    setTimeout(()=>{
                        this.#focus?.removeAttribute?.("disabled");
                        if (document.activeElement != this.#input) {
                            // @ts-ignore
                            navigator?.virtualKeyboard?.hide?.();
                            if (this.dataset.hidden == null) { this.#input?.blur?.(); this.dataset.hidden = ""; };
                            this.#focus = null;
                        }
                    }, 100);
                    //}, {timeout: 100});
                }
            });

            //
            makeInput(this);

            //
            this?.shadowRoot?.addEventListener("click", (ev)=>{
                const button = ev.target as HTMLElement;
                if (button?.matches?.("button") && this?.shadowRoot?.contains?.(button)) {
                    ev.preventDefault();
                    ev.stopPropagation();

                    //
                    if (document.activeElement != this.#input) { this.restoreFocus(); };
                    if (ev.type == "click") { doButtonAction(button, (document.activeElement as HTMLInputElement) || this.#input); }
                }
            });
        }
    }

    //
    connectedCallback() {
        this.#initialize();
        // @ts-ignore
        navigator?.virtualKeyboard?.hide?.();
        if (this.dataset.hidden == null) { this.#input?.blur?.(); this.dataset.hidden = ""; };
        //this.style.setProperty("display", "none", "important");

        //
        if (!CSS.supports("field-sizing", "content")) {
            this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
        }
    }

    //
    reflectInput(where?: HTMLInputElement | null, type = "change") {
        if ((where ??= this.#focus) && where != this.#input) {
            const newVal = this.#input?.value ?? where.value;
            if (newVal != where.value) {
                where.value = newVal;
                where.dispatchEvent(new Event(type, { bubbles: true }));
            };
        }
    }

    //
    setVirtualFocus(where, onClick = false) {
        //
        if (this.#focus) {
            this.#focus?.removeAttribute?.("disabled");
            this.#focus = null;
        }

        //
        if (this.#input && where != this.#input && where && where?.parentNode && (this.#focus = where)) {
            const oldValue                = this.#input.value  || "";
            const newVal                  = this.#focus?.value || "";
            const range: [number, number] = [this.#focus?.selectionStart ?? this.#input?.selectionStart ?? 0, this.#focus?.selectionEnd ?? this.#input?.selectionEnd ?? 0];
            const oldActive               = document.activeElement;

            //
            if (oldActive != this.#input) {
                if (this.dataset.hidden != null) { delete this.dataset.hidden; };
                requestIdleCallback(()=>{
                    this.#input?.focus?.();
                }, {timeout: 100});
            };

            //
            if (this.#input && this.#focus) {
                if (newVal != oldValue) { this.#input.value = newVal; };
                if ((oldValue != newVal || onClick) && this.#input != this.#focus) {
                    if (!(range[0] == range[1] && (!range[1] || ((range[0]||range[1]||0) >= (this.#focus.value.length-1))))) {
                        this.#input?.setSelectionRange?.(...range);
                    }
                }
            }

            //
            if (onClick) {
                const sl  = measureInputInFocus(this.#input);
                const box = this?.querySelector(".u2-input-box");
                box?.scrollTo?.({
                    left: (sl?.width ?? box?.scrollLeft ?? 0) - 64,
                    top: box?.scrollTop ?? 0,
                    behavior: "smooth"
                });
            }
        }

        //
        setTimeout(()=>{
            if (document.activeElement != this.#input /*|| !this.#focus*/) {
                // @ts-ignore
                navigator?.virtualKeyboard?.hide?.();
                if (this.dataset.hidden == null) { this.#input?.blur?.(); this.dataset.hidden = ""; };
                this.#focus = null;
            }
        }, 100);
    }

    //
    restoreFocus() {
        if (this.#focus && document.activeElement != this.#input && this.dataset.hidden == null) {
            this.#input?.removeAttribute?.("disabled");
            this.#input?.setSelectionRange?.(...(this.#selectionRange || [0, 0]));
            this.#input?.focus?.();
        }
    }
}

//
export const makeFocusable = (ROOT = document.documentElement)=>{
    customElements.define("ui-focustext", UIFocusTextElement);

    // @ts-ignore
    navigator.permissions.query({ name: 'clipboard-write' })?.catch?.(console.warn.bind(console));

    // @ts-ignore
    navigator.permissions.query({ name: 'clipboard-read' })?.catch?.(console.warn.bind(console));

    //
    const enforceFocus = (ev)=>{
        let element = ev?.target as HTMLInputElement;
        if (MOC(element, "input[type=\"text\"], ui-focustext, ui-longtext")) {
            element = (element.matches("input[type=\"text\"]") ? element : element?.querySelector?.("input[type=\"text\"]")) ?? element;
        }

        //
        if (matchMedia("(hover: none) and (pointer: coarse)").matches)
        {
            const dedicated = (ROOT?.querySelector("ui-focustext") as UIFocusTextElement);
            const dInput = dedicated?.querySelector?.("input");
            if (!MOC(element, "ui-focustext, input, ui-longtext") && ev?.type == "click") {
                dInput?.blur?.();
            }

            //
            if (element?.matches?.("input[type=\"text\"]") && !MOC(element, "ui-focustext")) {

                //
                if (["click", "pointerdown", "focus", "focusin"].indexOf(ev?.type || "") >= 0) {
                    if (ev && ev?.type == "pointerdown" && dInput) {
                        const cps = computeCaretPositionFromClient(element, [ev?.clientX / zoomOf(), ev?.clientY / zoomOf()]);
                        dInput?.setSelectionRange(cps, cps);
                    }

                    //
                    if (["click", "focus", "focusin"].indexOf(ev?.type || "") >= 0) {
                        dedicated?.setVirtualFocus?.(element, ev.type == "click" || ev.type == "pointerdown");
                    }
                }

                //
                ev?.preventDefault?.();
                ev?.stopPropagation?.();
            }
        }
    };

    //
    const whenClick = (ev)=>{
        //const button = ev.target as HTMLElement;
        //const dedicated = (ROOT?.querySelector?.("ui-focustext") as UIFocusTextElement);

        //
        enforceFocus(ev);
    }

    //
    ROOT?.addEventListener?.("click", whenClick);
    ROOT?.addEventListener?.("pointerdown", whenClick);
    ROOT?.addEventListener?.("select", enforceFocus);
    ROOT?.addEventListener?.("selectionchange", enforceFocus);
    ROOT?.addEventListener?.("selectstart", enforceFocus);
    ROOT?.addEventListener?.("focusin", (ev)=>{
        const input = ev?.target as HTMLElement;
        if (input?.matches("input[type=\"text\"]") && !input?.closest?.("ui-focustext") && input instanceof HTMLInputElement) {
            requestIdleCallback(() => {
                if (document.activeElement == input && input.matches("input")) { enforceFocus(ev); }
            }, {timeout: 100});
        }
    });
}

//
export default makeFocusable;
