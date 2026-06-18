document.addEventListener('DOMContentLoaded', () => {
    const shouldUppercase = (element) => {
        if (element.classList.contains('no-uppercase') || element.hasAttribute('data-no-uppercase')) return false;

        const name = (element.getAttribute('name') || element.id || '').toLowerCase();
        const type = (element.getAttribute('type') || '').toLowerCase();

        if (['email', 'tel', 'number', 'date', 'time', 'hidden', 'checkbox', 'radio'].includes(type)) return false;
        if (name.includes('correo') || name.includes('telefono') || name.includes('lat') || name.includes('lng')) return false;
        return element.matches('input[type="text"], input:not([type]), textarea, .text-uppercase-input');
    };

    document.querySelectorAll('input, textarea').forEach((element) => {
        if (!shouldUppercase(element)) return;

        element.classList.add('text-uppercase-input');
        element.addEventListener('input', () => {
            const start = element.selectionStart;
            const end = element.selectionEnd;
            element.value = element.value.toLocaleUpperCase('es-MX');
            if (start !== null && end !== null) element.setSelectionRange(start, end);
        });
    });
});

// Funciones de Limpieza y Validaciones
function stripEmojis(val) {
    if (!val) return '';
    return val.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}

function sanitizeLettersOnly(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    return clean.replace(/\s+/g, ' ');
}

function sanitizeDigitsOnly(val) {
    if (!val) return '';
    return val.replace(/\D/g, '');
}

function sanitizeDecimalOnly(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
        clean = parts[0] + '.' + parts.slice(1).join('');
    }
    return clean;
}

function sanitizeAlphanumericDash(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[^a-zA-Z0-9\s\-/]/g, '');
    return clean.replace(/\s+/g, ' ');
}

function sanitizeGeneralText(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[<>[\]{}$%^*+=|\\~`]/g, '');
    return clean;
}

function validateEmailDomain(email) {
    const val = email.trim().toLowerCase();
    if (!val) return true;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(val)) return false;
    
    const allowedEmailDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    const domain = val.split('@')[1];
    return allowedEmailDomains.includes(domain);
}

function initStepperFloat(stepperSelector = '.stepper') {
    const stepper = document.querySelector(stepperSelector);
    if (!stepper) return;

    const navbar = document.querySelector('.cavex-navbar');
    const NAVBAR_H = navbar ? navbar.offsetHeight : 92;
    document.documentElement.style.setProperty('--navbar-h', NAVBAR_H + 'px');
    let stepperNaturalTop = 0;
    let stepperH = 0;
    let floating = false;

    // Check if placeholder already exists
    let placeholder = stepper.parentNode.querySelector('.stepper-placeholder');
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'stepper-placeholder';
        stepper.parentNode.insertBefore(placeholder, stepper.nextSibling);
    }

    function recalculate() {
        if (!floating) {
            stepperNaturalTop = stepper.getBoundingClientRect().top + window.scrollY;
            stepperH = stepper.offsetHeight;
        }
    }

    function onScroll() {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const shouldFloat = scrollY + NAVBAR_H > stepperNaturalTop;

        if (shouldFloat && !floating) {
            floating = true;
            placeholder.style.height = stepperH + 'px';
            placeholder.classList.add('visible');
            stepper.classList.add('is-floating');
        } else if (!shouldFloat && floating) {
            floating = false;
            placeholder.classList.remove('visible');
            stepper.classList.remove('is-floating');
        }
    }

    requestAnimationFrame(() => {
        recalculate();
        onScroll();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { floating = false; stepper.classList.remove('is-floating'); recalculate(); }, { passive: true });
}

