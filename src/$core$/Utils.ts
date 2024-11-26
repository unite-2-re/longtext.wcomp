// @ts-ignore
import html from "./LongText.html?raw";
import Scrollable from "./Scrollable";

//
export const doButtonAction = (button, input: HTMLInputElement)=>{
    //
    if (button.matches(".u2-copy") && (input?.selectionStart || 0) < (input?.selectionEnd || 0)) {
        navigator.clipboard.writeText(input.value.substring(input.selectionStart || 0, input.selectionEnd || 0));
    }

    //
    if (button.matches(".u2-paste") && (input?.selectionStart || 0) <= (input?.selectionEnd || 0)) {
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
    const input = host?.querySelector?.("input");
    const weak  = new WeakRef(host);
    const scp   = [0, 0];
    const scp_w = new WeakRef(scp); //scrollPos

    //
    {
        const box = host?.querySelector?.(".u2-input-box") as HTMLElement;
        const scrollPos = scp;
        if (scrollPos) {
            scrollPos[0] = box?.scrollLeft || 0;
            scrollPos[1] = box?.scrollTop  || 0;
        }
        new Scrollable(box);
    }

    //
    let selection = false;
    const whenCancel = (ev)=>{
        const box = weak?.deref?.()?.querySelector?.(".u2-input-box") as HTMLElement;
        const scrollPos = scp_w?.deref?.();
        if (selection) { box.scrollTo({
            left: scrollPos?.[0] || 0,
            top : scrollPos?.[1] || 0,
            behavior: "instant"
        }); };
        selection = false;
    }

    //
    document.addEventListener("pointerup", whenCancel, {capture: true, passive: true});
    document.addEventListener("pointercancel", whenCancel, {capture: true, passive: true});

    //
    document?.addEventListener("selectionchange", ()=>{
        const box = weak?.deref?.()?.querySelector(".u2-input-box") as HTMLElement;
        const scrollPos = scp_w?.deref?.();
        if (scrollPos) {
            scrollPos[0] = box?.scrollLeft || 0;
            scrollPos[1] = box?.scrollTop  || 0;
        }
        if (input?.selectionStart != input?.selectionEnd) {
            //selection = true;
        }
    }, {capture: true, passive: true});

    //
    const preventScroll = ()=>{
        const box = weak?.deref?.()?.querySelector(".u2-input-box") as HTMLElement;
        const scrollPos = [box.scrollLeft, box.scrollTop];
        if (selection) { box.scrollTo({
            left: scrollPos[0],
            top: scrollPos[1],
            behavior: "instant"
        }); };
    }

    //
    {
        const box = host?.querySelector?.(".u2-input-box") as HTMLElement;
        box?.addEventListener?.("scroll"   , preventScroll, {capture: true, passive: true});
        box?.addEventListener?.("scrollend", preventScroll, {capture: true, passive: true});
    }

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
    input?.addEventListener?.("dragstart", preventDrag);
    host?.addEventListener?.("dragstart", preventDrag);
    host?.addEventListener?.("focus", toFocus);

    {   //
        const box = host?.querySelector?.(".u2-input-box") as HTMLElement;
        box.addEventListener?.("focus", toFocus);
        box?.addEventListener?.("dragstart", preventDrag);
    }
}

