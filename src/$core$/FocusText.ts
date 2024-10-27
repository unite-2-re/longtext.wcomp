// @ts-ignore
import styles from "./LongText.scss?inline";

// @ts-ignore
import html from "./FocusText.html?raw";
import { doButtonAction, makeInput } from "./Utils";
import { computeCaretPositionFromClient, measureInputInFocus } from "./Measure";
import { zoomOf } from "./Zoom";

//
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));

//
export const MOC = (element: HTMLElement | null, selector: string): boolean => {
    return (!!element?.matches?.(selector) || !!element?.closest?.(selector));
};

//
export const MOCElement = (element: HTMLElement | null, selector: string): HTMLElement | null => {
    return ((!!element?.matches?.(selector) ? element : null) || element?.closest?.(selector)) as HTMLElement | null;
};

//
class FocusTextElement extends HTMLElement {
    #input?: HTMLInputElement | null;
    #focus?: HTMLInputElement | null;
    #selectionRange: [number, number] = [0, 0];
    #initialized: boolean = false;

    //
    #initialize() {
        if (!this.#initialized) {
            this.#initialized = true;

            //
            const exists = this.querySelector("input");
            const parser = new DOMParser();
            const dom = parser.parseFromString(html, "text/html");
            if (exists) { this.removeChild(exists); };

            //
            this.innerHTML = "";
            dom.querySelector("template")?.content?.childNodes.forEach(cp => {
                this.appendChild(cp.cloneNode(true));
            });

            //
            const style = document.createElement("style");
            style.innerHTML = `@import url("${preInit}");`;
            this.appendChild(style);

            //
            this.#selectionRange = [0, 0];
            this.#focus = null;

            //
            const next = this.querySelector("input");
            this.#input = exists ?? next;
            if (exists) { next?.replaceWith?.(exists); }

            //
            this.#input?.addEventListener("change", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            this.#input?.addEventListener("input", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            if (!CSS.supports("field-sizing", "content")) {
                this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
            }

            //
            this.#input?.addEventListener("focus", (ev)=>{
                requestAnimationFrame(()=>{
                    this.#focus?.setAttribute?.("disabled", "");
                });
            });

            //
            this.#input?.addEventListener("change", (ev)=>{ this.reflectInput(); });
            this.#input?.addEventListener("input", (ev)=>{ this.reflectInput(); });
            this.#input?.addEventListener("blur", (ev)=>{
                //
                this.#selectionRange[0] = (ev.target as HTMLInputElement)?.selectionStart || 0;
                this.#selectionRange[1] = (ev.target as HTMLInputElement)?.selectionEnd   || this.#selectionRange[0];

                //
                requestAnimationFrame(()=>{
                    this.#focus?.removeAttribute?.("disabled");

                    //
                    if (document.activeElement != this.#input) {
                        this.style.setProperty("display", "none", "important");
                        this.#focus = null;
                    }
                });
            });

            //
            this.style.setProperty("display", "none", "important");
            this.#focus = null;

            //
            makeInput(this);
        }
    }



    //
    constructor() {
        super();

        //
        //this.style.setProperty("display", "none", "important");
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
        requestAnimationFrame(()=>{
            if (document.activeElement != this.#input || !this.#focus) {
                this.style.setProperty("display", "none", "important");
            }
        });
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
//export default FocusTextElement;
customElements.define("u-focustext", FocusTextElement);

//
export default () => {};
export { FocusTextElement };

//
const enforceFocus = (ev)=>{
    let element = ev?.target as HTMLInputElement;
    if (MOC(element, "input[type=\"text\"], u-focustext, u-longtext") && !element.matches("input[type=\"text\"]")) {
        element = element?.querySelector?.("input[type=\"text\"]") ?? element;
    }

    //
    if (matchMedia("(hover: none) and (pointer: coarse)").matches)
    {
        const dedicated = (document.querySelector("u-focustext") as FocusTextElement);
        const dInput = dedicated?.querySelector?.("input");

        //
        if (!MOC(element, "u-focustext") && ev?.type == "click") {
            dInput?.blur?.();
        }

        //
        if (element?.matches?.("input[type=\"text\"]") && !element?.closest?.("u-focustext")) {

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
    const dedicated = (document.querySelector("u-focustext") as FocusTextElement);

    //
    enforceFocus(ev);

    //
    if (button.matches("u-focustext button") && dedicated.contains(button)) {
        ev.preventDefault();
        ev.stopPropagation();
        if (document.activeElement == button) { dedicated.restoreFocus(); };
        if (ev.type == "click") {
            doButtonAction(button, document.activeElement as HTMLInputElement);
        }
    }
}

//
document.documentElement.addEventListener("click", whenClick);
document.documentElement.addEventListener("pointerdown", whenClick);

//
document.addEventListener("focusin", (ev)=>{
    const input = ev?.target as HTMLElement;
    if (input?.matches("input[type=\"text\"]") && !input?.closest?.("u-focustext") && input instanceof HTMLInputElement) {
        requestAnimationFrame(()=>{
            if (document.activeElement == input) { enforceFocus(ev); }
        });
    }
});

//
document.addEventListener("select", enforceFocus);
document.addEventListener("selectionchange", enforceFocus);
document.addEventListener("selectstart", enforceFocus);

