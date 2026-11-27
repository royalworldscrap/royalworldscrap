/**
 * ROYAL WORLD SCRAPS – CLIENT JAVASCRIPT
 * Handles mobile navigation, dynamic "Show More" toggles, Indian mobile validation,
 * asynchronous enquiry submission.
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');

  if (menuToggle && mobileNav) {
    const navbar = menuToggle.closest('.main-navbar');
    const setMenuOpen = (isOpen) => {
      mobileNav.classList.toggle('open', isOpen);
      if (mobileNavBackdrop) mobileNavBackdrop.classList.toggle('open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    };
    const alignDrawerWithNavbar = () => {
      if (!navbar) return;
      const top = Math.max(0, Math.round(navbar.getBoundingClientRect().bottom));
      document.documentElement.style.setProperty('--mobile-nav-top', `${top}px`);
    };

    menuToggle.addEventListener('click', () => {
      alignDrawerWithNavbar();
      setMenuOpen(!mobileNav.classList.contains('open'));
    });

    mobileNavBackdrop?.addEventListener('click', () => setMenuOpen(false));

    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        setMenuOpen(false);
      });
    });

    window.addEventListener('resize', () => {
      if (mobileNav.classList.contains('open')) alignDrawerWithNavbar();
    });
    window.addEventListener('scroll', () => {
      if (mobileNav.classList.contains('open')) alignDrawerWithNavbar();
    }, { passive: true });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobileNav.classList.contains('open')) {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });
  }

  // 2. "Show More" Clients Toggle
  const showMoreClientsBtn = document.getElementById('showMoreClientsBtn');
  const extendedClientsGrid = document.getElementById('extendedClientsGrid');

  if (showMoreClientsBtn && extendedClientsGrid) {
    showMoreClientsBtn.addEventListener('click', () => {
      const isExpanded = extendedClientsGrid.classList.toggle('open');
      
      if (isExpanded) {
        showMoreClientsBtn.innerHTML = `
          <span>Show Fewer Client Segments</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
        `;
      } else {
        showMoreClientsBtn.innerHTML = `
          <span>Show All 8 Client Segments (4 More)</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
        `;
        const whoWeServeSection = document.getElementById('who-we-serve');
        if (whoWeServeSection) {
          whoWeServeSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // 5. Form Validation & Submission
  const enquiryForm = document.getElementById('enquiryForm');
  const formSuccessCard = document.getElementById('formSuccessCard');
  const submitBtn = document.getElementById('submitBtn');
  const resetFormBtn = document.getElementById('resetFormBtn');
  const serverErrorAlert = document.getElementById('serverErrorAlert');
  const assignedEnquiryIdElem = document.getElementById('assignedEnquiryId');

  const fullNameInput = document.getElementById('fullName');
  const mobileInput = document.getElementById('mobileNumber');
  const messageInput = document.getElementById('additionalMessage');
  const consentInput = document.getElementById('consent');

  const fullNameError = document.getElementById('fullNameError');
  const mobileError = document.getElementById('mobileError');
  const consentError = document.getElementById('consentError');

  // Helper: Indian Mobile Validation (10 digits starting with 6, 7, 8, 9)
  function validateIndianMobile(value) {
    const clean = value.replace(/[\s\-\(\)\+]/g, '');
    let normalized = clean;
    if (normalized.startsWith('91') && normalized.length === 12) {
      normalized = normalized.substring(2);
    } else if (normalized.startsWith('0') && normalized.length === 11) {
      normalized = normalized.substring(1);
    }
    const regex = /^[6-9]\d{9}$/;
    return {
      isValid: regex.test(normalized),
      normalized: normalized
    };
  }

  // Live input sanitization for mobile (numbers only)
  if (mobileInput) {
    mobileInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
      if (mobileError.classList.contains('visible')) {
        const check = validateIndianMobile(e.target.value);
        if (check.isValid) {
          mobileError.classList.remove('visible');
        }
      }
    });
  }

  // Form submit handler
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      let hasError = false;
      serverErrorAlert.style.display = 'none';

      // 1. Validate Full Name
      const fullNameVal = fullNameInput.value.trim();
      if (!fullNameVal || fullNameVal.length < 2) {
        fullNameError.textContent = 'Please enter your full name (at least 2 characters).';
        fullNameError.classList.add('visible');
        hasError = true;
      } else {
        fullNameError.classList.remove('visible');
      }

      // 2. Validate Mobile
      const mobileVal = mobileInput.value.trim();
      const mobileCheck = validateIndianMobile(mobileVal);
      if (!mobileVal) {
        mobileError.textContent = 'Mobile number is required.';
        mobileError.classList.add('visible');
        hasError = true;
      } else if (!mobileCheck.isValid) {
        mobileError.textContent = 'Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).';
        mobileError.classList.add('visible');
        hasError = true;
      } else {
        mobileError.classList.remove('visible');
      }

      // 3. Validate Consent Checkbox
      if (!consentInput.checked) {
        consentError.textContent = 'You must agree to be contacted by Royal World Scraps.';
        consentError.classList.add('visible');
        hasError = true;
      } else {
        consentError.classList.remove('visible');
      }

      if (hasError) return;

      // Send the enquiry to the deployed Apps Script web app.
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Enquiry...';

      const payload = {
        fullName: fullNameVal,
        mobileNumber: mobileCheck.normalized,
        additionalMessage: messageInput.value.trim(),
        consent: true
      };

      try {
        await fetch('https://script.google.com/macros/s/AKfycbzxAS4lCKlfx4_JlzIbY3oIYXvpZ_W_TL-SOEdW9cck7GnHE3gYKBGsoMKcNDIwPRXb/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload)
        });

        enquiryForm.style.display = 'none';
        formSuccessCard.classList.add('active');
        if (assignedEnquiryIdElem) {
          assignedEnquiryIdElem.style.display = 'none';
        }
      } catch (err) {
        console.error('Submission failed:', err);
        serverErrorAlert.textContent = 'Could not connect to the server. Please call us directly or check internet.';
        serverErrorAlert.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request a Callback';
      }
    });
  }

  // Reset form to submit another enquiry
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', () => {
      enquiryForm.reset();
      enquiryForm.style.display = 'block';
      formSuccessCard.classList.remove('active');
      serverErrorAlert.style.display = 'none';
    });
  }

});
