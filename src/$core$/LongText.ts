// @ts-ignore
import styles from "./LongText.scss?inline&compress";

// @ts-ignore
import html from "./LongText.html?raw";
import { doButtonAction, makeInput } from "./Utils";

//
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));

//
class LongTextElement extends HTMLElement {
    #input?: HTMLInputElement | null;
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
            const whenClick = (ev)=>{
                const button = ev.target as HTMLElement;
                if (button.matches("u-longtext button") && this.contains(button)) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (document.activeElement == button) { this.restoreFocus(); };
                    if (ev.type == "click") {
                        doButtonAction(button, document.activeElement as HTMLInputElement);
                    }
                }
            }

            //
            document.addEventListener("click", whenClick, {capture: true});
            document.addEventListener("pointerdown", whenClick, {capture: true});

            //
            makeInput(this);
        }
    }

    //
    /*static get observedAttributes() {
        return ['value', 'maxlength', 'type', 'autocomplete'];
    }

    //
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.#input && oldValue != newValue) {
            this.#input.setAttribute(name, newValue);
            if (name == "value") {
                this.#input.name = newValue;
            }
        }
    }*/

    //
    constructor() {
        super();
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
customElements.define("u-longtext", LongTextElement);

//
export default () => {};
export { LongTextElement };