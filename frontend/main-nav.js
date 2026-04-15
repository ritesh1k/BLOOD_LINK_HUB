(function () {
  const root = document.getElementById('main-nav-root');
  if (!root) {
    return;
  }

  // Ensure nav icons render on every page using the shared nav.
  const hasFontAwesome = document.querySelector('link[href*="font-awesome"], link[href*="fontawesome"]');
  if (!hasFontAwesome) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
  }

  const navItems = [
    { href: 'index.html', label: 'Home', icon: 'fas fa-home' },
    { href: 'about.html', label: 'About', icon: 'fas fa-info-circle' },
    { href: 'donation-centers.html', label: 'Donation Centers', icon: 'fas fa-hospital' },
    { href: 'admin-login.html', label: 'Admin', icon: 'fas fa-user-shield' },
    { href: 'faqs.html', label: 'FAQs', icon: 'fas fa-question-circle' },
    { href: 'contact.html', label: 'Contact', icon: 'fas fa-envelope' }
  ];

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const linksHtml = navItems
    .map(function (item) {
      const activeClass = item.href === currentPage ? 'active' : '';
      return '<li><a class="' + activeClass + '" href="' + item.href + '"><i class="' + item.icon + '"></i> ' + item.label + '</a></li>';
    })
    .join('');

  root.innerHTML =
    '<header class="main-nav">' +
    '  <div class="main-nav-container">' +
    '    <a class="main-nav-brand" href="index.html"><img src="logo.avif" alt="BloodLink Hub Logo"><span>BloodLink Hub</span></a>' +
    '    <button class="main-nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false"><span class="hamburger-icon"></span></button>' +
    '    <ul class="main-nav-links">' + linksHtml + '</ul>' +
    '  </div>' +
    '</header>';

  const toggleButton = root.querySelector('.main-nav-toggle');
  const links = root.querySelector('.main-nav-links');
  if (toggleButton && links) {
    toggleButton.addEventListener('click', function () {
      const isOpen = links.classList.toggle('is-open');
      toggleButton.setAttribute('aria-expanded', String(isOpen));
    });
  }
})();
