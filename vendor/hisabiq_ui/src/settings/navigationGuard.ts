/** Installed before HashRouter, whose synchronous POP render can unmount a later listener. */
let active: ((event: PopStateEvent) => void) | undefined;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (event) => active?.(event), true);
}
export function listenSettingsPop(handler: (event: PopStateEvent) => void) {
  active = handler;
  return () => {
    if (active === handler) active = undefined;
  };
}
