/* ==========================================================================
   LABTO COOKING - SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initLottieAnimation();
  initSubscribeForm();
});

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
   2. Subscribe Form & API Handler
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

    // API Call to Labto AI Subscribe Endpoint
    fetch('https://api.labtoai.com/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        source: 'landing-page'
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
  const existingToast = document.querySelector('.toast-container');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-container';
  toast.innerHTML = `
    <div class="toast-content">
      <div class="toast-icon">
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="toast-text">${message}</span>
    </div>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
