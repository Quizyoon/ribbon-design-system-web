// LINE GIFTSHOP Design System - Main Script

document.addEventListener('DOMContentLoaded', function() {
  initSidebarNavigation();
  initTheme();
  initLanguage();
  initSmoothScroll();
});

// ==================== Sidebar Navigation ====================
function initSidebarNavigation() {
  const hasChildrenItems = document.querySelectorAll('.has-children > a');
  const currentPath = window.location.pathname;

  // 현재 페이지와 일치하는 링크 찾기
  let matchedLinks = [];
  document.querySelectorAll('.sidebar-nav a').forEach(function(link) {
    const href = link.getAttribute('href');
    if (href && href !== '#') {
      const linkUrl = new URL(href, window.location.href);
      const linkPath = linkUrl.pathname;

      if (linkPath === currentPath) {
        matchedLinks.push(link);
      }
    }
  });

  // 가장 깊은 링크(마지막 링크)만 active 처리
  if (matchedLinks.length > 0) {
    const activeLink = matchedLinks[matchedLinks.length - 1];
    activeLink.classList.add('active');

    // 부모 메뉴 열기
    let parent = activeLink.closest('.has-children');
    while (parent) {
      parent.classList.add('expanded');
      parent = parent.parentElement.closest('.has-children');
    }
  }

  // 메뉴 클릭 이벤트
  hasChildrenItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const parent = this.parentElement;
      parent.classList.toggle('expanded');
    });
  });
}

// ==================== Theme (Dark Mode) ====================
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  const darkModeBtn = document.querySelector('[aria-label="Dark mode"]');
  if (darkModeBtn) {
    darkModeBtn.addEventListener('click', toggleDarkMode);
  }
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// ==================== Language ====================
function initLanguage() {
  const savedLang = localStorage.getItem('selectedLang') || 'EN';
  const currentLang = document.getElementById('currentLang');

  if (currentLang) {
    currentLang.textContent = savedLang;
  }

  // Update active state in language menu
  const langMenu = document.getElementById('langMenu');
  if (langMenu) {
    const langLinks = langMenu.querySelectorAll('a');
    langLinks.forEach(link => {
      link.classList.remove('active');
      if (link.textContent === getLangName(savedLang)) {
        link.classList.add('active');
      }
    });
  }

  // Apply translations
  applyTranslations(savedLang);

  // Close language menu when clicking outside
  document.addEventListener('click', function(e) {
    const langDropdown = document.querySelector('.lang-dropdown');
    const langMenu = document.getElementById('langMenu');

    if (langDropdown && langMenu && !langDropdown.contains(e.target)) {
      langMenu.classList.remove('open');
    }
  });
}

function toggleLangMenu() {
  const langMenu = document.getElementById('langMenu');
  if (langMenu) {
    langMenu.classList.toggle('open');
  }
}

function setLang(code, name) {
  const currentLang = document.getElementById('currentLang');
  const langMenu = document.getElementById('langMenu');

  if (currentLang) {
    currentLang.textContent = code;
  }

  if (langMenu) {
    const langLinks = langMenu.querySelectorAll('a');
    langLinks.forEach(link => link.classList.remove('active'));
    langMenu.classList.remove('open');
  }

  // Find and activate the clicked link
  event.target.classList.add('active');

  localStorage.setItem('selectedLang', code);
  applyTranslations(code);

  return false;
}

function applyTranslations(langCode) {
  const langMap = {
    'EN': 'en',
    'KO': 'ko',
    'ZH': 'zh',
    'TH': 'th'
  };

  const lang = langMap[langCode] || 'en';
  const elements = document.querySelectorAll('[data-en]');

  elements.forEach(el => {
    const translation = el.getAttribute(`data-${lang}`);
    if (translation) {
      el.innerHTML = translation;
    } else {
      const fallback = el.getAttribute('data-en');
      if (fallback) {
        el.innerHTML = fallback;
      }
    }
  });

  // Handle placeholder translations
  const placeholderElements = document.querySelectorAll('[data-placeholder-en]');
  placeholderElements.forEach(el => {
    const translation = el.getAttribute(`data-placeholder-${lang}`);
    if (translation) {
      el.placeholder = translation;
    } else {
      const fallback = el.getAttribute('data-placeholder-en');
      if (fallback) {
        el.placeholder = fallback;
      }
    }
  });
}

function getLangName(code) {
  const names = {
    'EN': 'English',
    'KO': '한국어',
    'ZH': '中文',
    'TH': 'ไทย'
  };
  return names[code] || 'English';
}

// ==================== Smooth Scroll ====================
function initSmoothScroll() {
  const categoryLinks = document.querySelectorAll('.category-link[href^="#"]');

  categoryLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ==================== Props Table Accordion ====================
function togglePropDetails(row) {
  const detailsRow = row.nextElementSibling;
  const isExpanded = row.classList.contains('expanded');

  // Close all other expanded rows in the same table
  const table = row.closest('.props-table');
  if (table) {
    table.querySelectorAll('.prop-row.expanded').forEach(function(expandedRow) {
      if (expandedRow !== row) {
        expandedRow.classList.remove('expanded');
        expandedRow.nextElementSibling.classList.remove('show');
      }
    });
  }

  // Toggle current row
  if (isExpanded) {
    row.classList.remove('expanded');
    detailsRow.classList.remove('show');
  } else {
    row.classList.add('expanded');
    detailsRow.classList.add('show');
  }
}

// ==================== Section Accordion ====================
function toggleAccordion(button) {
  const section = button.closest('.semantic-section');
  const content = section.nextElementSibling;

  // Find the accordion-content element (might be next sibling or further)
  let accordionContent = content;
  while (accordionContent && !accordionContent.classList.contains('accordion-content')) {
    accordionContent = accordionContent.nextElementSibling;
  }

  if (!accordionContent) return;

  const isExpanded = button.getAttribute('aria-expanded') === 'true';

  if (isExpanded) {
    button.setAttribute('aria-expanded', 'false');
    accordionContent.style.display = 'none';
  } else {
    button.setAttribute('aria-expanded', 'true');
    accordionContent.style.display = 'block';
  }
}

// ==================== Props Filter ====================
let currentPropsFilter = 'all';

function filterProps() {
  const searchInput = document.getElementById('propsSearch');
  const filter = searchInput ? searchInput.value.toLowerCase() : '';
  const propRows = document.querySelectorAll('.props-table .prop-row');

  propRows.forEach(function(row) {
    const propName = row.querySelector('td:first-child code');
    const propType = row.getAttribute('data-type');
    const detailsRow = row.nextElementSibling;
    const text = propName ? propName.textContent.toLowerCase() : '';

    const matchesSearch = text.includes(filter);
    const matchesFilter = currentPropsFilter === 'all' || propType === currentPropsFilter;

    if (matchesSearch && matchesFilter) {
      row.style.display = '';
      if (detailsRow && detailsRow.classList.contains('prop-details')) {
        detailsRow.style.display = row.classList.contains('expanded') ? 'table-row' : 'none';
      }
    } else {
      row.style.display = 'none';
      if (detailsRow && detailsRow.classList.contains('prop-details')) {
        detailsRow.style.display = 'none';
      }
    }
  });
}

function setPropsFilter(filter) {
  currentPropsFilter = filter;

  // Update active state
  document.querySelectorAll('.filter-chip').forEach(function(chip) {
    chip.classList.remove('active');
    if (chip.getAttribute('data-filter') === filter) {
      chip.classList.add('active');
    }
  });

  filterProps();
}
