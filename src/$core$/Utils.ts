// @ts-ignore
import html from "./LongText.html?raw";
import Scrollable from "./Scrollable";

//
export const doButtonAction = (button, input: HTMLInputElement)=>{
    //
    if (button.matches(".ux-copy") && (input?.selectionStart || 0) < (input?.selectionEnd || 0)) {
        navigator.clipboard.writeText(input.value.substring(input.selectionStart || 0, input.selectionEnd || 0));
    }

    //
    if (button.matches(".ux-paste") && (input?.selectionStart || 0) <= (input?.selectionEnd || 0)) {
        navigator.clipboard.readText().then(
            (clipText) => {
                const oldStart = input?.selectionStart || 0;
                const paste = (input?.value?.substring(0, input?.selectionStart || 0) || "") + (clipText || "") + (input?.value?.substring?.(input?.selectionEnd || 0) || "");
                if (input) { input.value = paste; };

                //
                input?.setSelectionRange(
                    oldStart + clipText.length,
                    oldStart + clipText.length
                );

                //
                input?.dispatchEvent(new Event("input", {
                    bubbles: true,
                    cancelable: true,
                }))
            },
        );
    }
}

//
export const makeInput = (host?: HTMLElement)=>{
    if (!host) return;
    const input = host.querySelector("input");

    //
    const box = host?.querySelector(".ux-input-box") as HTMLElement;
    const scrollPos = [box.scrollLeft, box.scrollTop];
    new Scrollable(box);

    //
    let selection = false;
    const whenCancel = (ev)=>{
        if (selection) { box.scrollTo({
            left: scrollPos[0],
            top: scrollPos[1],
            behavior: "instant"
        }); };
        selection = false;
    }

    //
    document.addEventListener("pointerup", whenCancel, {capture: true, passive: true});
    document.addEventListener("pointercancel", whenCancel, {capture: true, passive: true});

    //
    document?.addEventListener("selectionchange", ()=>{
        scrollPos[0] = box.scrollLeft;
        scrollPos[1] = box.scrollTop;
        if (input?.selectionStart != input?.selectionEnd) {
            //selection = true;
        }
    }, {capture: true, passive: true});

    //
    const preventScroll = ()=>{
        if (selection) { box.scrollTo({
            left: scrollPos[0],
            top: scrollPos[1],
            behavior: "instant"
        }); };
    }

    //
    box.addEventListener("scroll", preventScroll, {capture: true, passive: true});
    box.addEventListener("scrollend", preventScroll, {capture: true, passive: true});

    //
    const toFocus = ()=>{
        if (document.activeElement != input) {
            input?.removeAttribute?.("readonly");
            input?.focus?.();
        }
    };

    //
    const preventDrag = (ev)=>{
        ev.preventDefault();
        if (ev.dataTransfer) {
            ev.dataTransfer.dropEffect = "none";
        }
    }

    //
    host?.addEventListener("dragstart", preventDrag);
    input?.addEventListener("dragstart", preventDrag);
    box?.addEventListener("dragstart", preventDrag);

    //
    box.addEventListener("focus", toFocus);
    host.addEventListener("focus", toFocus);
}

