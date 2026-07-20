const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Web System
    if (!prefersReducedMotion) initCanvasAnimation();
    initApiKeyBinding();
    initTabs();
    initModelPicker();
    initDiagnostics();
    initClipboard();
    initScrollSpy();
    initMobileNav();
    initScrollReveal();
});

/* =========================================================================
   1. CANVAS NETWORK NODES ANIMATION
   ========================================================================= */
function initCanvasAnimation() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const maxParticles = Math.min(60, Math.floor((width * height) / 18000));
    const connectionDistance = 140;
    let mouse = { x: null, y: null, radius: 150 };

    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
            this.alpha = Math.random() * 0.5 + 0.2;
            this.pulseDir = Math.random() > 0.5 ? 0.005 : -0.005;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            // Pulse opacity
            this.alpha += this.pulseDir;
            if (this.alpha > 0.7 || this.alpha < 0.2) {
                this.pulseDir *= -1;
            }

            // Mouse repulsion
            if (mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * force * 1.5;
                    this.y += Math.sin(angle) * force * 1.5;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(124, 58, 237, ${this.alpha})`;
            ctx.shadowBlur = this.radius * 2;
            ctx.shadowColor = '#7c3aed';
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow for performance
        }
    }

    // Spawn particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            p1.update();
            p1.draw();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.hypot(dx, dy);

                if (dist < connectionDistance) {
                    const alpha = (1 - (dist / connectionDistance)) * 0.15;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

/* =========================================================================
   2. API KEY BINDING & MOCK KEY GENERATOR
   ========================================================================= */
function initApiKeyBinding() {
    const keyInput = document.getElementById('api-key-input');
    const keyDisplay = document.getElementById('key-display');
    const clearBtn = document.getElementById('api-key-clear');
    const generatorBtn = document.getElementById('interactive-key-generator');
    const templateKeys = document.querySelectorAll('.template-key');

    const defaultPlaceholder = 'sk-your-agentrouter-key';

    function updateApiKey(value) {
        const key = value.trim() || defaultPlaceholder;
        
        // Update helper outputs
        keyDisplay.textContent = key;
        
        // Update all terminal inline template variables
        templateKeys.forEach(el => {
            el.textContent = key;
        });

        // Toggle clear button
        if (value.length > 0) {
            clearBtn.style.display = 'block';
            keyDisplay.classList.add('text-glow');
        } else {
            clearBtn.style.display = 'none';
            keyDisplay.classList.remove('text-glow');
        }
    }

    keyInput.addEventListener('input', (e) => {
        updateApiKey(e.target.value);
    });

    clearBtn.addEventListener('click', () => {
        keyInput.value = '';
        updateApiKey('');
        keyInput.focus();
    });

    // Mock API Key Generator
    generatorBtn.addEventListener('click', () => {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomHash = '';
        for (let i = 0; i < 32; i++) {
            randomHash += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const generatedKey = `sk-ar-${randomHash.substring(0, 16)}`;
        
        keyInput.value = generatedKey;
        updateApiKey(generatedKey);
        
        // Show success highlight on the generator button and input
        generatorBtn.textContent = 'Generated!';
        generatorBtn.classList.remove('btn-primary');
        generatorBtn.style.background = 'var(--color-success)';
        
        keyInput.style.borderColor = 'var(--color-success)';
        
        setTimeout(() => {
            generatorBtn.textContent = 'Generate Sample Key';
            generatorBtn.style.background = '';
            generatorBtn.classList.add('btn-primary');
            keyInput.style.borderColor = '';
        }, 1500);
    });
}

/* =========================================================================
   3. OS & METHODS TAB SWITCHER
   ========================================================================= */
function initTabs() {
    // OS Environment Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            
            const targetEl = document.getElementById(`tab-${targetTab}`);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // Model Selector Configuration Methods
    const methodTabs = document.querySelectorAll('.method-tab');
    const methodContents = document.querySelectorAll('.method-content');

    methodTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetMethod = tab.getAttribute('data-method');

            methodTabs.forEach(t => t.classList.remove('active'));
            methodContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            
            const targetEl = document.getElementById(`method-${targetMethod}`);
            if (targetEl) targetEl.classList.add('active');
        });
    });
}

/* =========================================================================
   4. MODEL PICKER SYSTEM
   ========================================================================= */
function initModelPicker() {
    const modelCards = document.querySelectorAll('.model-card');
    const selectedModelTexts = document.querySelectorAll('.selected-model-text');
    const summaryTier = document.getElementById('summary-tier');

    // Sync the live summary badge with the chosen card's tier tag
    function updateSummary(card) {
        if (!summaryTier) return;
        const tag = card.querySelector('.card-tier-tag');
        if (tag) summaryTier.textContent = tag.textContent.trim();
        // Recolor the summary to match the card's tier theme
        const tier = Array.from(card.classList).find(c => c.startsWith('tier-'));
        summaryTier.dataset.tier = tier || '';
    }

    modelCards.forEach(card => {
        // Make each card a proper keyboard-operable control
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-pressed', card.classList.contains('active') ? 'true' : 'false');

        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });

        card.addEventListener('click', () => {
            // Remove active classes
            modelCards.forEach(c => {
                c.classList.remove('active');
                c.setAttribute('aria-pressed', 'false');
            });

            // Activate current card
            card.classList.add('active');
            card.setAttribute('aria-pressed', 'true');
            updateSummary(card);

            const modelName = card.getAttribute('data-model');
            
            // Update all code blocks displaying the selected model name
            selectedModelTexts.forEach(textEl => {
                textEl.textContent = modelName;
                
                // Trigger a temporary glow animation
                textEl.style.color = 'var(--color-accent)';
                textEl.style.textShadow = '0 0 10px rgba(6, 182, 212, 0.6)';
                setTimeout(() => {
                    textEl.style.color = '';
                    textEl.style.textShadow = '';
                }, 4000);
            });
        });
    });

    // Initialize summary from whichever card starts active
    const initialCard = document.querySelector('.model-card.active') || modelCards[0];
    if (initialCard) updateSummary(initialCard);
}

/* =========================================================================
   5. DIAGNOSTICS & TROUBLESHOOTING
   ========================================================================= */
function initDiagnostics() {
    const diagBtns = document.querySelectorAll('.diag-btn');
    const solutionContents = document.querySelectorAll('.solution-content');
    const statusIndicator = document.getElementById('diag-status-indicator');

    diagBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const issueType = btn.getAttribute('data-issue');

            diagBtns.forEach(b => b.classList.remove('active'));
            solutionContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            
            const targetEl = document.getElementById(`sol-${issueType}`);
            if (targetEl) targetEl.classList.add('active');

            // Update header status text/class
            if (issueType === 'unauthorized') {
                statusIndicator.textContent = 'Auth Check';
                statusIndicator.style.color = 'var(--color-danger)';
                statusIndicator.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
            } else if (issueType === 'cached-auth') {
                statusIndicator.textContent = 'Session Conflict';
                statusIndicator.style.color = 'var(--color-warning)';
                statusIndicator.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                statusIndicator.style.background = 'rgba(245, 158, 11, 0.1)';
            }
        });
    });
}

/* =========================================================================
   6. CLIPBOARD COPY UTILITIES & TOASTS
   ========================================================================= */
function initClipboard() {
    const copyButtons = document.querySelectorAll('.copy-btn, .summary-copy');
    const toast = document.getElementById('copy-toast');
    let toastTimeout;

    function showToast() {
        clearTimeout(toastTimeout);
        toast.classList.add('show');
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            let textToCopy = '';

            const rawCopy = btn.getAttribute('data-copy');
            const templateCopy = btn.getAttribute('data-copy-template');

            if (rawCopy) {
                textToCopy = rawCopy;
            } else if (templateCopy) {
                // Read current API key
                const keyInput = document.getElementById('api-key-input');
                const currentKey = keyInput.value.trim() || 'sk-your-agentrouter-key';
                
                // Read current selected Model
                const activeModelCard = document.querySelector('.model-card.active');
                const currentModel = activeModelCard ? activeModelCard.getAttribute('data-model') : 'claude-opus-4-8';

                // Replace templates
                textToCopy = templateCopy.replace(/{key}/g, currentKey).replace(/{model}/g, currentModel);
            }

            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast();
                    
                    // Button Micro-animation feedback
                    const originalSvg = btn.innerHTML;
                    btn.innerHTML = `<svg class="copy-icon success" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"></path></svg>`;
                    btn.style.borderColor = 'var(--color-success)';
                    btn.style.color = 'var(--color-success)';
                    
                    setTimeout(() => {
                        btn.innerHTML = originalSvg;
                        btn.style.borderColor = '';
                        btn.style.color = '';
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    });
}

/* =========================================================================
   7. INTERSECTION OBSERVER FOR ACTIVE TIMELINE (SCROLLSPY)
   ========================================================================= */
function initScrollSpy() {
    const sections = document.querySelectorAll('.guide-section');
    const steps = document.querySelectorAll('.progress-step');

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Trigger when section is in the middle of screen
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                steps.forEach(step => {
                    const href = step.getAttribute('href');
                    if (href === `#${id}` || (id === 'run' && href === '#run')) {
                        step.classList.add('active');
                    } else {
                        // Special checks since step links map to section IDs
                        if (id === 'run' && href === '#run') {
                            step.classList.add('active');
                        } else {
                            step.classList.remove('active');
                        }
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Fallback: Bind manually on click to guarantee immediate activation
    steps.forEach(step => {
        step.addEventListener('click', (e) => {
            steps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');
        });
    });
}

/* =========================================================================
   8. MOBILE NAVIGATION DRAWER
   ========================================================================= */
function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const drawer = document.getElementById('mobile-nav');
    if (!toggle || !drawer) return;

    function setOpen(open) {
        drawer.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', () => {
        setOpen(!drawer.classList.contains('open'));
    });

    // Close after selecting a destination
    drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    // Close on Escape for keyboard users
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });
}

/* =========================================================================
   9. SCROLL REVEAL CHOREOGRAPHY
   ========================================================================= */
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.guide-section, .key-injector-card, .routing-diagram'
    );

    // Respect reduced motion — show everything immediately
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        targets.forEach(el => el.classList.add('is-visible'));
        return;
    }

    targets.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    targets.forEach(el => observer.observe(el));
}
