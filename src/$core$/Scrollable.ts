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
