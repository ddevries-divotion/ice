// Injects the getIce helper into the browser context for Playwright tests
window.getIce = function (el) {
  // If el is a jQuery object, convert to native element
  if (typeof el.attr === "function" && el[0]) {
    el[0].setAttribute("contentEditable", true);
    document.body.appendChild(el[0]);
    el = el[0];
  } else if (el instanceof HTMLElement) {
    el.setAttribute("contentEditable", true);
    document.body.appendChild(el);
  }
  return new ice.InlineChangeEditor({
    element: el,
    isTracking: true,
    changeIdAttribute: "cid",
    userIdAttribute: "userid",
    userNameAttribute: "username",
    timeAttribute: "time",
    currentUser: { id: "4", name: "Ted" },
    changeTypes: {
      insertType: { tag: "span", alias: "ins" },
      deleteType: { tag: "span", alias: "del" },
    },
    plugins: [
      "IceAddTitlePlugin",
      "IceSmartQuotesPlugin",
      {
        name: "IceCopyPastePlugin",
        settings: { preserve: "p,a[href],strong[*],em[id|class]" },
      },
    ],
  }).startTracking();
};
