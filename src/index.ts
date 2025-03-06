import initLong from "./$core$/LongText";
import initFocus from "./$core$/FocusText";

//
export * from "./$core$/FocusText";
export * from "./$core$/LongText";

//
export const initializeLT = (ROOT = document.documentElement)=>{
    initLong(ROOT);
    initFocus(ROOT);
}

//
export default initializeLT;
