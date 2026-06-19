// translations
const translations = {
  en: {
    home: 'Home',
    facts: 'Facts',
    health: 'Health',
    sports: 'Sports',
    portfolio: 'Portfolio',
    products: 'Products',
    contact: 'Contact',
    language: 'বাংলা',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    facts_intro: 'Welcome to Bludot facts channel! Learn something new every day.',
    hero_sub: 'Your trusted source for Bangladeshi facts, news, and insights.',
    newsletter: 'Newsletter',
    subscribe: 'Subscribe',
    name_label: 'Name:',
    name_placeholder: 'Your name',
    email_label: 'Email:',
    email_placeholder: 'you@example.com',
    message_label: 'Message:',
    message_placeholder: 'Write your message here',
    send_button: 'Send',
  },
  bn: {
    home: 'হোম',
    facts: 'তথ্য',
    health: 'স্বাস্থ্য',
    sports: 'ক্রীড়া',
    portfolio: 'পোর্টফোলিও',
    products: 'পণ্য
',
    contact: 'যোগাযোগ',
    language: 'English',
    theme: 'থিম',
    light: 'আলো',
    dark: 'মরুকাল',
    facts_intro: 'Bludot তথ্য চ্যানেলে স্বাগতম! প্রতিদিন কিছু নতুন শিখুন।',
    hero_sub: 'বাংলাদেশি তথ্য, সংবাদ এবং পরামর্শের আপনার বিশ্বাসযোগ্য উৎস।',
    newsletter: 'নিউসলেটার',
    subscribe: 'সাবস্ক্রাইব',
    name_label: 'নাম:',
    name_placeholder: 'আপনার নাম',
    email_label: 'ইমেল:',
    email_placeholder: 'you@example.com',
    message_label: 'বার্তা:',
    message_placeholder: 'আপনার বার্তা লিখুন',
    send_button: 'পাঠান',
  }
};
let currentLang = 'bn';

function applyTranslations() {
  document.documentElement.lang = currentLang === 'bn' ? 'bn' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[currentLang] && translations[currentLang][key]) {
      el.textContent = translations[currentLang][key];
    }
  });
  // placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[currentLang] && translations[currentLang][key]) {
      el.setAttribute('placeholder', translations[currentLang][key]);
    }
  });
}

// language switch
function switchLanguage() {
  currentLang = currentLang === 'bn' ? 'en' : 'bn';
  applyTranslations();
}

// remember theme choice
function setTheme(dark) {
  if (dark) document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

function toggleTheme() {
  setTheme(!document.body.classList.contains('dark'));
}

// mobile navigation toggle
function initNavToggle() {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  // close when clicking a link
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
    });
  });
}

// smooth scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  initNavToggle();
  initSmoothScroll();
  initScrollTop();
  initHeaderScroll();
  // theme auto detect / restore
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') setTheme(true);
  else if (stored === 'light') setTheme(false);
  else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark);
  }
});

// scroll-to-top logic
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) btn.style.display = 'block';
    else btn.style.display = 'none';
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// header shadow on scroll
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
}

