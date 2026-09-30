/* Public page paths only: never store URL queries, fragments, referrers or form values. */
(function () {
  'use strict';
  var allowed = ['/', '/about/', '/training/', '/services/ai-workflow-automation/', '/downloads/ai-readiness-checklist'];
  function canonical(path) {
    path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (allowed.indexOf(path + '/') >= 0) path += '/';
    return allowed.indexOf(path) >= 0 ? path : null;
  }
  var current = canonical(window.location.pathname);
  if (!current) return;
  var key = 'katachi.public-page-attribution.v1';
  var attribution = { landing_page: current, lead_source_page: current };
  try {
    var saved = JSON.parse(window.sessionStorage.getItem(key) || 'null');
    if (saved && allowed.indexOf(saved.landing_page) >= 0 && allowed.indexOf(saved.lead_source_page) >= 0) {
      attribution.landing_page = saved.landing_page;
      attribution.lead_source_page = current === '/' ? saved.lead_source_page : current;
    }
    window.sessionStorage.setItem(key, JSON.stringify(attribution));
  } catch (_) {
    // Storage is optional. A contact submission must still work without it.
  }
  window.katachiLeadAttribution = function () {
    // A BFCache-restored page may predate navigation in this same tab.
    try {
      var latest = JSON.parse(window.sessionStorage.getItem(key) || 'null');
      if (latest && allowed.indexOf(latest.landing_page) >= 0 && allowed.indexOf(latest.lead_source_page) >= 0) {
        attribution = { landing_page: latest.landing_page, lead_source_page: latest.lead_source_page };
      }
    } catch (_) {}
    return { landing_page: attribution.landing_page, lead_source_page: attribution.lead_source_page };
  };
}());
