// @ts-ignore
import styles from "./LongText.scss?inline&compress";

// @ts-ignore
import html from "./LongText.html?raw";
import { doButtonAction, makeInput } from "./Utils";

//
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));

//
export class UILongTextElement extends HTMLElement {
    #input?: HTMLInputElement | null;
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
                //this.appendChild(cp.cloneNode(true));
                shadowRoot.appendChild(cp.cloneNode(true));
            });

            //
            const style = document.createElement("style");
            style.innerHTML = `@import url("${preInit}");`;
            shadowRoot.appendChild(style);

            //
            const next = this.querySelector("input");
            this.#input = exists ?? next;

            //
            this.addEventListener("change", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content") && input?.matches?.("input")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            this.addEventListener("input", (ev)=>{
                const input = ev.target as HTMLInputElement;
                if (!CSS.supports("field-sizing", "content") && input?.matches?.("input")) {
                    input?.style?.setProperty("inline-size", (input?.value||"").length + "ch");
                }
            });

            //
            if (!CSS.supports("field-sizing", "content")) {
                this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
            }

            //
            //const weak = new WeakRef(this);

            //
            makeInput(this);
        }
    }

    //
    connectedCallback() {
        this.#initialize();

        //
        if (!CSS.supports("field-sizing", "content")) {
            this.#input?.style?.setProperty("inline-size", (this.#input?.value||"").length + "ch");
        }
    }

    //
    restoreFocus() {
        if (document.activeElement != this.#input) {
            this.#input?.setSelectionRange?.(...(this.#selectionRange || [0, 0]));
            this.#input?.focus?.();
        }
    }
}

//
export default (ROOT = document.documentElement) => {
    const whenClick = (ev)=>{
        const button = ev.target as any;
        const input  = button?.closest?.("ui-longtext");
        if (button?.matches?.("ui-longtext button") && input?.contains?.(button)) {
            ev?.preventDefault?.();
            ev?.stopPropagation?.();

            //
            if (document.activeElement == button) { input?.restoreFocus?.(); };
            if (ev?.type == "click") {
                doButtonAction(button, document.activeElement as HTMLInputElement);
            }
        }
    }

    //
    ROOT?.addEventListener?.("click", whenClick, {capture: true});
    ROOT?.addEventListener?.("pointerdown", whenClick, {capture: true});

    //
    customElements.define("ui-longtext", UILongTextElement);
};
