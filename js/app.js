// Aurora Scents TEV Portal — Core SPA Router & State Manager
// Orchestrates navigation, section transitions, and module initialization

import { PassportShield } from './modules/passport.js';
import { BookViewer } from './modules/book-viewer.js';
import { PodcastPlayer } from './modules/podcast-player.js';
import { PortfolioGrid } from './modules/portfolio.js';
import { ChatBot } from './modules/chatbot.js';

class AuroraPortalApp {

    constructor() {
        this.currentSection = 'book-viewer';
        this.isAuthenticated = false;
        this.modules = {};

        // DOM references
        this.sidebar = document.getElementById('sidebar');
        this.viewport = document.getElementById('app-viewport');
        this.navItems = document.querySelectorAll('.nav-item');
        this.sections = document.querySelectorAll('.portal-section');

        this.init();
    }

    init() {
        // Check session persistence
        if (sessionStorage.getItem('aurora_authenticated') === 'true') {
            this.isAuthenticated = true;
            this.revealPortal(false); // No animation on refresh
        }

        // Initialize passport (always — it controls the gate)
        this.modules.passport = new PassportShield({
            onAuthenticated: () => this.handleAuthentication()
        });

        // Bind sidebar navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.dataset.section;
                if (sectionId && sectionId !== this.currentSection) {
                    this.navigateTo(sectionId);
                }
                // Auto-close sidebar on mobile after nav click
                if (window.innerWidth <= 768) {
                    this.closeMobileSidebar();
                }
            });
        });

        // Mobile sidebar toggle
        this.initMobileSidebar();
    }

    initMobileSidebar() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const closeBtn = document.getElementById('sidebar-close-btn');
        const backdrop = document.getElementById('sidebar-backdrop');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.openMobileSidebar());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMobileSidebar());
        }
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeMobileSidebar());
        }
    }

    openMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.add('mobile-open');
        backdrop.classList.add('active');
    }

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
    }

    showMobileMenuBtn() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (menuBtn) menuBtn.classList.add('shown');
        
        const navbar = document.getElementById('mobile-navbar');
        if (navbar) navbar.classList.add('shown');
    }

    handleAuthentication() {
        this.isAuthenticated = true;
        sessionStorage.setItem('aurora_authenticated', 'true');
        this.revealPortal(true);
    }

    revealPortal(animate = true) {
        const shield = document.getElementById('passport-shield');

        if (animate) {
            // Dissolve animation
            shield.classList.add('dissolving');
            setTimeout(() => {
                shield.style.display = 'none';
                this.sidebar.classList.add('visible');
                this.viewport.classList.add('with-sidebar');
                this.showMobileMenuBtn();
                this.initModules();
                this.initFloatingChatButton();
                this.showSection(this.currentSection);
            }, 1200);
        } else {
            // Instant reveal (session restore)
            shield.style.display = 'none';
            this.sidebar.classList.add('visible');
            this.viewport.classList.add('with-sidebar');
            this.showMobileMenuBtn();
            this.initModules();
            this.initFloatingChatButton();
            this.showSection(this.currentSection);
        }
    }

    initModules() {
        // Lazy-initialize modules on first access with robust error containment
        if (!this.modules.bookViewer) {
            try {
                this.modules.bookViewer = new BookViewer('book-viewer-mount');
            } catch (e) {
                console.error("Failed to initialize BookViewer module:", e);
            }
        }
        if (!this.modules.podcastPlayer) {
            try {
                this.modules.podcastPlayer = new PodcastPlayer('podcast-player-mount');
            } catch (e) {
                console.error("Failed to initialize PodcastPlayer module:", e);
            }
        }
        if (!this.modules.portfolio) {
            try {
                this.modules.portfolio = new PortfolioGrid('portfolio-mount');
            } catch (e) {
                console.error("Failed to initialize PortfolioGrid module:", e);
            }
        }
        if (!this.modules.chatbot) {
            try {
                this.modules.chatbot = new ChatBot('chatbot-mount');
            } catch (e) {
                console.error("Failed to initialize ChatBot module:", e);
            }
        }
    }

    navigateTo(sectionId) {
        if (sectionId === this.currentSection) return;

        // Fade out current section
        const currentEl = document.getElementById(`section-${this.currentSection}`);
        if (currentEl) {
            currentEl.classList.remove('visible');
            setTimeout(() => {
                currentEl.classList.remove('active');
                this.currentSection = sectionId;
                this.showSection(sectionId);
            }, 300);
        } else {
            this.currentSection = sectionId;
            this.showSection(sectionId);
        }
    }

    showSection(sectionId) {
        // Update nav active state
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Show target section
        const targetEl = document.getElementById(`section-${sectionId}`);
        if (targetEl) {
            targetEl.classList.add('active');
            // Force reflow then animate in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    targetEl.classList.add('visible');
                });
            });

            // Scroll viewport to top
            this.viewport.scrollTop = 0;
        }



        // Update floating chat button state
        const floatingBtn = document.getElementById('floating-chat-btn');
        const floatingIcon = document.getElementById('floating-chat-icon');
        if (floatingBtn) {
            if (sectionId === 'chatbot') {
                // Hide floating chat button completely when viewing chatbot section to prevent overlapping input elements
                floatingBtn.style.display = 'none';
            } else {
                floatingBtn.style.display = 'flex';
                floatingBtn.classList.remove('chat-active');
                floatingIcon.innerHTML = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>';
            }
        }
    }

    initFloatingChatButton() {
        const btn = document.getElementById('floating-chat-btn');
        if (!btn) return;

        btn.style.display = 'flex';
        this.previousSection = null;

        btn.addEventListener('click', () => {
            if (this.currentSection === 'chatbot') {
                // Close chat — go back to previous section or default
                this.navigateTo(this.previousSection || 'book-viewer');
            } else {
                // Open chat — remember where we were
                this.previousSection = this.currentSection;
                this.navigateTo('chatbot');
            }
        });
    }
}

// Boot the application
document.addEventListener('DOMContentLoaded', () => {
    window.auroraApp = new AuroraPortalApp();
});
