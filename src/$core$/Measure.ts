import { fixedClientZoom, unfixedClientZoom } from "./Zoom";

//
const canvas = new OffscreenCanvas(1, 1);
const ctx = canvas.getContext("2d");

//
export const measureText = (text, element)=>{
    const style = getComputedStyle(element, "");

    //
    if (ctx && style) {
        const fontWeight = style.getPropertyValue('font-weight') || 'normal';
        const fontSize = style.getPropertyValue('font-size') || '16px';
        const fontFamily = style.getPropertyValue('font-family') || 'Times New Roman';

        //
        ctx.letterSpacing = style.getPropertyValue('letter-spacing') ?? 'normal';
        ctx.fontStretch = (style.getPropertyValue('font-stretch') ?? 'normal') as CanvasFontStretch;
        ctx.fontKerning = (style.getPropertyValue('font-kerning') ?? 'auto') as CanvasFontKerning;
        ctx.fontVariantCaps = (style.getPropertyValue('font-variant-caps') ?? 'normal') as CanvasFontVariantCaps;
        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

        //
        return ctx.measureText(text);
    }
}

//
export const measureInputInFocus = (input: HTMLInputElement)=>{
    const text = input.value.slice(0, input.selectionEnd || 0);
    return measureText(text, input);
}

// important: point WITHOUT padding!
export const computeCaretPosition = (input: HTMLInputElement, point: [number, number])=>{
    const style = getComputedStyle(input, "");
    const text  = input?.value || "";

    //
    if (ctx && style) {
        const fontWeight = style.getPropertyValue('font-weight') || 'normal';
        const fontSize = style.getPropertyValue('font-size') || '16px';
        const fontFamily = style.getPropertyValue('font-family') || 'Times New Roman';

        //
        ctx.letterSpacing = style.getPropertyValue('letter-spacing') ?? 'normal';
        ctx.fontStretch = (style.getPropertyValue('font-stretch') ?? 'normal') as CanvasFontStretch;
        ctx.fontKerning = (style.getPropertyValue('font-kerning') ?? 'auto') as CanvasFontKerning;
        ctx.fontVariantCaps = (style.getPropertyValue('font-variant-caps') ?? 'normal') as CanvasFontVariantCaps;
        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;

        //
        let currentWidth = 0;
        for (let i=0;i<text.length;i++) {
            currentWidth = ctx.measureText(text.slice(0, i)).width;
            if (currentWidth >= point[0]) { return Math.max(i-1, 0); };
        }
        return text.length;
    }

    //
    return text.length;
}

//
export const computeCaretPositionFromClient = (input: HTMLInputElement, client: [number, number])=>{
    const box = input.getBoundingClientRect();
    const point: [number, number] = [client[0] - box.left / unfixedClientZoom(), client[1] - box.top / unfixedClientZoom()];
    return computeCaretPosition(input, point);
}
