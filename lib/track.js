// Sends a conversion event to Google Analytics and the Meta Pixel, if they are set up.
export function track(event, params = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (window.gtag) window.gtag('event', event, params);
    const fb = { generate_lead: 'Lead', sign_up: 'CompleteRegistration', contact: 'Contact' }[event];
    if (window.fbq && fb) window.fbq('track', fb, params);
  } catch {}
}
