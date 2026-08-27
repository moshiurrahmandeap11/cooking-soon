/* ==========================================================================
   LABTO COOKING - SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initLottieAnimation();
  initSubscribeForm();
});

/* --------------------------------------------------------------------------
   0. Countdown Timer (Target: Sept 1, 2026 12:00 PM BST / UTC+6)
   ISO Standard: 2026-09-01T12:00:00+06:00
   -------------------------------------------------------------------------- */
function initCountdown() {
  // Target: September 1, 2026 at 12:00:00 PM Bangladesh Standard Time (UTC+6)
  const targetDate = new Date("2026-09-01T12:00:00+06:00").getTime();

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minsEl.textContent = String(minutes).padStart(2, "0");
    secsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/* --------------------------------------------------------------------------
   1. Lottie Animation Initialization
   -------------------------------------------------------------------------- */
function initLottieAnimation() {
  const container = document.getElementById('lottie-container');
  if (!container) return;

  try {
    const anim = lottie.loadAnimation({
      container: container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: './AI chat bot.json'
    });

    anim.addEventListener('data_failed', () => {
      showFallback(container);
    });
  } catch (e) {
    showFallback(container);
  }
}

function showFallback(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #1DBF73; font-size: 4rem;">
      🤖
    </div>
  `;
}

/* --------------------------------------------------------------------------
   2. UTM Parameter Parser & Storage
   -------------------------------------------------------------------------- */
function getUtmInfo() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || params.get('source') || '';
    const utmMedium = params.get('utm_medium') || '';
    const utmCampaign = params.get('utm_campaign') || '';

    if (utmSource) {
      sessionStorage.setItem('labto_utm_source', utmSource);
      if (utmMedium) sessionStorage.setItem('labto_utm_medium', utmMedium);
      if (utmCampaign) sessionStorage.setItem('labto_utm_campaign', utmCampaign);
      return { source: utmSource, medium: utmMedium, campaign: utmCampaign };
    }

    return {
      source: sessionStorage.getItem('labto_utm_source') || '',
      medium: sessionStorage.getItem('labto_utm_medium') || '',
      campaign: sessionStorage.getItem('labto_utm_campaign') || '',
    };
  } catch (e) {
    return { source: '', medium: '', campaign: '' };
  }
}

/* --------------------------------------------------------------------------
   3. Subscribe Form & API Handler with GA4 Event Tracking
   -------------------------------------------------------------------------- */
function initSubscribeForm() {
  const form = document.getElementById('subscribe-form');
  const emailInput = document.getElementById('email-input');
  const feedback = document.getElementById('form-feedback');
  const btn = form ? form.querySelector('.notify-btn') : null;

  if (!form || !emailInput) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      showFeedback('Please enter a valid email address.', 'error');
      return;
    }

    // Disable button during submit
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Submitting...';
    }
    showFeedback('', '');

    const utm = getUtmInfo();
    const sourcePayload = utm.source ? `landing-page-${utm.source}` : 'landing-page';

    // API Call to Labto AI Subscribe Endpoint
    fetch('https://api.labtoai.com/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        source: sourcePayload,
        utm_medium: utm.medium || undefined,
        utm_campaign: utm.campaign || undefined
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Subscription response:', data);
      
      if (btn) {
        btn.disabled = false;
        btn.textContent = data.alreadySubscribed ? 'Notify Me' : 'Subscribed ✓';
      }
      emailInput.value = '';
      
      // Fire Google Analytics 4 Custom Events
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', {
          event_category: 'Lead',
          event_label: sourcePayload,
          traffic_source: utm.source || 'direct',
          traffic_medium: utm.medium || 'direct',
          traffic_campaign: utm.campaign || 'direct',
          is_new_subscriber: !data.alreadySubscribed
        });
        window.gtag('event', 'waitlist_signup', {
          event_category: 'Waitlist',
          event_label: sourcePayload,
          traffic_source: utm.source || 'direct'
        });
      }

      if (data.alreadySubscribed) {
        showFeedback('You are already subscribed to Labto AI updates!', 'info');
        showToast('You are already subscribed with this email!');
      } else {
        showFeedback('', '');
        showToast('Thank you for subscribing!');
        localStorage.setItem('labto_subscribed_email', email);
      }
    })
    .catch(err => {
      console.error('Subscription error:', err);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Notify Me';
      }
      showFeedback('Unable to subscribe right now. Please try again.', 'error');
    });
  });

  function showFeedback(msg, type) {
    feedback.textContent = msg;
    feedback.className = `feedback-msg ${type}`;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

/* --------------------------------------------------------------------------
   3. React Hot Toast Style Helper
   -------------------------------------------------------------------------- */
function showToast(message) {
  const existing = document.querySelector('.custom-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.innerHTML = `
    <div class="toast-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </div>
    <span class="toast-text">${message}</span>
  `;

  document.body.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}
