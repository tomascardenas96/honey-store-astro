// Fontsource packages ship CSS only (no bundled type declarations), which the
// strict tsconfig flags as ts(2882) on side-effect imports. These ambient
// declarations cover every current and future @fontsource / @fontsource-variable import.
declare module "@fontsource/*";
declare module "@fontsource-variable/*";
