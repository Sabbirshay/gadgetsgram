/* Vercel Speed Insights Initialization */
(function() {
  'use strict';
  
  // Initialize the Speed Insights queue before the script loads
  window.si = window.si || function() {
    (window.siq = window.siq || []).push(arguments);
  };
  
  // Load the Speed Insights script
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  script.dataset.sdkn = '@vercel/speed-insights/vanilla';
  script.dataset.sdkv = '2.0.0';
  
  script.onerror = function() {
    console.warn('[Speed Insights] Failed to load script. This may be expected in development.');
  };
  
  document.head.appendChild(script);
})();
