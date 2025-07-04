// Injects the getIce helper into the browser context for Playwright tests
window.getIce = function(el) {
  el.attr('contentEditable', true);
  document.body.appendChild(el[0]);
  return new ice.InlineChangeEditor({
    element: el[0],
    isTracking: true,
    changeIdAttribute: 'cid',
    userIdAttribute: 'userid',
    userNameAttribute: 'username',
    timeAttribute: 'time',
    currentUser: { id: '4', name: 'Ted' },
    changeTypes : {
      insertType: {tag: 'span', alias: 'ins' },
      deleteType: {tag: 'span', alias: 'del' }
    },
    plugins: [
      'IceAddTitlePlugin',
      'IceSmartQuotesPlugin',
      { name: 'IceCopyPastePlugin', settings: { preserve: 'p,a[href],strong[*],em[id|class]' }}
    ]
  }).startTracking();
};
