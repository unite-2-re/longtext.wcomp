// @ts-ignore
import styles from "./LongText.scss?inline&compress";

// @ts-ignore
import html from "./FocusText.html?raw";
import { doButtonAction, makeInput, MOC } from "./Utils";
import { computeCaretPositionFromClient, measureInputInFocus } from "./Measure";
import { zoomOf } from "./Zoom";

//
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));

//
export class UIFocusTextElement extends HTMLElement {
    #input?: HTMLInputElement | null;
    #focus?: HTMLInputElement | null;
    #selectionRange: [number, number] = [0, 0];
    #initialized: boolean = false;

    //
    constructor() { super(); }
    #initialize() {
        if (!this.#initialized) {
            this.#initialized = true;

            //
            const exists = this.querySelector("input");
            const parser = new DOMParser();
            const dom = parser.parseFromString(html, "text/html");
            //if (exists) { this.removeChild(exists); };

            //
            const shadowRoot = this.attachShadow({ mode: "open" });
            dom.querySelector("template")?.content?.childNodes.forEach(cp => {
                shadowRoot.appendChild(cp.cloneNode(true));
            });

            //
            const style = document.createElement("style");
            style.innerHTML = `@import url("${preInit}");`;
            shadowRoot.appendChild(style);

            //
            this.#selectionRange = [0, 0];
            this.#focus = null;

            //
            const next = this.querySelector("input");
            this.#input = exists ?? next;

            //
            this?.addEventListener("change", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content") && input?.matches?.("input")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            this?.addEventListener("input", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content") && input?.matches?.("input")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            this?.addEventListener("focusin", (ev)=>{
                requestIdleCallback(()=>{
                    this.#focus?.setAttribute?.("disabled", "");
                }, {timeout: 1000});
            });

            //
            if (!CSS.supports("field-sizing", "content")) {
                this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
            }

            //
            this?.addEventListener("change", (ev)=>{ this.reflectInput(); });
            this?.addEventListener("input", (ev)=>{ this.reflectInput(); });
            this?.addEventListener("focusout", (ev)=>{
                if ((ev.target as HTMLInputElement)?.matches?.("input")) {
                    //
                    this.#selectionRange[0] = (ev.target as HTMLInputElement)?.selectionStart || 0;
                    this.#selectionRange[1] = (ev.target as HTMLInputElement)?.selectionEnd   || this.#selectionRange[0];

                    //
                    requestIdleCallback(()=>{
                        this.#focus?.removeAttribute?.("disabled");

                        //
                        if (document.activeElement != this.#input) {
                            this.style.setProperty("display", "none", "important");
                            this.#focus = null;
                        }
                    }, {timeout: 100});
                }
            });

            //
            this.style.setProperty("display", "none", "important");
            this.#focus = null;

            //
            makeInput(this);
        }
    }

    //
    connectedCallback() {
        this.#initialize();
        this.style.setProperty("display", "none", "important");

        //
        if (!CSS.supports("field-sizing", "content")) {
            this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
        }
    }

    //
    reflectInput(where?: HTMLInputElement | null) {
        if ((where ??= this.#focus) && where != this.#input) {
            const newVal = this.#input?.value ?? where.value;
            if (newVal != where.value) { where.value = newVal; };
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
            //requestAnimationFrame(()=>{
                if (oldActive != this.#input) {
                    this.style.removeProperty("display");
                    this.#input?.focus?.();
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
            //});
        }

        //
        requestIdleCallback(()=>{
            if (document.activeElement != this.#input || !this.#focus) {
                this.style.setProperty("display", "none", "important");
            }
        }, {timeout: 100});
    }

    //
    restoreFocus() {
        if (this.#focus && document.activeElement != this.#input && this.style.getPropertyValue("display") != "none") {
            this.#input?.setSelectionRange?.(...(this.#selectionRange || [0, 0]));
            this.#input?.focus?.();
        }
    }
}

//
export const makeFocusable = (ROOT = document.documentElement)=>{
    customElements.define("ui-focustext", UIFocusTextElement);

    //
    const enforceFocus = (ev)=>{
        let element = ev?.target as HTMLInputElement;
        if (MOC(element, "input[type=\"text\"], ui-focustext, ui-longtext") && !element.matches("input[type=\"text\"]")) {
            element = element?.querySelector?.("input[type=\"text\"]") ?? element;
        }

        //
        if (matchMedia("(hover: none) and (pointer: coarse)").matches)
        {
            const dedicated = (ROOT?.querySelector("ui-focustext") as UIFocusTextElement);
            const dInput = dedicated?.querySelector?.("input");

            //
            if (!MOC(element, "ui-focustext") && ev?.type == "click") {
                dInput?.blur?.();
            }

            //
            if (element?.matches?.("input[type=\"text\"]") && !element?.closest?.("ui-focustext")) {

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
        const button = ev.target as HTMLElement;
        const dedicated = (ROOT?.querySelector?.("ui-focustext") as UIFocusTextElement);

        //
        enforceFocus(ev);

        //
        if (button?.matches?.("ui-focustext button") && dedicated?.contains?.(button)) {
            ev.preventDefault();
            ev.stopPropagation();
            if (document.activeElement == button) { dedicated.restoreFocus(); };
            if (ev.type == "click") {
                doButtonAction(button, document.activeElement as HTMLInputElement);
            }
        }
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
            requestIdleCallback(()=>{
                if (document.activeElement == input) { enforceFocus(ev); }
            }, {timeout: 100});
        }
    });
}

//
export default makeFocusable;
