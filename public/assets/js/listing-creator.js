/**
 * Multi-Step Listing Creation with Asynchronous Gallery Upload
 *
 * ARCHITECTURE:
 * STEP 1: Submit listing data + featured image
 * STEP 2: Upload gallery images one-by-one asynchronously
 *
 * Features:
 * - Progress tracking
 * - Error handling
 * - Duplicate submission prevention
 * - Proper UI state management
 * - Retry mechanism for failed uploads
 */

class ListingCreator {
    constructor(formSelector, options = {}) {
        this.form = document.querySelector(formSelector);
        if (!this.form) {
            throw new Error(`Form with selector "${formSelector}" not found`);
        }

        // Configuration
        this.config = {
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            parallelUploads: false, // Upload one-by-one for better progress tracking
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'],
            maxFileSize: 20 * 1024 * 1024, // 20MB hard max
            serverMaxFileSize: 1 * 1024 * 1024, // 1MB default server limit threshold
            // Compression defaults (overridable via constructor options)
            compressDefaults: {
                maxWidth: 1920,
                maxHeight: 1080,
                startQuality: 0.8,
                minQuality: 0.4,
                aggressive: {
                    maxWidth: 1400,
                    maxHeight: 900,
                    quality: 0.45,
                    forceWebP: true
                }
            },
            ...options
        };

        // State management
        this.state = {
            isSubmitting: false,
            isComplete: false,    // Track if the entire process is complete
            listingCreated: false,
            listingId: null,
            uploadUrl: null,
            redirectUrl: null,    // Store redirect URL for completion
            freshCSRFToken: null, // Fresh CSRF token from listing creation response
            galleryImages: [],
            uploadQueue: [],
            uploadProgress: {
                total: 0,
                completed: 0,
                failed: 0
            }
        };

        // DOM elements
        this.elements = {
            submitBtn: this.form.querySelector('[type="submit"]'),
            galleryInput: this.form.querySelector('input[name="gallery_images[]"]'),
            statusContainer: null,
            progressContainer: null,
            errorContainer: null
        };

        this.init();
    }

    /**
     * Initialize the listing creator
     */
    init() {
        this.createStatusElements();
        this.attachEventListeners();
        this.validateForm();
    }

    /**
     * Create status and progress elements
     */
    createStatusElements() {
        // Create full screen overlay with animated background
        this.elements.statusContainer = document.createElement('div');
        this.elements.statusContainer.className = 'realestate-progress-overlay';
        this.elements.statusContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%);
            backdrop-filter: blur(15px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.4s ease-in-out;
        `;

        // Create main progress container
        this.elements.progressContainer = document.createElement('div');
        this.elements.progressContainer.className = 'realestate-progress-container';
        this.elements.progressContainer.innerHTML = `
            <!-- Animated Background Elements -->
            <div class="progress-bg-animation">
                <div class="floating-icon" style="top: 20%; left: 15%;">🏠</div>
                <div class="floating-icon" style="top: 70%; left: 85%; animation-delay: 1s;">🗝️</div>
                <div class="floating-icon" style="top: 30%; right: 20%; animation-delay: 2s;">📍</div>
                <div class="pulse-circle" style="top: 10%; right: 10%;"></div>
                <div class="pulse-circle" style="bottom: 15%; left: 10%; animation-delay: 1.5s;"></div>
            </div>

            <!-- Main Progress Card -->
            <div class="progress-card">
                <!-- Header -->
                <div class="progress-header">
                    <div class="platform-logo">
                        <div class="logo-icon">🏡</div>
                     </div>
                </div>

                <!-- Circular Progress with Real Estate Theme -->
                <div class="circular-progress-wrapper">
                    <svg class="progress-circle" width="200" height="200" viewBox="0 0 200 200">
                        <defs>
                            <linearGradient id="realEstateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <!-- Outer ring background -->
                        <circle class="progress-bg-outer" cx="100" cy="100" r="85"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.1)"
                                stroke-width="2"/>
                        <!-- Progress ring -->
                        <circle class="progress-bar-circle" cx="100" cy="100" r="75"
                                fill="none"
                                stroke="url(#realEstateGradient)"
                                stroke-width="6"
                                stroke-linecap="round"
                                stroke-dasharray="471.2"
                                stroke-dashoffset="471.2"
                                transform="rotate(-90 100 100)"
                                filter="url(#glow)"
                                style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);"/>
                        <!-- Inner decorative circle -->
                        <circle cx="100" cy="100" r="60"
                                fill="none"
                                stroke="rgba(251, 191, 36, 0.2)"
                                stroke-width="1"
                                stroke-dasharray="4,4"
                                class="inner-circle"/>
                    </svg>

                    <!-- Center Content -->
                    <div class="progress-center">
                        <div class="percentage-display">
                            <span class="percentage-number">0</span>
                            <span class="percentage-symbol">%</span>
                        </div>
                        <div class="progress-label">Complete</div>
                    </div>
                </div>

                <!-- Progress Steps -->
                <div class="progress-steps">
                    <div class="step step-active" data-step="1">
                        <div class="step-icon">📝</div>
                        <span class="step-text">Listing Details</span>
                    </div>
                    <div class="step" data-step="2">
                        <div class="step-icon">📷</div>
                        <span class="step-text">Images Upload</span>
                    </div>
                    <div class="step" data-step="3">
                        <div class="step-icon">✅</div>
                        <span class="step-text">Publishing</span>
                    </div>
                </div>

                <!-- Status Text -->
                <div class="status-text-container">
                    <p class="status-text">Preparing your property listing...</p>
                    <div class="status-details">
                        <span class="current-action">Initializing upload process</span>
                    </div>
                </div>
            </div>

            <!-- Success Animation -->
            <div class="success-container" style="display: none;">
                <div class="success-animation">
                    <div class="success-icon">🎉</div>
                    <h2>Listing Published Successfully!</h2>
                    <p>Your property is now live on our platform</p>
                    <div class="success-checkmark">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle class="checkmark-circle" cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="#10b981"
                                    stroke-width="4"
                                    stroke-dasharray="282.7"
                                    stroke-dashoffset="282.7"/>
                            <path class="checkmark-check"
                                  fill="none"
                                  stroke="#10b981"
                                  stroke-width="6"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-dasharray="25"
                                  stroke-dashoffset="25"
                                  d="M20 50L40 70L80 30"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;

        // Create error container
        this.elements.errorContainer = document.createElement('div');
        this.elements.errorContainer.className = 'realestate-error-notification';
        this.elements.errorContainer.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            backdrop-filter: blur(10px);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: 15px;
            font-weight: 500;
            box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 10000;
            display: none;
            opacity: 0;
            transition: all 0.4s ease-in-out;
            max-width: 400px;
            text-align: center;
        `;

        // Add containers to page
        this.elements.statusContainer.appendChild(this.elements.progressContainer);
        document.body.appendChild(this.elements.statusContainer);
        document.body.appendChild(this.elements.errorContainer);

        // Add CSS styles
        this.addRealEstateProgressStyles();

        // Initialize unified progress tracking
        this.progressState = {
            currentStep: 0,
            totalSteps: 0,
            overallProgress: 0,
            isVisible: false,
            currentPhase: 'preparing' // preparing, listing, images, finalizing
        };
    }

    /**
     * Add real estate themed progress styles
     */
    addRealEstateProgressStyles() {
        if (document.getElementById('realestate-progress-styles')) return;

        const style = document.createElement('style');
        style.id = 'realestate-progress-styles';
        style.textContent = `
            .realestate-progress-overlay {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                overflow: hidden;
            }

            .realestate-progress-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Animated Background */
            .progress-bg-animation {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                pointer-events: none;
                opacity: 0.6;
            }

            .floating-icon {
                position: absolute;
                font-size: 24px;
                animation: floatIcon 6s ease-in-out infinite;
                opacity: 0.4;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
            }

            .pulse-circle {
                position: absolute;
                width: 60px;
                height: 60px;
                border: 2px solid rgba(251, 191, 36, 0.3);
                border-radius: 50%;
                animation: pulseExpand 4s ease-in-out infinite;
            }

            /* Main Progress Card */
            .progress-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                padding: 40px;
                box-shadow:
                    0 25px 50px rgba(0, 0, 0, 0.25),
                    0 0 0 1px rgba(255, 255, 255, 0.3);
                text-align: center;
                min-width: 450px;
                max-width: 500px;
                position: relative;
                overflow: hidden;
            }

            .progress-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706);
                animation: shimmer 2s ease-in-out infinite;
            }

            /* Header */
            .progress-header {
                margin-bottom: 30px;
            }

            .platform-logo {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin-bottom: 10px;
            }

            .logo-icon {
                font-size: 32px;
                animation: gentle-bounce 2s ease-in-out infinite;
            }

            .platform-logo h3 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                background: linear-gradient(135deg, #1a365d, #2d3748);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            /* Enhanced Circular Progress */
            .circular-progress-wrapper {
                position: relative;
                display: inline-block;
                margin: 20px 0;
            }

            .progress-circle {
                filter: drop-shadow(0 8px 25px rgba(251, 191, 36, 0.3));
            }

            .inner-circle {
                animation: rotate 20s linear infinite;
            }

            .progress-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
            }

            .progress-icon {
                font-size: 28px;
                margin-bottom: 8px;
                animation: pulse-icon 2s ease-in-out infinite;
            }

            .percentage-display {
                margin-bottom: 5px;
            }

            .percentage-number {
                font-size: 42px;
                font-weight: 800;
                color: #1a365d;
                text-shadow: 0 2px 4px rgba(26, 54, 93, 0.3);
                line-height: 1;
            }

            .percentage-symbol {
                font-size: 20px;
                font-weight: 600;
                color: #4a5568;
                margin-left: 2px;
            }

            .progress-label {
                font-size: 14px;
                font-weight: 600;
                color: #718096;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            /* Progress Steps */
            .progress-steps {
                display: flex;
                justify-content: space-between;
                margin: 30px 0 20px 0;
                padding: 0 20px;
                position: relative;
            }

            .progress-steps::before {
                content: '';
                position: absolute;
                top: 20px;
                left: 50px;
                right: 50px;
                height: 2px;
                background: #e2e8f0;
                z-index: 1;
            }

            .step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                position: relative;
                z-index: 2;
            }

            .step-icon {
                width: 40px;
                height: 40px;
                background: #f7fafc;
                border: 3px solid #e2e8f0;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                transition: all 0.4s ease;
            }

            .step-active .step-icon {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                border-color: #d97706;
                transform: scale(1.1);
                box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
            }

            .step-completed .step-icon {
                background: #10b981;
                border-color: #059669;
                color: white;
            }

            .step-text {
                font-size: 12px;
                font-weight: 600;
                color: #718096;
                text-align: center;
            }

            .step-active .step-text {
                color: #d97706;
                font-weight: 700;
            }

            .step-completed .step-text {
                color: #059669;
            }

            /* Status Text */
            .status-text-container {
                text-align: center;
                margin-top: 20px;
            }

            .status-text {
                font-size: 18px;
                font-weight: 600;
                color: #2d3748;
                margin: 0 0 8px 0;
                transition: all 0.4s ease;
            }

            .status-details {
                font-size: 14px;
                color: #718096;
            }

            .current-action {
                display: inline-block;
                padding: 4px 12px;
                background: rgba(251, 191, 36, 0.1);
                border-radius: 20px;
                color: #d97706;
                font-weight: 500;
            }

            /* Success Animation */
            .success-container {
                text-align: center;
                animation: successSlideIn 0.6s ease-out forwards;
            }

            .success-animation {
                padding: 20px;
            }

            .success-icon {
                font-size: 48px;
                margin-bottom: 20px;
                animation: celebrate 1s ease-in-out;
            }

            .success-animation h2 {
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
                margin: 0 0 10px 0;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }

            .success-animation p {
                color: #e2e8f0;
                font-size: 16px;
                margin: 0 0 20px 0;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
            }

            .success-checkmark {
                margin-top: 20px;
            }

            .checkmark-circle {
                animation: checkmarkCircle 0.8s ease-in-out forwards;
            }

            .checkmark-check {
                animation: checkmarkCheck 0.4s ease-in-out 0.8s forwards;
            }

            /* Error Notification */
            .realestate-error-notification.show {
                display: block;
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            /* Animations */
            @keyframes floatIcon {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(5deg); }
            }

            @keyframes pulseExpand {
                0% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.5); opacity: 0.1; }
                100% { transform: scale(2); opacity: 0; }
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(0%); }
                100% { transform: translateX(100%); }
            }

            @keyframes gentle-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes pulse-icon {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @keyframes successSlideIn {
                0% {
                    opacity: 0;
                    transform: scale(0.8) translateY(30px);
                }
                100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }

            @keyframes celebrate {
                0%, 100% { transform: scale(1) rotate(0deg); }
                25% { transform: scale(1.2) rotate(-5deg); }
                75% { transform: scale(1.2) rotate(5deg); }
            }

            @keyframes checkmarkCircle {
                0% { stroke-dashoffset: 282.7; }
                100% { stroke-dashoffset: 0; }
            }

            @keyframes checkmarkCheck {
                0% { stroke-dashoffset: 25; }
                100% { stroke-dashoffset: 0; }
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .progress-card {
                    min-width: 320px;
                    max-width: 350px;
                    padding: 30px 20px;
                    margin: 20px;
                }

                .progress-circle {
                    width: 160px;
                    height: 160px;
                }

                .percentage-number {
                    font-size: 36px;
                }

                .platform-logo h3 {
                    font-size: 20px;
                }

                .progress-steps {
                    padding: 0 10px;
                }

                .step-text {
                    font-size: 11px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show real estate progress overlay with unified tracking
     */
    showUnifiedProgress() {
        const overlay = this.elements.statusContainer;
        if (!overlay) return;

        // Calculate total steps for unified progress
        this.progressState.totalSteps = 1 + this.state.galleryImages.length; // 1 for listing + N for images
        this.progressState.currentStep = 0;
        this.progressState.overallProgress = 0;
        this.progressState.isVisible = true;
        this.progressState.currentPhase = 'preparing';

        overlay.style.display = 'flex';

        // Trigger fade in animation
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        // Initialize step indicators
        this.updateStepIndicators();
        this.updateUnifiedProgress(0, 'Preparing your property listing...');
    }

    /**
     * Update unified progress with single continuous percentage
     */
    updateUnifiedProgress(completedSteps, statusText = '', actionDetail = '') {
        if (!this.progressState.isVisible) return;

        this.progressState.currentStep = completedSteps;
        this.progressState.overallProgress = this.progressState.totalSteps > 0 ?
            Math.round((completedSteps / this.progressState.totalSteps) * 100) : 0;

        // Update circular progress
        const progressCircle = this.elements.progressContainer.querySelector('.progress-bar-circle');
        const percentageNumber = this.elements.progressContainer.querySelector('.percentage-number');
        const statusTextEl = this.elements.progressContainer.querySelector('.status-text');
        const actionDetailEl = this.elements.progressContainer.querySelector('.current-action');

        if (progressCircle) {
            const circumference = 2 * Math.PI * 75; // radius = 75
            const offset = circumference - (this.progressState.overallProgress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }

        if (percentageNumber) {
            this.animateNumber(percentageNumber, this.progressState.overallProgress);
        }

        if (statusText && statusTextEl) {
            this.updateStatusText(statusTextEl, statusText);
        }

        if (actionDetail && actionDetailEl) {
            this.updateStatusText(actionDetailEl, actionDetail);
            actionDetailEl.style.display = 'block';
        } else if (actionDetailEl) {
            // Hide the action detail element when no detail is provided
            actionDetailEl.style.display = 'none';
        }

        // Update step indicators based on progress
        this.updateStepIndicators();

        console.log(`📊 Unified Progress: ${this.progressState.overallProgress}% (${completedSteps}/${this.progressState.totalSteps})`);
    }

    /**
     * Update step indicators based on current progress
     */
    updateStepIndicators() {
        const steps = this.elements.progressContainer.querySelectorAll('.step');

        steps.forEach((step, index) => {
            step.classList.remove('step-active', 'step-completed');

            if (index === 0) {
                // Listing Details step
                if (this.progressState.currentStep === 0) {
                    step.classList.add('step-active');
                } else {
                    step.classList.add('step-completed');
                }
            } else if (index === 1) {
                // Images Upload step
                const imageStepsStart = 1;
                const imageStepsEnd = this.progressState.totalSteps - 1;

                if (this.progressState.currentStep >= imageStepsStart && this.progressState.currentStep < imageStepsEnd) {
                    step.classList.add('step-active');
                } else if (this.progressState.currentStep >= imageStepsEnd) {
                    step.classList.add('step-completed');
                }
            } else if (index === 2) {
                // Publishing step
                if (this.progressState.currentStep === this.progressState.totalSteps) {
                    step.classList.add('step-completed');
                } else if (this.progressState.currentStep === this.progressState.totalSteps - 1) {
                    step.classList.add('step-active');
                }
            }
        });
    }

    /**
     * Show success state with celebration
     */
    showRealEstateSuccess() {
        const container = this.elements.progressContainer;
        const progressCard = container.querySelector('.progress-card');
        const successContainer = container.querySelector('.success-container');

        // Hide progress card
        if (progressCard) progressCard.style.display = 'none';

        // Show success animation
        if (successContainer) {
            successContainer.style.display = 'block';
        }

        // Auto hide after 3 seconds
        setTimeout(() => {
            this.hideUnifiedProgress();
        }, 3000);
    }

    /**
     * Hide progress overlay
     */
    hideUnifiedProgress() {
        const overlay = this.elements.statusContainer;
        if (!overlay) return;

        this.progressState.isVisible = false;
        overlay.style.opacity = '0';

        setTimeout(() => {
            overlay.style.display = 'none';
            // Reset for next use
            this.resetUnifiedProgress();
        }, 400);
    }

    /**
     * Reset progress display for reuse
     */
    resetUnifiedProgress() {
        const container = this.elements.progressContainer;
        const progressCard = container.querySelector('.progress-card');
        const successContainer = container.querySelector('.success-container');

        // Show progress card
        if (progressCard) progressCard.style.display = 'block';

        // Hide success
        if (successContainer) successContainer.style.display = 'none';

        // Reset progress state
        this.progressState.currentStep = 0;
        this.progressState.overallProgress = 0;
        this.progressState.currentPhase = 'preparing';

        // Reset visual progress
        this.updateUnifiedProgress(0, 'Preparing your property listing...');
    }

    /**
     * Show real estate themed error notification
     */
    showRealEstateError(message) {
        const errorContainer = this.elements.errorContainer;
        if (!errorContainer) return;

        errorContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">⚠️</span>
                <span>${message}</span>
            </div>
        `;
        errorContainer.classList.add('show');

        // Auto hide after 5 seconds
        setTimeout(() => {
            errorContainer.classList.remove('show');
        }, 5000);
    }

    /**
     * Animate number changes
     */
    animateNumber(element, targetValue) {
        const currentValue = parseInt(element.textContent) || 0;
        const duration = 400;
        const steps = 20;
        const increment = (targetValue - currentValue) / steps;
        let current = currentValue;
        let step = 0;

        const animate = () => {
            if (step < steps) {
                current += increment;
                element.textContent = Math.round(current);
                step++;
                requestAnimationFrame(animate);
            } else {
                element.textContent = targetValue;
            }
        };

        if (currentValue !== targetValue) {
            animate();
        }
    }

    /**
     * Update status text with fade transition
     */
    updateStatusText(element, newText) {
        if (element.textContent === newText) return;

        element.style.opacity = '0.5';
        setTimeout(() => {
            element.textContent = newText;
            element.style.opacity = '1';
        }, 150);
    }

    /**
     * Show clean error notification
     */
    showCleanError(message) {
        const errorContainer = this.elements.errorContainer;
        if (!errorContainer) return;

        errorContainer.textContent = message;
        errorContainer.classList.add('show');

        // Auto hide after 4 seconds
        setTimeout(() => {
            errorContainer.classList.remove('show');
        }, 4000);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        console.log('🔧 Attaching event listeners...');

        // Form submission
        this.form.addEventListener('submit', (e) => {
            console.log('📝 Form submit event triggered');
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Form input validation - only validate prices in real-time
        const inputElements = this.form.querySelectorAll('input, textarea, select');
        inputElements.forEach(element => {
            // Skip gallery input as it's handled separately
            if (element === this.elements.galleryInput) return;

            // Add real-time price validation for price fields only
            if (this.isPriceField(element)) {
                element.addEventListener('input', () => this.validatePricesRealtime());
                element.addEventListener('blur', () => this.validatePricesRealtime());
            }

            // Clear any error styling when user focuses on field
            element.addEventListener('focus', () => {
                this.clearFieldError(element);
            });
        });

        // Gallery input change
        console.log('🖼️ Gallery input element:', this.elements.galleryInput);
        if (this.elements.galleryInput) {
            this.elements.galleryInput.addEventListener('change', (e) => {
                console.log('📁 Gallery files selected:', e.target.files.length, 'files');
                this.handleGallerySelection(e.target.files);
                this.updateGalleryPreview(e.target.files);
            });
            console.log('✅ Gallery input change listener attached');
        } else {
            console.error('❌ Gallery input not found!');
        }

        // Prevent accidental page leave during upload
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isSubmitting) {
                e.preventDefault();
                e.returnValue = 'Upload in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        console.log('✅ All event listeners attached');
    }

    /**
     * Validate form before submission
     */
    validateForm() {
        // This method now only runs during form submission
        // Clear previous errors
        this.clearAllFieldErrors();

        let allValid = true;
        let validationErrors = [];

        // Check required fields
        const requiredFields = this.form.querySelectorAll('[required]');
        Array.from(requiredFields).forEach(field => {
            if (field.value.trim() === '') {
                allValid = false;
                const fieldLabel = this.getFieldLabel(field);
                validationErrors.push(`${fieldLabel} is required`);
            }
        });

        // Validate price range
        if (!this.validatePriceRange()) {
            allValid = false;
            validationErrors.push('Price range is invalid');
        }

        // Validate email fields
        if (!this.validateEmailFields()) {
            allValid = false;
            validationErrors.push('Invalid email format');
        }

        // Validate numeric fields
        if (!this.validateNumericFields()) {
            allValid = false;
            validationErrors.push('Invalid numeric values');
        }

        // Show error toaster if there are validation errors
        if (!allValid && validationErrors.length > 0) {
            const errorMessage = validationErrors.length === 1
                ? validationErrors[0]
                : `Please fix ${validationErrors.length} validation errors`;
            this.showRealEstateError(errorMessage);
        }

        return allValid;
    }

    /**
     * Validate price range (min <= max) - used during submission
     */
    validatePriceRange() {
        const priceMinField = this.form.querySelector('input[name="price_min"], input[name="min_price"], input[name="priceMin"]');
        const priceMaxField = this.form.querySelector('input[name="price_max"], input[name="max_price"], input[name="priceMax"]');

        if (!priceMinField || !priceMaxField) return true;

        const minValue = priceMinField.value.trim();
        const maxValue = priceMaxField.value.trim();

        if (minValue === '' || maxValue === '') return true; // Skip if empty

        const minPrice = parseFloat(minValue);
        const maxPrice = parseFloat(maxValue);

        if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
            return false; // Don't show field errors here, just return false
        }

        return true;
    }

    /**
     * Real-time price validation - shows field errors immediately
     */
    validatePricesRealtime() {
        const priceMinField = this.form.querySelector('input[name="price_min"], input[name="min_price"], input[name="priceMin"]');
        const priceMaxField = this.form.querySelector('input[name="price_max"], input[name="max_price"], input[name="priceMax"]');

        if (!priceMinField || !priceMaxField) return;

        // Clear existing price errors first
        this.clearFieldError(priceMinField);
        this.clearFieldError(priceMaxField);

        const minValue = priceMinField.value.trim();
        const maxValue = priceMaxField.value.trim();

        // Only validate if both fields have values
        if (minValue === '' || maxValue === '') return;

        const minPrice = parseFloat(minValue);
        const maxPrice = parseFloat(maxValue);

        if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
            this.showFieldError(priceMinField, 'Minimum price cannot be greater than maximum price');
            this.showFieldError(priceMaxField, 'Maximum price must be greater than minimum price');
        }
    }

    /**
     * Check if field is a price field
     */
    isPriceField(field) {
        const name = field.name?.toLowerCase() || '';
        const id = field.id?.toLowerCase() || '';
        return name.includes('price') || id.includes('price');
    }

    /**
     * Validate email fields - used during submission
     */
    validateEmailFields() {
        const emailFields = this.form.querySelectorAll('input[type="email"]');
        let allValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        emailFields.forEach(field => {
            const email = field.value.trim();
            if (email !== '' && !emailRegex.test(email)) {
                allValid = false; // Don't show field errors, just return false
            }
        });

        return allValid;
    }

    /**
     * Validate numeric fields - used during submission
     */
    validateNumericFields() {
        const numericFields = this.form.querySelectorAll('input[type="number"]');
        let allValid = true;

        numericFields.forEach(field => {
            const value = field.value.trim();
            if (value !== '') {
                const numValue = parseFloat(value);
                const min = field.getAttribute('min');
                const max = field.getAttribute('max');

                if (isNaN(numValue)) {
                    allValid = false; // Don't show field errors, just return false
                } else {
                    if (min !== null && numValue < parseFloat(min)) {
                        allValid = false;
                    }
                    if (max !== null && numValue > parseFloat(max)) {
                        allValid = false;
                    }
                }
            }
        });

        return allValid;
    }

    /**
     * Show field error message
     */
    showFieldError(field, message) {
        // Remove existing error for this field
        this.clearFieldError(field);

        // Add error class to field
        field.classList.add('field-error');

        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error-message';
        errorElement.innerHTML = `<span class="error-icon">⚠️</span> ${message}`;

        // Style the error message
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 13px;
            font-weight: 500;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
            animation: slideInError 0.3s ease-out;
        `;

        // Insert error message after field
        const container = field.closest('.form-group') || field.closest('.input-group') || field.parentElement;
        container.appendChild(errorElement);

        // Add field error styling if not already added
        if (!document.getElementById('field-error-styles')) {
            this.addFieldErrorStyles();
        }
    }

    /**
     * Clear specific field error
     */
    clearFieldError(field) {
        field.classList.remove('field-error');
        const container = field.closest('.form-group') || field.closest('.input-group') || field.parentElement;
        const existingError = container.querySelector('.field-error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Clear all field errors
     */
    clearAllFieldErrors() {
        const errorFields = this.form.querySelectorAll('.field-error');
        const errorMessages = this.form.querySelectorAll('.field-error-message');

        errorFields.forEach(field => field.classList.remove('field-error'));
        errorMessages.forEach(message => message.remove());
    }

    /**
     * Get field label for error messages
     */
    getFieldLabel(field) {
        // Try to find associated label
        const label = this.form.querySelector(`label[for="${field.id}"]`) ||
                     field.closest('.form-group')?.querySelector('label') ||
                     field.closest('.input-group')?.querySelector('label') ||
                     field.parentElement.querySelector('label');

        if (label) {
            return label.textContent.trim().replace('*', '').replace(':', '');
        }

        // Fallback to field attributes
        return field.getAttribute('placeholder') ||
               field.getAttribute('name')?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) ||
               'Field';
    }

    /**
     * Add field error styles
     */
    addFieldErrorStyles() {
        const style = document.createElement('style');
        style.id = 'field-error-styles';
        style.textContent = `
            .field-error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
                background-color: rgba(254, 242, 242, 0.5) !important;
            }

            .field-error-message {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .error-icon {
                font-size: 12px;
                flex-shrink: 0;
            }

            @keyframes slideInError {
                0% {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Handle form submission (STEP 1)
     */
    async handleFormSubmit() {
        console.log('🚀 Starting form submission...');
        console.log('📊 Current state:', {
            isSubmitting: this.state.isSubmitting,
            isComplete: this.state.isComplete,
            galleryImagesCount: this.state.galleryImages.length,
            galleryImageNames: this.state.galleryImages.map(f => f.name)
        });

        // If process is complete, redirect to listings page instead of resubmitting
        if (this.state.isComplete) {
            console.log('🔄 Process already complete, redirecting...');
            if (this.state.redirectUrl) {
                window.location.href = this.state.redirectUrl;
            }
            return;
        }

        if (this.state.isSubmitting) {
            this.showError('Upload already in progress. Please wait...');
            return;
        }

        // Run comprehensive validation FIRST - before any progress UI
        const isFormValid = this.validateForm();

        if (!isFormValid) {
            console.log('❌ Form validation failed - blocking submission');
            this.showRealEstateError('Please fix all validation errors before submitting');
            return; // Stop here - don't show progress screen
        }

        console.log('✅ Form validation passed - proceeding with submission');

        try {
            this.state.isSubmitting = true;

            // Show unified progress tracking ONLY after validation passes
            this.showUnifiedProgress();
            this.updateUnifiedProgress(0, 'Creating your property listing...');

            // Prepare form data (without gallery images). This may compress the featured image if needed.
            let formData = await this.prepareListingData();

            console.log('📤 Submitting STEP 1: Listing data + featured image');

            // Submit STEP 1: Listing data + featured image. If server returns 413 (Request Entity Too Large)
            // attempt a few more compression passes with more aggressive settings.
            let response = null;
            let attempt = 0;
            const maxAttempts = this.config.maxRetries + 1; // initial try + retries

            while (attempt < maxAttempts) {
                try {
                    response = await this.submitListingData(formData);
                    break; // success
                } catch (err) {
                    attempt++;
                    const msg = (err && err.message) ? err.message.toLowerCase() : '';
                    const isTooLarge = msg.includes('413') || msg.includes('too large') || msg.includes('request entity too large');

                    if (!isTooLarge || attempt >= maxAttempts) {
                        throw err; // rethrow final error
                    }

                    console.warn(`Upload rejected due to size (attempt ${attempt}/${maxAttempts}). Trying more aggressive compression...`);

                    // Increase iterations and lower quality for next attempt
                    formData = await this.prepareListingData({
                        maxIterations: 6,
                        minQuality: 0.25
                    });

                    // small backoff
                    await new Promise(r => setTimeout(r, this.config.retryDelay || 800));
                    continue;
                }
            }

            console.log('📥 STEP 1 Response:', response);

            if (response.success) {
                this.state.listingCreated = true;
                this.state.listingId = response.listing.id;
                this.state.uploadUrl = response.upload_url;
                this.state.redirectUrl = response.redirect_url; // Store redirect URL

                // Store fresh CSRF token from response
                if (response.csrf_token) {
                    this.state.freshCSRFToken = response.csrf_token;
                    console.log('🔐 Fresh CSRF token received and stored');
                } else {
                    console.warn('⚠️ No fresh CSRF token in response');
                }

                // Update progress to show listing creation complete (step 1)
                this.updateUnifiedProgress(1, `Listing "${response.listing.title}" created!`);

                console.log('✅ STEP 1 completed successfully');
                console.log('🖼️ Gallery images to upload:', this.state.galleryImages.length);

                // Start STEP 2: Gallery upload if there are images
                if (this.state.galleryImages.length > 0) {
                    console.log('🚀 Starting STEP 2: Gallery upload');

                    // Small delay to show listing creation success
                    setTimeout(async () => {
                        await this.uploadGalleryImagesUnified();
                    }, 800);
                } else {
                    console.log('📭 No gallery images to upload, completing process');
                    setTimeout(() => {
                        this.updateUnifiedProgress(this.progressState.totalSteps, 'Property listing published!');
                        setTimeout(() => {
                            this.showRealEstateSuccess();
                            this.completeProcess(response.redirect_url);
                        }, 500);
                    }, 800);
                }
            } else {
                throw new Error(response.message || 'Failed to create listing');
            }

        } catch (error) {
            console.error('❌ Form submission error:', error);
            this.handleError(error, 'Failed to create listing');
        }
    }    /**
     * Prepare form data excluding gallery images
     */
    async prepareListingData(options = {}) {
        // Prevent sending overly large featured images which would be rejected by the server
    const MAX_UPLOAD_BYTES = this.config.serverMaxFileSize || (1 * 1024 * 1024); // default trigger: 1MB

        // Work on a FormData copy so we can replace files safely
        const formData = new FormData(this.form);

        // Remove gallery images from form data (they'll be uploaded separately)
        formData.delete('gallery_images[]');

        // Attempt iterative compression for featured image if it's too large
        const featuredInput = this.form.querySelector('input[name="featured_image"]');
        let featuredFile = featuredInput?.files?.[0];

        if (featuredFile) {
            // If already under server limit, append as-is
            if (featuredFile.size > MAX_UPLOAD_BYTES) {
                // Determine iterations: user wanted roughly 1 iteration per MB
                const sizeMB = featuredFile.size / (1024 * 1024);

                let iterations = options.maxIterations || Math.ceil(sizeMB);
                iterations = Math.min(Math.max(iterations, 1), 10); // clamp between 1 and 10

                let compressedFile = featuredFile;
                let quality = options.startQuality || 0.8;
                const minQuality = options.minQuality || 0.4;

                console.log(`🖼️ Featured image original size: ${(featuredFile.size / 1024).toFixed(0)}KB (${(featuredFile.size / 1024 / 1024).toFixed(2)}MB); iterations: ${iterations}`);

                for (let i = 0; i < iterations; i++) {
                    // Compute a target maxSizeKB for this pass (try to reduce progressively)
                    const estimatedTargetKB = Math.max(256, Math.round((compressedFile.size / 1024) / (iterations - i)));

                    try {
                        // Use global ImageCompressor.compress API
                        const compressOptions = {
                            maxWidth: 1920,
                            maxHeight: 1080,
                            quality: quality,
                            maxSizeKB: estimatedTargetKB
                        };

                        // Allow forcing WebP conversion in aggressive retries
                        if (options.forceWebP) {
                            compressOptions.mimeType = 'image/webp';
                        }

                        compressedFile = await ImageCompressor.compress(compressedFile, compressOptions);
                    } catch (e) {
                        // If compression fails, stop trying and keep original
                        console.warn('Compression attempt failed:', e);
                        compressedFile = featuredFile;
                        break;
                    }
                    console.log(`🛠️ Compression pass ${i + 1}: ${(compressedFile.size / 1024).toFixed(0)}KB (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB) quality=${quality}`);

                    // If we achieved the server limit, stop
                    if (compressedFile.size <= MAX_UPLOAD_BYTES) break;

                    // Reduce quality for next pass but don't go below minQuality
                    quality = Math.max(minQuality, quality - 0.15);
                }

                // If still too large after attempts, throw and let caller show a message
                if (compressedFile.size > MAX_UPLOAD_BYTES) {
                    throw new Error(`Featured image is too large after compression (${Math.round(compressedFile.size / 1024 / 1024)}MB). Please choose a smaller image.`);
                }

                // Replace featured_image in formData with compressed file
                formData.delete('featured_image');
                formData.append('featured_image', compressedFile, compressedFile.name);
                console.log(`✅ Final featured image size after compression: ${(compressedFile.size / 1024).toFixed(0)}KB (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);
                this.showCompressionNotice(featuredFile.size, compressedFile.size, compressedFile.name || featuredFile.name);
            }
        }

        // Add CSRF token if not already present
        if (!formData.has('_token')) {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                formData.append('_token', csrfToken);
            }
        }

        return formData;
    }

    /**
     * Show a small compression notice to the user (non-blocking)
     */
    showCompressionNotice(originalSizeBytes, compressedSizeBytes, filename) {
        try {
            const sizeStr = (bytes) => (bytes / 1024).toFixed(0) + 'KB';
            const notice = document.createElement('div');
            notice.className = 'compression-notice';
            notice.style.cssText = 'position:fixed;right:20px;bottom:20px;background:rgba(0,0,0,0.7);color:#fff;padding:10px 14px;border-radius:8px;z-index:11000;font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,0.4);';
            notice.innerText = `${filename}: ${sizeStr(originalSizeBytes)} → ${sizeStr(compressedSizeBytes)} (compressed)`;
            document.body.appendChild(notice);
            setTimeout(() => {
                notice.style.transition = 'opacity 0.4s ease';
                notice.style.opacity = '0';
                setTimeout(() => notice.remove(), 500);
            }, 2500);
        } catch (e) {
            // ignore UI errors
            console.warn('showCompressionNotice error', e);
        }
    }

    /**
     * Submit listing data (STEP 1)
     */
    async submitListingData(formData) {
        const response = await fetch(this.form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            // Explicitly handle server payload-too-large
            if (response.status === 413) {
                throw new Error('The upload is too large for the server (413). Please reduce the featured image size or contact support.');
            }

            // Try to extract JSON message; fallback to generic
            let errorData = null;
            try {
                errorData = await response.json();
            } catch (e) {
                // ignore - body may not be JSON
            }

            const message = (errorData && errorData.message) ? errorData.message : `HTTP ${response.status}`;
            throw new Error(message);
        }

        return await response.json();
    }

    /**
     * Handle gallery file selection
     */
    handleGallerySelection(files) {
        console.log('🎯 handleGallerySelection called with:', files.length, 'files');

        this.state.galleryImages = [];
        this.state.uploadProgress.total = 0;

        if (files && files.length > 0) {
            console.log('📂 Processing', files.length, 'gallery files...');
            for (let file of files) {
                console.log('🖼️ Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
                if (this.validateImageFile(file)) {
                    this.state.galleryImages.push(file);
                    console.log('✅ File added to gallery:', file.name);
                } else {
                    console.log('❌ File rejected:', file.name);
                }
            }
            this.state.uploadProgress.total = this.state.galleryImages.length;
            this.updateProgressInfo();

            console.log('📊 Gallery summary:', {
                totalFiles: files.length,
                validFiles: this.state.galleryImages.length,
                galleryImageNames: this.state.galleryImages.map(f => f.name)
            });
        } else {
            console.log('📭 No files selected or files is null/empty');
        }
    }

    /**
     * Update gallery preview UI
     */
    updateGalleryPreview(files) {
        const container = document.getElementById('gallery-preview-container');
        const grid = document.getElementById('gallery-preview-grid');
        const count = document.getElementById('gallery-count');

        if (!container || !grid || !count) {
            console.log('📷 Gallery preview elements not found, skipping preview update');
            return;
        }

        if (files && files.length > 0) {
            count.textContent = files.length;
            container.style.display = 'block';
            grid.innerHTML = '';

            Array.from(files).forEach((file, index) => {
                if (index < 6) { // Show max 6 previews
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const previewHtml = `
                            <div class="col-md-4 col-sm-6 mb-2">
                                <div class="card">
                                    <img src="${e.target.result}" class="card-img-top" style="height: 100px; object-fit: cover;">
                                    <div class="card-body p-2">
                                        <small class="text-muted">${file.name}</small>
                                    </div>
                                </div>
                            </div>
                        `;
                        grid.insertAdjacentHTML('beforeend', previewHtml);
                    };
                    reader.readAsDataURL(file);
                }
            });

            if (files.length > 6) {
                const moreHtml = `
                    <div class="col-md-4 col-sm-6 mb-2">
                        <div class="card">
                            <div class="card-body text-center" style="height: 100px; display: flex; align-items: center; justify-content: center;">
                                <small class="text-muted">+${files.length - 6} more images</small>
                            </div>
                        </div>
                    </div>
                `;
                grid.insertAdjacentHTML('beforeend', moreHtml);
            }
        } else {
            container.style.display = 'none';
        }
    }

    /**
     * Validate individual image file
     */
    validateImageFile(file) {
        // Check file type
        if (!this.config.allowedImageTypes.includes(file.type)) {
            this.showError(`Invalid file type: ${file.name}. Allowed types: JPEG, PNG, GIF, SVG, WebP`);
            return false;
        }

        // Check file size
        if (file.size > this.config.maxFileSize) {
            const maxSizeMB = (this.config.maxFileSize / 1024 / 1024).toFixed(1);
            this.showError(`File too large: ${file.name}. Maximum size: ${maxSizeMB}MB`);
            return false;
        }

        return true;
    }

    /**
     * Upload gallery images (STEP 2)
     */
    /**
     * Upload gallery images with unified progress tracking
     */
    async uploadGalleryImagesUnified() {
        // Initialize upload progress tracking
        this.state.uploadProgress.completed = 0;
        this.state.uploadProgress.failed = 0;

        try {
            for (let i = 0; i < this.state.galleryImages.length; i++) {
                const file = this.state.galleryImages[i];
                const imageNumber = i + 1;
                const currentStepInTotal = 1 + i + 1; // 1 for listing + current image

                // Update progress for current image upload
                this.updateUnifiedProgress(
                    1 + i, // Completed steps (listing + previous images)
                    `Uploading property images...`,
                    // `Uploading image ${imageNumber} of ${this.state.galleryImages.length}`
                );

                const success = await this.uploadSingleImageUnified(file, imageNumber);

                if (success) {
                    this.state.uploadProgress.completed++;
                    console.log(`✅ Image ${imageNumber} uploaded successfully`);
                } else {
                    this.state.uploadProgress.failed++;
                    console.log(`❌ Image ${imageNumber} failed to upload`);
                }

                // Update unified progress after each image
                this.updateUnifiedProgress(1 + this.state.uploadProgress.completed + this.state.uploadProgress.failed, `Uploading property images...`);

                // Update progress after each upload
                // this.updateUnifiedProgress(
                //     currentStepInTotal,
                //     `Uploading property images...`,
                //     success ? `Image ${imageNumber} uploaded successfully!` : `Image ${imageNumber} failed - continuing...`
                // );

                // Small delay between uploads for better UX
                if (i < this.state.galleryImages.length - 1) {
                    await this.delay(200);
                }
            }

            // All images processed - show final results
            const allCompleted = this.state.uploadProgress.completed + this.state.uploadProgress.failed;
            this.updateUnifiedProgress(this.progressState.totalSteps, 'Finalizing your listing...');

            // Small delay before showing results
            setTimeout(() => {
                if (this.state.uploadProgress.failed === 0) {
                    this.updateUnifiedProgress(this.progressState.totalSteps, 'Property listing published successfully!');
                    setTimeout(() => {
                        this.showRealEstateSuccess();
                        this.completeProcess();
                    }, 1000);
                } else {
                    this.hideUnifiedProgress();
                    this.showRealEstateError(`Upload completed with ${this.state.uploadProgress.failed} failed images. You can add them later by editing the listing.`);
                    setTimeout(() => {
                        this.completeProcess();
                    }, 3000);
                }
            }, 500);

        } catch (error) {
            console.error('❌ Gallery upload process error:', error);

            this.hideUnifiedProgress();

            // If the listing was already created, don't reset the entire process
            if (this.state.listingCreated) {
                this.showRealEstateError(`Gallery upload encountered an error: ${error.message}. You can add images later by editing the listing.`);
                setTimeout(() => {
                    this.completeProcess();
                }, 3000);
            } else {
                // Only call handleError if the listing itself wasn't created
                this.handleError(error, 'Failed to upload gallery images');
            }
        }
    }

    /**
     * Upload a single gallery image with unified progress
     */
    async uploadSingleImageUnified(file, imageNumber) {
        let attempts = 0;

        // Prepare compressedFile; compress on client if file exceeds server trigger
        const MAX_UPLOAD_BYTES = this.config.serverMaxFileSize || (1 * 1024 * 1024);
        let compressedFile = file;

        try {
            if (file.size > MAX_UPLOAD_BYTES) {
                const sizeMB = file.size / (1024 * 1024);
                let iterations = Math.ceil(sizeMB);
                iterations = Math.min(Math.max(iterations, 1), 10);

                let quality = 0.8;
                const minQuality = 0.4;

                console.log(`🖼️ Compressing gallery image before upload: ${file.name} original ${(file.size/1024).toFixed(0)}KB; iterations: ${iterations}`);

                for (let i = 0; i < iterations; i++) {
                    const estimatedTargetKB = Math.max(200, Math.round((compressedFile.size / 1024) / (iterations - i)));
                    try {
                        compressedFile = await ImageCompressor.compress(compressedFile, {
                            maxWidth: 1920,
                            maxHeight: 1080,
                            quality: quality,
                            maxSizeKB: estimatedTargetKB
                        });
                    } catch (e) {
                        console.warn('Gallery compression attempt failed:', e);
                        compressedFile = file;
                        break;
                    }

                    console.log(`🛠️ Gallery compression pass ${i+1}: ${(compressedFile.size/1024).toFixed(0)}KB quality=${quality}`);

                    if (compressedFile.size <= MAX_UPLOAD_BYTES) break;
                    quality = Math.max(minQuality, quality - 0.15);
                }

                console.log(`✅ Gallery image final size: ${(compressedFile.size/1024).toFixed(0)}KB`);
                this.showCompressionNotice(file.size, compressedFile.size, compressedFile.name || file.name);
            }
        } catch (e) {
            console.warn('Error during initial gallery compression:', e);
            compressedFile = file;
        }

        while (attempts < this.config.maxRetries) {
            try {
                const formData = new FormData();
                formData.append('gallery_image', compressedFile);

                // Get fresh CSRF token for each upload
                const csrfToken = await this.getFreshCSRFToken();
                formData.append('_token', csrfToken);

                console.log(`🔐 Using CSRF token for ${compressedFile.name}: ${csrfToken ? csrfToken.substring(0, 10) + '...' : 'null'}`);

                const response = await fetch(this.state.uploadUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log(`Gallery image uploaded: ${file.name}`);
                        return true;
                    } else {
                        throw new Error(data.message || 'Upload failed');
                    }
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }

            } catch (error) {
                attempts++;
                console.error(`Upload attempt ${attempts} failed for ${file.name}:`, error.message);

                const msg = (error && error.message) ? error.message.toLowerCase() : '';
                const isTooLarge = msg.includes('413') || msg.includes('too large') || msg.includes('request entity too large');

                if (isTooLarge && attempts < this.config.maxRetries) {
                    // Try a more aggressive compression (force webp and lower quality)
                    try {
                        console.warn('Server rejected upload as too large - attempting more aggressive compression (webp)');
                        const moreCompressed = await ImageCompressor.compress(compressedFile, {
                            maxWidth: 1600,
                            maxHeight: 900,
                            quality: 0.5,
                            maxSizeKB: Math.max(150, Math.round((compressedFile.size / 1024) / 2)),
                            mimeType: 'image/webp'
                        });
                        compressedFile = moreCompressed || compressedFile;
                        console.log(`🛠️ Aggressive compression result: ${(compressedFile.size/1024).toFixed(0)}KB`);
                        this.showCompressionNotice(file.size, compressedFile.size, compressedFile.name || file.name);
                    } catch (e) {
                        console.warn('Aggressive compression failed:', e);
                    }
                }

                if (attempts < this.config.maxRetries) {
                    // Update progress to show retry attempt
                    this.updateUnifiedProgress(
                        1 + this.state.uploadProgress.completed + this.state.uploadProgress.failed,
                        `Uploading property images...`
                    );
                    await this.delay(this.config.retryDelay);
                } else {
                    console.error(`Failed to upload ${file.name} after ${this.config.maxRetries} attempts`);
                    return false;
                }
            }
        }

        return false;
    }

    /**
     * Get a fresh CSRF token from the server
     */
    async getFreshCSRFToken() {
        // Use the fresh token from listing creation response if available
        if (this.state.freshCSRFToken) {
            console.log('🔐 Using fresh CSRF token from listing creation');
            return this.state.freshCSRFToken;
        }

        try {
            console.log('🔐 Fetching fresh CSRF token from server...');
            const response = await fetch('/affiliate/dashboard/csrf-token', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Fresh CSRF token fetched successfully');
                return data.csrf_token;
            }
        } catch (error) {
            console.warn('⚠️ Failed to get fresh CSRF token, using existing token');
        }

        // Fallback to existing token
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
               document.querySelector('input[name="_token"]')?.value;
    }

    /**
     * Upload a single gallery image with retry mechanism
     */
    async uploadSingleImage(file, imageNumber) {
        let attempts = 0;

        while (attempts < this.config.maxRetries) {
            try {
                const formData = new FormData();
                formData.append('gallery_image', file);

                // Get fresh CSRF token for each upload
                const csrfToken = await this.getFreshCSRFToken();
                formData.append('_token', csrfToken);

                console.log(`🔐 Using CSRF token for ${file.name}: ${csrfToken ? csrfToken.substring(0, 10) + '...' : 'null'}`);

                const response = await fetch(this.state.uploadUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log(`Gallery image uploaded: ${file.name}`);
                        return true;
                    } else {
                        throw new Error(data.message || 'Upload failed');
                    }
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }

            } catch (error) {
                attempts++;
                console.error(`Upload attempt ${attempts} failed for ${file.name}:`, error.message);

                if (attempts < this.config.maxRetries) {
                    // Update progress to show retry attempt
                    this.updateCleanProgress(
                        this.state.uploadProgress.completed + this.state.uploadProgress.failed,
                        this.state.uploadProgress.total,
                        `Retrying image ${imageNumber}... (attempt ${attempts + 1})`
                    );
                    await this.delay(this.config.retryDelay);
                } else {
                    console.error(`Failed to upload ${file.name} after ${this.config.maxRetries} attempts`);
                    return false;
                }
            }
        }

        return false;
    }

    /**
     * Update UI state based on current process
     */
    updateUIState(state) {
        const submitBtn = this.elements.submitBtn;

        switch (state) {
            case 'submitting':
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Listing...';
                }
                // Progress is now handled by unified progress system
                break;

            case 'uploading':
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt fa-spin"></i> Uploading Images...';
                    submitBtn.style.background = '#ffc107';
                }
                // Progress is now handled by unified progress system
                break;

            case 'complete':
                if (submitBtn) {
                    submitBtn.disabled = true;
                    if (this.state.isComplete) {
                        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Complete! Redirecting...';
                        submitBtn.style.background = '#28a745';
                        submitBtn.style.cursor = 'not-allowed';
                    } else {
                        submitBtn.innerHTML = '<i class="fas fa-check"></i> Complete!';
                        submitBtn.style.background = '#28a745';
                    }
                }
                // Success handling is now done by unified progress system
                break;

            case 'error':
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Listing';
                    submitBtn.style.background = ''; // Reset to default
                }
                this.hideUnifiedProgress();
                break;
        }
    }

    /**
     * Update progress bar
     */
    /**
     * Update progress bar - now uses unified progress
     */
    updateProgressBar() {
        // Legacy method - now handled by unified progress
        return;
    }

    /**
     * Update progress text - now uses unified progress
     */
    updateProgressText(text) {
        // Legacy method - now handled by unified progress
        return;
    }

    /**
     * Update progress count info - now uses unified progress
     */
    updateProgressInfo() {
        // Legacy method - now handled by unified progress
        return;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showRealEstateSuccess();
        this.hideError();
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showRealEstateError(message);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showRealEstateError(message);
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorContainer = this.elements.errorContainer;
        if (errorContainer) {
            errorContainer.classList.remove('show');
        }
    }

    /**
     * Handle errors with user-friendly messages
     */
    handleError(error, defaultMessage = 'An error occurred') {
        // Only reset submitting state if listing wasn't created yet
        if (!this.state.listingCreated) {
            this.state.isSubmitting = false;
            this.updateUIState('error');
        } else {
            // If listing was created but gallery upload failed, show warning instead
            this.showWarning(defaultMessage);
        }

        let errorMessage = defaultMessage;

        if (error.message) {
            if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('413')) {
                errorMessage = 'File too large. Please try with smaller images.';
            } else if (error.message.includes('422')) {
                errorMessage = 'Validation failed. Please check your input and try again.';
            } else {
                errorMessage = error.message;
            }
        }

        this.showError(errorMessage);
        console.error('Listing creation error:', error);
    }

    /**
     * Complete the entire process
     */
    completeProcess(redirectUrl = null) {
        this.state.isSubmitting = false;
        this.state.isComplete = true; // Mark process as complete
        this.updateUIState('complete');

        // Use stored redirect URL if no parameter provided
        const finalRedirectUrl = redirectUrl || this.state.redirectUrl;

        if (finalRedirectUrl) {
            console.log('🔄 Process complete! Redirecting in 3 seconds to:', finalRedirectUrl);

            // Show countdown timer
            let countdown = 3;
            const updateCountdown = () => {
                if (this.elements.submitBtn) {
                    this.elements.submitBtn.innerHTML = `<i class="fas fa-check-circle"></i> Complete! Redirecting in ${countdown}s...`;
                }

                countdown--;
                if (countdown > 0) {
                    setTimeout(updateCountdown, 1000);
                } else {
                    window.location.href = finalRedirectUrl;
                }
            };

            updateCountdown();
        }
    }

    /**
     * Utility: Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Reset the form and state
     */
    reset() {
        this.state = {
            isSubmitting: false,
            isComplete: false,
            listingCreated: false,
            listingId: null,
            uploadUrl: null,
            redirectUrl: null,
            freshCSRFToken: null,
            galleryImages: [],
            uploadQueue: [],
            uploadProgress: {
                total: 0,
                completed: 0,
                failed: 0
            }
        };

        this.hideUnifiedProgress();
        this.hideError();

        if (this.elements.submitBtn) {
            this.elements.submitBtn.disabled = false;
            this.elements.submitBtn.innerHTML = 'Create Listing';
            this.elements.submitBtn.style.background = '';
            this.elements.submitBtn.style.cursor = '';
        }
    }

    // Debug method to test gallery functionality
    testGalleryUpload() {
        console.log('🧪 Testing gallery upload functionality...');
        console.log('📋 Form:', this.elements.form);
        console.log('📁 Gallery input:', this.elements.galleryInput);
        console.log('📊 Current state:', this.state);

        if (this.elements.galleryInput) {
            console.log('📁 Gallery input attributes:');
            console.log('  - name:', this.elements.galleryInput.name);
            console.log('  - accept:', this.elements.galleryInput.accept);
            console.log('  - multiple:', this.elements.galleryInput.multiple);
            console.log('  - files count:', this.elements.galleryInput.files ? this.elements.galleryInput.files.length : 'N/A');
        } else {
            console.error('❌ Gallery input not found!');
        }

        return {
            form: !!this.elements.form,
            galleryInput: !!this.elements.galleryInput,
            state: this.state
        };
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing ListingCreator...');

    const listingForm = document.querySelector('form[action*="listings.store"], form[action*="listings"]');
    console.log('📋 Found form:', listingForm);

    if (listingForm) {
        console.log('📋 Form action:', listingForm.action);
        console.log('📋 Form method:', listingForm.method);

        try {
            if (!window.listingCreator) {
                window.listingCreator = new ListingCreator('form[action*="listings.store"], form[action*="listings"]', {
                    maxRetries: 3,
                    retryDelay: 1000,
                    parallelUploads: false
                });

                console.log('✅ Multi-step listing creator initialized successfully');
                console.log('📊 Creator state:', window.listingCreator.state);
                console.log('📋 Creator elements:', window.listingCreator.elements);
            } else {
                console.log('⚠️ ListingCreator already exists');
            }
        } catch (error) {
            console.error('❌ Failed to initialize listing creator:', error);
        }
    } else {
        console.log('⚠️ No listing form found on this page');
    }
});

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ListingCreator;
}
