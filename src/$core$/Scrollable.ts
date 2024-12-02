import { setProperty } from "./Utils.js";
import { zoomOf } from "./Zoom";

//
const regProp = (options: any)=>{
    try {
        CSS?.registerProperty?.(options);
    } catch(e) {
        console.warn(e);
    };
};

//
regProp?.({
    name: "--percent",
    syntax: "<number>",
    inherits: true,
    initialValue: "0",
});

//
regProp?.({
    name: "--percent-y",
    syntax: "<number>",
    inherits: true,
    initialValue: "0",
});

//
regProp?.({
    name: "--percent-x",
    syntax: "<number>",
    inherits: true,
    initialValue: "0",
});

// TODO: support of fragments
const onBorderObserve = new WeakMap<HTMLElement, Function[]>();
export const observeBorderBox = (element, cb) => {
    if (!onBorderObserve.has(element)) {
        const callbacks: Function[] = [];

        //
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.borderBoxSize) {
                    const borderBoxSize = entry.borderBoxSize[0];
                    if (borderBoxSize) {
                        callbacks.forEach((cb) => cb?.(borderBoxSize, observer));
                    }
                }
            }
        });

        //
        cb?.({
            inlineSize: element.offsetWidth,
            blockSize: element.offsetHeight,
        }, observer);

        //
        onBorderObserve.set(element, callbacks);
        observer.observe(element, {box: "border-box"});
    }

    //
    onBorderObserve.get(element)?.push(cb);
}

//
class Scrollable {
    #scrollable?: HTMLElement;

    //
    constructor(scrollable: HTMLElement, host?: WeakRef<HTMLElement>) {
        this.#scrollable = scrollable;
        const weak = new WeakRef(this);
        const scr_w = new WeakRef(this.#scrollable);

        //
        document.addEventListener("wheel", (ev)=>{
            const scrollable = scr_w?.deref?.();
            if (scrollable?.matches?.(":where(:hover, :active)")) {
                ev.preventDefault();
                ev.stopPropagation();

                //
                //if (ev.deltaMode == WheelEvent.DOM_DELTA_PIXEL)
                {
                    scrollable?.scrollBy?.({
                        left: ((ev?.deltaY || 0)+(ev?.deltaX || 0)), top: 0,
                        behavior: "smooth"
                    });
                }
            }
        }, {passive: false});

        //
        const computeScroll = ()=>{
            const scrollable = scr_w?.deref?.();
            const parent = host?.deref?.();
            if (scrollable) {

                // TODO! support of native CSS scroll values (optimization)...
                setProperty(parent, "--scroll-left"  , scrollable.scrollLeft  , "");
                setProperty(parent, "--scroll-top"   , scrollable.scrollTop   , "");

                //
                setProperty(parent, "--scroll-width" , scrollable.scrollWidth , "");
                setProperty(parent, "--scroll-height", scrollable.scrollHeight, "");
                setProperty(parent, "--offset-width" , scrollable.offsetWidth , "");
                setProperty(parent, "--offset-height", scrollable.offsetHeight, "");

                //
                const scrollBox = parent?.shadowRoot?.querySelector(".u2-scroll-box");
                if (((scrollable?.scrollWidth || 0) - (scrollable?.offsetWidth || 0)) <= 1) {
                    if (!scrollBox?.classList?.contains?.("hidden")) {
                        scrollBox?.classList?.add?.("hidden");
                    }
                } else {
                    if (scrollBox?.classList?.contains?.("hidden")) {
                        scrollBox?.classList?.remove?.("hidden");
                    }
                }
            }
        }

        //
        computeScroll();
        requestIdleCallback(computeScroll, {timeout: 1000});

        //
        const axis   = 0;
        const status = {
            pointerLocation: 0,
            virtualScroll: 0,
            pointerId: -1,
        };

        //
        host?.deref()?.addEventListener("input", computeScroll);
        host?.deref()?.addEventListener("change", computeScroll);

        //
        this.#scrollable.addEventListener("scroll", (ev)=>{
            computeScroll();

            //
            /*if (status.pointerId >= 0) {
                this.#scrollable?.scrollTo({
                    [["left", "top"][axis]]: status.virtualScroll[axis],
                    behavior: "instant",
                });
            }*/
        });

        //
        observeBorderBox(this.#scrollable, (box)=>{
            computeScroll();

            //
            const scrollable = scr_w?.deref?.();
            const parent = host?.deref?.();

            //
            setProperty(parent, "--offset-width" , box.inlineSize, "");
            setProperty(parent, "--offset-height", box.blockSize , "");
        });

        //
        const scrollbar = host?.deref?.()?.shadowRoot?.querySelector?.(".u2-scroll-bar");
        scrollbar?.addEventListener?.("dragstart", (ev)=>{
            ev?.preventDefault?.();
            ev?.stopPropagation?.();
        });

        //
        scrollbar?.addEventListener?.("pointerdown", (ev) => {
            if (status.pointerId < 0) {
                ev?.preventDefault?.();
                ev?.stopPropagation?.();

                //
                status.pointerId = ev.pointerId;
                status.pointerLocation =
                    ev[["clientX", "clientY"][axis]] / zoomOf();
                status.virtualScroll = scr_w?.deref?.()?.[["scrollLeft", "scrollTop"][axis]];

                // @ts-ignore
                ev.target?.setPointerCapture?.(ev.pointerId);
            }
        });

        //
        document.documentElement.addEventListener("pointermove", (ev) => {
            if (ev.pointerId == status.pointerId) {
                ev.stopPropagation();
                ev.preventDefault();

                //
                const scrollable = scr_w?.deref?.();
                const previous = scrollable?.[["scrollLeft", "scrollTop"][axis]];
                const coord = ev[["clientX", "clientY"][axis]] / zoomOf();

                //
                status.virtualScroll +=
                    (coord - status.pointerLocation) /
                    Math.max(Math.max(Math.min(scrollable?.[["offsetWidth", "offsetHeight"][axis]] / Math.max(scrollable?.[["scrollWidth", "scrollHeight"][axis]], 0.0001), 1), 0), 0.0001);
                status.pointerLocation = coord;

                //
                const realShift = status.virtualScroll - previous;
                if (Math.abs(realShift) >= 0.001) {
                    scrollable?.scrollBy({
                        [["left", "top"][axis]]: realShift,
                        behavior: "instant",
                    });
                }
            }
        }, {capture: true});

        //
        const stopScroll = (ev) => {
            if (status.pointerId == ev.pointerId) {
                ev.stopPropagation();
                ev.preventDefault();

                //
                const scrollable = scr_w?.deref?.();
                requestIdleCallback(()=>{
                    scrollable?.scrollTo?.({
                        [["left", "top"][axis]]: status.virtualScroll[axis],
                        behavior: "instant",
                    });
                }, {timeout: 100});

                //
                status.pointerId = -1;
                status.virtualScroll = scrollable?.[["scrollLeft", "scrollTop"][axis]];

                // @ts-ignore
                ev.target?.releasePointerCapture?.(ev.pointerId);
            }
        };

        //
        document.documentElement.addEventListener("pointerup", stopScroll, {capture: true});
        document.documentElement.addEventListener("pointercancel", stopScroll, {capture: true});
    }
};

//
export default Scrollable;
