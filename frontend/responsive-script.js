/* ============================================================================
   RESPONSIVE-SCRIPT.JS - Blood Donation Hub
   Interactive functionality for responsive website
   ============================================================================ */

'use strict';

/* ============================================================================
   1. HAMBURGER MENU TOGGLE
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    // Toggle hamburger menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when a link is clicked
    if (navMenu) {
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu && navMenu.contains(event.target);
        const isClickOnHamburger = hamburger && hamburger.contains(event.target);

        if (!isClickInsideNav && !isClickOnHamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

/* ============================================================================
   2. SMOOTH SCROLL BEHAVIOR (Fallback for older browsers)
   ============================================================================ */

function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        const offset = 80; // Navbar height
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

/* ============================================================================
   3. REQUEST FORM HANDLING
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const requestForm = document.getElementById('requestForm');

    if (requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const bloodType = document.getElementById('bloodType').value;
            const units = document.getElementById('units').value;
            const location = document.getElementById('location').value;
            const urgency = document.getElementById('urgency').value;

            // Validate form
            if (!bloodType || !units || !location || !urgency) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            // Prepare data
            const requestData = {
                bloodType: bloodType,
                units: units,
                location: location,
                urgency: urgency,
                timestamp: new Date().toISOString()
            };

            // Log request (in production, send to backend)
            console.log('Blood Request Submitted:', requestData);

            // Show success message
            showNotification(`Blood request for ${bloodType} submitted successfully!`, 'success');

            // Reset form
            requestForm.reset();

            // Optional: Send to backend
            // sendRequestToBackend(requestData);
        });
    }
});

/* ============================================================================
   4. CONTACT FORM HANDLING
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const name = contactForm.querySelector('input[placeholder="Your Name"]').value;
            const email = contactForm.querySelector('input[placeholder="Your Email"]').value;
            const subject = contactForm.querySelector('input[placeholder="Subject"]').value;
            const message = contactForm.querySelector('textarea').value;

            // Validate form
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            // Validate email format
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email', 'error');
                return;
            }

            // Prepare data
            const contactData = {
                name: name,
                email: email,
                subject: subject,
                message: message,
                timestamp: new Date().toISOString()
            };

            // Log contact (in production, send to backend)
            console.log('Contact Message Submitted:', contactData);

            // Show success message
            showNotification('Message sent successfully! We will get back to you soon.', 'success');

            // Reset form
            contactForm.reset();

            // Optional: Send to backend
            // sendContactToBackend(contactData);
        });
    }
});

/* ============================================================================
   5. NEWSLETTER FORM HANDLING
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');

    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value;

            if (!email || !isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }

            // Log subscription (in production, send to backend)
            console.log('Newsletter subscription:', email);

            showNotification('Successfully subscribed to our newsletter!', 'success');
            emailInput.value = '';

            // Optional: Send to backend
            // subscribeToNewsletter(email);
        });
    });
});

/* ============================================================================
   6. BUTTON CLICK HANDLERS
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Handle "Start Donating" button
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = createRipple(e);
            this.appendChild(ripple);

            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

/* ============================================================================
   7. INTERSECTION OBSERVER - LAZY LOAD & ANIMATIONS
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Observe elements for animation on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe feature cards, testimonials, etc.
    const animateElements = document.querySelectorAll(
        '.feature-card, .process-step, .testimonial-card, .stat-box'
    );

    animateElements.forEach(element => {
        observer.observe(element);
    });
});

/* ============================================================================
   8. NOTIFICATION SYSTEM
   ============================================================================ */

/**
 * Show notification message to user
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration to show notification in ms (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
        word-wrap: break-word;
    `;

    notification.textContent = message;

    // Add CSS animation if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Add notification to container
    notificationContainer.appendChild(notification);

    // Auto remove notification
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

/**
 * Get color for notification type
 * @param {string} type - Notification type
 * @returns {string} Color hex code
 */
function getNotificationColor(type) {
    const colors = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'info': '#3498db',
        'warning': '#f39c12'
    };
    return colors[type] || colors['info'];
}

/* ============================================================================
   9. UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Create ripple effect for button click
 * @param {Event} event - Click event
 * @returns {HTMLElement} Ripple element
 */
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    `;

    // Add ripple animation if not already added
    if (!document.getElementById('ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    return ripple;
}

/* ============================================================================
   10. RESPONSIVE IMAGE LOADING
   ============================================================================ */

/**
 * Lazy load images
 */
function lazyLoadImages() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('lazyloaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => imageObserver.observe(img));
    }
}

document.addEventListener('DOMContentLoaded', lazyLoadImages);

/* ============================================================================
   11. MOBILE VIEWPORT OPTIMIZATION
   ============================================================================ */

/**
 * Detect device and optimize layout
 */
function optimizeForDevice() {
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth > 480 && window.innerWidth <= 768;
    const isDesktop = window.innerWidth > 768;

    // Store device info
    window.deviceType = {
        isMobile,
        isTablet,
        isDesktop,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
    };

    // Log for debugging
    console.log('Device Type:', window.deviceType);
}

document.addEventListener('DOMContentLoaded', optimizeForDevice);
window.addEventListener('resize', optimizeForDevice);

/* ============================================================================
   12. SCROLL-TO-TOP BUTTON
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Create scroll-to-top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.id = 'scrollToTopBtn';
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        z-index: 999;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(scrollToTopBtn);

    // Show/hide button based on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.style.display = 'flex';
        } else {
            scrollToTopBtn.style.display = 'none';
        }
    });

    // Scroll to top on click
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Hover effects
    scrollToTopBtn.addEventListener('mouseover', function() {
        scrollToTopBtn.style.background = '#c0392b';
        scrollToTopBtn.style.transform = 'scale(1.1)';
    });

    scrollToTopBtn.addEventListener('mouseout', function() {
        scrollToTopBtn.style.background = '#e74c3c';
        scrollToTopBtn.style.transform = 'scale(1)';
    });
});

/* ============================================================================
   13. ACTIVE NAVIGATION INDICATOR
   ============================================================================ */

document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-link:not(.btn-login)');

    window.addEventListener('scroll', function() {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});

/* ============================================================================
   14. FORM VALIDATION HELPERS
   ============================================================================ */

/**
 * Validate form field
 * @param {HTMLElement} field - Form field element
 * @returns {boolean} True if valid
 */
function validateField(field) {
    const value = field.value.trim();

    if (!value) {
        field.classList.add('error');
        return false;
    } else {
        field.classList.remove('error');
        return true;
    }
}

/**
 * Add validation to all form fields
 */
document.addEventListener('DOMContentLoaded', function() {
    const formFields = document.querySelectorAll('input, select, textarea');

    formFields.forEach(field => {
        // Real-time validation
        field.addEventListener('blur', function() {
            validateField(this);
        });

        // Remove error class on input
        field.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });
});

/* ============================================================================
   15. PERFORMANCE MONITORING
   ============================================================================ */

/**
 * Log performance metrics
 */
function logPerformanceMetrics() {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

        console.log('Performance Metrics:');
        console.log(`Page Load Time: ${pageLoadTime}ms`);
        console.log(`DOM Content Loaded: ${perfData.domContentLoadedEventEnd - perfData.navigationStart}ms`);
        console.log(`Time to First Paint: ${perfData.responseStart - perfData.navigationStart}ms`);
    }
}

document.addEventListener('load', function() {
    setTimeout(logPerformanceMetrics, 0);
});

/* ============================================================================
   16. KEYBOARD NAVIGATION SUPPORT
   ============================================================================ */

document.addEventListener('keydown', function(e) {
    // Escape key closes menu
    if (e.key === 'Escape') {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        if (hamburger && navMenu) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }

    // Alt + D opens donation form (accessibility shortcut)
    if (e.altKey && e.key === 'd') {
        const donateSection = document.getElementById('donate');
        if (donateSection) {
            donateSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

/* ============================================================================
   17. SERVICE WORKER REGISTRATION (Optional for PWA)
   ============================================================================ */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

/* ============================================================================
   18. EXPORT FUNCTIONS FOR EXTERNAL USE
   ============================================================================ */

// Make utility functions globally accessible
window.BloodHub = {
    showNotification,
    isValidEmail,
    validateField,
    smoothScroll,
    optimizeForDevice
};

console.log('BloodHub Website Loaded Successfully! 🩸');
