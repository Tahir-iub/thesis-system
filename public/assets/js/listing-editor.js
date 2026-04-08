/**
 * Multi-Step Listing Edit with Asynchronous Gallery Upload
 *
 * ARCHITECTURE:
 * STEP 1: Update listing data + featured image (using updateListingData endpoint)
 * STEP 2: Upload gallery images one-by-one asynchronously (using existing uploadGalleryImage endpoint)
 *
 * Features:
 * - Progress tracking
 * - Error handling
 * - Duplicate submission prevention
 * - Proper UI state management
 * - Retry mechanism for failed uploads
 * - Preserves existing create functionality
 */

class ListingEditor {
    constructor(formSelector, options = {}) {
        this.form = document.querySelector(formSelector);
        if (!this.form) {
            throw new Error(`Form with selector "${formSelector}" not found`);
        }

        // Extract listing ID from form action
        const actionMatch = this.form.action.match(/listings\/(\d+)/);
        if (!actionMatch) {
            throw new Error('Could not extract listing ID from form action');
        }

        this.listingId = actionMatch[1];

        // Configuration
        this.config = {
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            parallelUploads: false, // Upload one-by-one for better progress tracking
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'],
            maxFileSize: 20 * 1024 * 1024, // 20MB
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
            listingUpdated: false,
            uploadUrl: null,
            redirectUrl: null,    // Store redirect URL for completion
            freshCSRFToken: null, // Fresh CSRF token from listing update response
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

        // Unified progress state (used to show a single progress screen like the creator)
        this.progressState = {
            totalSteps: 0,
            currentStep: 0,
            overallProgress: 0,
            isVisible: false,
            currentPhase: null
        };

        this.init();
    }

    /**
     * Initialize the listing editor
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
                        <h3>Updating Listing</h3>
                    </div>
                </div>

                <!-- Circular Progress with Real Estate Theme -->
                <div class="circular-progress-wrapper">
                    <svg class="progress-circle" width="200" height="200" viewBox="0 0 200 200">
                        <defs>
                            <linearGradient id="realEstateGradientEdit" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
                                <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
                            </linearGradient>
                            <filter id="glowEdit">
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
                                stroke="url(#realEstateGradientEdit)"
                                stroke-width="6"
                                stroke-linecap="round"
                                stroke-dasharray="471.2"
                                stroke-dashoffset="471.2"
                                transform="rotate(-90 100 100)"
                                filter="url(#glowEdit)"
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
                        <span class="step-text">Updating Details</span>
                    </div>
                    <div class="step" data-step="2">
                        <div class="step-icon">📷</div>
                        <span class="step-text">Uploading Images</span>
                    </div>
                    <div class="step" data-step="3">
                        <div class="step-icon">✅</div>
                        <span class="step-text">Finalizing</span>
                    </div>
                </div>

                <!-- Status Text -->
                <div class="status-text-container">
                    <p class="status-text">Preparing to update your listing...</p>
                    <div class="status-details">
                        <span class="current-action">Initializing update process</span>
                    </div>
                </div>
            </div>

            <!-- Success Animation -->
            <div class="success-container" style="display: none;">
                <div class="success-animation">
                    <div class="success-icon">🎉</div>
                    <h2>Listing Updated Successfully!</h2>
                    <p>Your changes have been saved</p>
                    <div class="success-checkmark">
                        <div class="check-icon">
                            <span class="icon-line line-tip"></span>
                            <span class="icon-line line-long"></span>
                            <div class="icon-circle"></div>
                            <div class="icon-fix"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Container -->
            <div class="error-container" style="display: none;">
                <div class="error-animation">
                    <div class="error-icon">❌</div>
                    <h2>Update Failed</h2>
                    <p class="error-message">An error occurred while updating your listing</p>
                    <div class="error-actions">
                        <button class="retry-btn" onclick="window.listingEditor.retryProcess()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                        <button class="cancel-btn" onclick="window.listingEditor.hideProgress()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.elements.statusContainer.appendChild(this.elements.progressContainer);
        document.body.appendChild(this.elements.statusContainer);

        // Add CSS styles
        this.addProgressStyles();
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

        // Form input validation - check on any input change
        const inputElements = this.form.querySelectorAll('input, textarea, select');
        inputElements.forEach(element => {
            // Skip gallery input as it's handled separately
            if (element === this.elements.galleryInput) return;

            element.addEventListener('input', () => {
                // Only validate if not in middle of process
                if (!this.state.isSubmitting && !this.state.isComplete) {
                    this.validateForm();
                }
            });
            element.addEventListener('change', () => {
                // Only validate if not in middle of process
                if (!this.state.isSubmitting && !this.state.isComplete) {
                    this.validateForm();
                }
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

        // Prevent accidental page leave during upload with informative warning
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isSubmitting && !this.state.isComplete) {
                const message = this.state.listingUpdated
                    ? 'Gallery images are still uploading. Your listing data has been saved, but leaving now will stop the image upload. Continue?'
                    : 'Update in progress. Your changes have NOT been saved yet. Leaving now will lose all changes. Continue?';

                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        });

        console.log('✅ All event listeners attached');
    }

    /**
     * Validate form before submission
     */
    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        const allValid = Array.from(requiredFields).every(field => {
            return field.value.trim() !== '';
        });

        // Only update button state if not currently submitting or complete
        if (this.elements.submitBtn && !this.state.isSubmitting && !this.state.isComplete) {
            this.elements.submitBtn.disabled = !allValid;
            console.log('🔍 Form validation:', allValid ? 'valid' : 'invalid', '- Button enabled:', allValid);
        }

        return allValid;
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
            galleryImageNames: this.state.galleryImages.map(f => f.name),
            listingId: this.listingId
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
            this.showError('Update already in progress. Please wait...');
            return;
        }

        if (!this.validateForm()) {
            this.showError('Please fill in all required fields.');
            return;
        }

        try {
            this.state.isSubmitting = true;
            this.updateUIState('submitting');
            // Ensure the progress overlay is visible immediately
            this.showProgress();

            // Prepare form data (without gallery images)
            const formData = await this.prepareListingData();

            console.log('📤 Submitting STEP 1: Listing data update + featured image');

            // Submit STEP 1: Update listing data + featured image
            const response = await this.submitListingData(formData);

            console.log('📥 STEP 1 Response:', response);

            if (response.success) {
                this.state.listingUpdated = true;
                this.state.uploadUrl = response.upload_url;
                this.state.redirectUrl = response.redirect_url; // Store redirect URL

                // Store fresh CSRF token from response
                if (response.csrf_token) {
                    this.state.freshCSRFToken = response.csrf_token;
                    console.log('🔐 Fresh CSRF token received and stored');
                } else {
                    console.warn('⚠️ No fresh CSRF token in response');
                }

                // Don't show success message yet - wait for complete process
                console.log('✅ STEP 1 completed successfully');
                console.log('🖼️ Gallery images to upload:', this.state.galleryImages.length);

                // Start STEP 2: Gallery upload if there are images
                if (this.state.galleryImages.length > 0) {
                    console.log('🚀 Starting STEP 2: Gallery upload');
                    await this.uploadGalleryImages();
                } else {
                    console.log('📭 No gallery images to upload, completing process');
                    this.completeProcess(response.redirect_url);
                }
            } else {
                throw new Error(response.message || 'Failed to update listing');
            }

        } catch (error) {
            console.error('❌ Form submission error:', error);
            this.handleError(error, 'Failed to update listing');
        }
    }

    /**
     * Prepare form data excluding gallery images
     */
    async prepareListingData(options = {}) {
        const MAX_UPLOAD_BYTES = this.config.maxFileSize || (20 * 1024 * 1024);
        const formData = new FormData(this.form);

        // Remove gallery images from form data (they'll be uploaded separately)
        formData.delete('gallery_images[]');

        // Change method to PATCH for updateListingData endpoint
        formData.delete('_method');
        formData.append('_method', 'PATCH');

        // Handle featured image compression similar to ListingCreator
        const featuredInput = this.form.querySelector('input[name="featured_image"]');
        let featuredFile = featuredInput?.files?.[0];

        if (featuredFile && featuredFile.size > MAX_UPLOAD_BYTES) {
            const sizeMB = featuredFile.size / (1024 * 1024);
            let iterations = Math.ceil(sizeMB);
            iterations = Math.min(Math.max(iterations, 1), 6);

            let compressedFile = featuredFile;
            let quality = 0.8;

            for (let i = 0; i < iterations; i++) {
                const estimatedTargetKB = Math.max(256, Math.round((compressedFile.size / 1024) / (iterations - i)));
                try {
                    const compressOptions = {
                        maxWidth: 1920,
                        maxHeight: 1080,
                        quality: quality,
                        maxSizeKB: estimatedTargetKB
                    };

                    if (options && options.forceWebP) {
                        compressOptions.mimeType = 'image/webp';
                    }

                    compressedFile = await ImageCompressor.compress(compressedFile, compressOptions);
                } catch (e) {
                    console.warn('Compression attempt failed during edit:', e);
                    compressedFile = featuredFile;
                    break;
                }

                console.log(`🛠️ Compression pass ${i + 1} (edit): ${(compressedFile.size / 1024).toFixed(0)}KB quality=${quality}`);

                if (compressedFile.size <= MAX_UPLOAD_BYTES) break;
                quality = Math.max(0.4, quality - 0.15);
            }

            if (compressedFile.size > MAX_UPLOAD_BYTES) {
                throw new Error(`Featured image is too large after compression (${Math.round(compressedFile.size / 1024 / 1024)}MB). Please choose a smaller image.`);
            }

            // Notify user about compression result
            try {
                this.showCompressionNotice(featuredFile.size, compressedFile.size, compressedFile.name || featuredFile.name);
            } catch (e) {
                console.warn('Failed to show compression notice (edit)', e);
            }

            formData.delete('featured_image');
            formData.append('featured_image', compressedFile, compressedFile.name);
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
        // Use the new updateListingData endpoint instead of the regular update endpoint
        const updateUrl = `/affiliate/dashboard/listings/${this.listingId}/update-data`;

        const response = await fetch(updateUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Network error occurred' }));
            throw new Error(errorData.message || `HTTP ${response.status}`);
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
        // Find gallery preview container if it exists
        const galleryPreview = document.querySelector('.gallery-preview');
        if (!galleryPreview || !files.length) return;

        // Clear existing previews
        galleryPreview.innerHTML = '';

        // Create previews for selected files
        Array.from(files).forEach((file, index) => {
            if (this.validateImageFile(file)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'gallery-preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Gallery ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">
                        <span class="file-name">${file.name}</span>
                    `;
                    galleryPreview.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
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
    async uploadGalleryImages() {
        this.updateUIState('uploading');
        this.state.uploadProgress.completed = 0;
        this.state.uploadProgress.failed = 0;

        try {
            // Initialize unified progress if overlay visible
            if (this.progressState) {
                this.progressState.totalSteps = 1 + this.state.galleryImages.length;
                this.progressState.currentStep = 1; // STEP 1 already completed
                this.progressState.isVisible = true;
                this.showUnifiedProgress();
                this.updateUnifiedProgress(1, 'Uploading gallery images...', 'Uploading images...');
            }

            for (let i = 0; i < this.state.galleryImages.length; i++) {
                const file = this.state.galleryImages[i];
                const success = await this.uploadSingleImage(file, i + 1);

                if (success) {
                    this.state.uploadProgress.completed++;
                } else {
                    this.state.uploadProgress.failed++;
                }

                // Update unified progress if available
                if (this.progressState && this.progressState.isVisible) {
                    const completedSteps = 1 + this.state.uploadProgress.completed; // listing + completed images
                    this.updateUnifiedProgress(completedSteps, `Uploading image ${i+1} of ${this.state.galleryImages.length}`);
                }

                this.updateProgressBar();
                this.updateProgressInfo();
            }

            // Complete the process
            if (this.state.uploadProgress.failed === 0) {
                // Don't show success message here - will be shown in completeProcess
                console.log('✅ All gallery images uploaded successfully');
                setTimeout(() => {
                    this.completeProcess();
                }, 1500);
            } else {
                this.showWarning(`Upload completed with ${this.state.uploadProgress.failed} failed images. You can add them later by editing the listing.`);
                setTimeout(() => {
                    this.completeProcess();
                }, 3000);
            }

        } catch (error) {
            console.error('❌ Gallery upload process error:', error);

            // If the listing was already updated, don't reset the entire process
            if (this.state.listingUpdated) {
                this.showWarning(`Gallery upload encountered an error: ${error.message}. You can add images later by editing the listing.`);
                setTimeout(() => {
                    this.completeProcess();
                }, 3000);
            } else {
                // Only call handleError if the listing itself wasn't updated
                this.handleError(error, 'Failed to upload gallery images');
            }
        }
    }

    /**
     * Get a fresh CSRF token from the server
     */
    async getFreshCSRFToken() {
        // Use the fresh token from listing update response if available
        if (this.state.freshCSRFToken) {
            console.log('🔐 Using fresh CSRF token from listing update');
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
        // Attempt to compress image proactively if it's larger than server trigger
        const serverTrigger = this.config.serverMaxFileSize || (1 * 1024 * 1024); // 1MB default trigger
        let workingFile = file;

        try {
            if (workingFile.size > serverTrigger) {
                try {
                    const compressOpts = {
                        maxWidth: this.config.compressDefaults.maxWidth,
                        maxHeight: this.config.compressDefaults.maxHeight,
                        quality: this.config.compressDefaults.startQuality,
                        maxSizeKB: Math.max(256, Math.round(workingFile.size / 1024 / 2))
                    };

                    const compressed = await ImageCompressor.compress(workingFile, compressOpts);
                    console.log(`🛠️ Gallery initial compression: ${file.name} -> ${(compressed.size/1024).toFixed(0)}KB`);
                    this.showCompressionNotice(file.size, compressed.size, file.name);
                    workingFile = compressed;
                } catch (e) {
                    console.warn('Gallery compression attempt failed:', e);
                    // continue with original file
                }
            }
        } catch (e) {
            console.warn('Error during initial gallery compression:', e);
        }

        let attempts = 0;
        const maxAttempts = Math.max(1, this.config.maxRetries);

        while (attempts < maxAttempts) {
            try {
                attempts++;
                this.updateProgressText(`Uploading image ${imageNumber} of ${this.state.galleryImages.length}... (attempt ${attempts})`);

                const formData = new FormData();
                formData.append('gallery_image', workingFile, workingFile.name || file.name);

                const csrfToken = await this.getFreshCSRFToken();
                formData.append('_token', csrfToken);

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
                    // If server rejects due to size (413), try more aggressive compression and retry
                    if (response.status === 413) {
                        console.warn(`Upload rejected due to size (attempt ${attempts}/${maxAttempts}). Trying more aggressive compression...`);

                        try {
                            const aggressive = this.config.compressDefaults.aggressive || {};
                            const compressOpts = {
                                maxWidth: aggressive.maxWidth || 1400,
                                maxHeight: aggressive.maxHeight || 900,
                                quality: aggressive.quality || 0.45
                            };

                            if (aggressive.forceWebP) compressOpts.mimeType = 'image/webp';

                            const compressed = await ImageCompressor.compress(workingFile, compressOpts);
                            console.log(`🛠️ Aggressive compression result: ${(compressed.size/1024).toFixed(0)}KB`);
                            this.showCompressionNotice(file.size, compressed.size, file.name);
                            workingFile = compressed;
                            // Retry immediately
                            await this.delay(300);
                            continue; // next attempt
                        } catch (e) {
                            console.warn('Aggressive compression failed:', e);
                            // fall through to generic error handling
                        }
                    }

                    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
                    throw new Error(errorData.message || `HTTP ${response.status}`);
                }

            } catch (error) {
                console.error(`Upload attempt ${attempts} failed for ${file.name}:`, error.message);

                if (attempts < maxAttempts) {
                    this.updateProgressText(`Retrying image ${imageNumber}... (attempt ${attempts + 1})`);
                    await this.delay(this.config.retryDelay);
                    continue;
                } else {
                    console.error(`Failed to upload ${file.name} after ${maxAttempts} attempts`);
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
        const statusContainer = this.elements.statusContainer;

        switch (state) {
            case 'submitting':
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating Listing...';
                }
                statusContainer.style.display = 'block';
                statusContainer.style.background = '#d1ecf1';
                statusContainer.style.color = '#0c5460';
                this.updateProgressText('Updating listing...');
                break;

            case 'uploading':
                if (submitBtn) {
                    submitBtn.disabled = true; // Disable button during upload
                    submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt fa-spin"></i> Uploading Images...';
                    submitBtn.style.background = '#ffc107'; // Orange for uploading
                }
                statusContainer.style.background = '#fff3cd';
                statusContainer.style.color = '#856404';
                this.updateProgressText('Uploading gallery images...');
                break;

            case 'complete':
                if (submitBtn) {
                    submitBtn.disabled = true; // Disable button when complete
                    if (this.state.isComplete) {
                        // Check if we're reloading current page or redirecting
                        const isReloading = this.state.redirectUrl && this.state.redirectUrl.includes('/edit');
                        submitBtn.innerHTML = isReloading
                            ? '<i class="fas fa-sync fa-spin"></i> Reloading with latest changes...'
                            : '<i class="fas fa-check-circle"></i> Complete! Redirecting...';
                        submitBtn.style.background = '#28a745'; // Green for complete
                    }
                }
                statusContainer.style.background = '#d4edda';
                statusContainer.style.color = '#155724';
                break;

            case 'error':
                if (submitBtn) {
                    submitBtn.disabled = false; // Re-enable button on error
                    submitBtn.innerHTML = '<i class="fas fa-sync"></i> Update Listing';
                    submitBtn.style.background = '#007bff'; // Back to primary
                }
                statusContainer.style.background = '#f8d7da';
                statusContainer.style.color = '#721c24';
                break;
        }
    }

    /**
     * Update progress text
     */
    updateProgressText(text) {
        const progressText = this.elements.progressContainer.querySelector('.progress-text');
        if (progressText) {
            progressText.textContent = text;
        }
    }

    /**
     * Update progress info
     */
    updateProgressInfo() {
        const progressCount = this.elements.progressContainer.querySelector('.progress-count');
        if (progressCount) {
            progressCount.textContent = `${this.state.uploadProgress.completed}/${this.state.uploadProgress.total}`;
        }
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        const progressBar = this.elements.progressContainer.querySelector('.progress-bar');
        if (progressBar && this.state.uploadProgress.total > 0) {
            const percentage = (this.state.uploadProgress.completed / this.state.uploadProgress.total) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    /**
     * Show unified progress overlay (like the creator)
     */
    showUnifiedProgress() {
        const overlay = this.elements.statusContainer;
        if (!overlay) return;

        // Ensure progressState has correct totals
        this.progressState.totalSteps = this.progressState.totalSteps || (1 + this.state.galleryImages.length);
        this.progressState.currentStep = this.progressState.currentStep || 0;
        this.progressState.overallProgress = 0;
        this.progressState.isVisible = true;
        this.progressState.currentPhase = 'preparing';

        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        this.updateStepIndicators && this.updateStepIndicators();
        this.updateUnifiedProgress(0, 'Preparing update...');
    }

    /**
     * Update unified progress; keeps the percentage and step indicators in sync
     */
    updateUnifiedProgress(completedSteps, statusText = '', actionDetail = '') {
        if (!this.progressState || !this.progressState.isVisible) return;

        this.progressState.currentStep = completedSteps;
        this.progressState.overallProgress = this.progressState.totalSteps > 0 ?
            Math.round((completedSteps / this.progressState.totalSteps) * 100) : 0;

        // Update circular progress (if present)
        try {
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
                // simple update
                percentageNumber.textContent = String(this.progressState.overallProgress);
            }

            if (statusText && statusTextEl) {
                statusTextEl.textContent = statusText;
            }

            if (actionDetail && actionDetailEl) {
                actionDetailEl.textContent = actionDetail;
                actionDetailEl.style.display = 'block';
            } else if (actionDetailEl) {
                actionDetailEl.style.display = 'none';
            }
        } catch (e) {
            console.warn('updateUnifiedProgress error', e);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.hideError();
        if (window.toaster && window.toaster.success) {
            window.toaster.success('Success!', message);
        } else {
            console.log('✅ SUCCESS:', message);
        }
    }

    /**
     * Show the full-screen progress overlay immediately
     */
    showProgress() {
        try {
            if (this.elements && this.elements.statusContainer) {
                this.elements.statusContainer.style.display = 'flex';
                // Force reflow then fade in
                void this.elements.statusContainer.offsetWidth;
                this.elements.statusContainer.style.opacity = '1';
            }
        } catch (e) {
            console.warn('showProgress error', e);
        }
    }

    /**
     * Hide the full-screen progress overlay
     */
    hideProgress() {
        try {
            if (this.elements && this.elements.statusContainer) {
                this.elements.statusContainer.style.opacity = '0';
                setTimeout(() => {
                    this.elements.statusContainer.style.display = 'none';
                }, 400);
            }
        } catch (e) {
            console.warn('hideProgress error', e);
        }
    }

    /**
     * Called by retry button in error overlay to retry the whole process
     */
    retryProcess() {
        try {
            if (this.state.isSubmitting) {
                console.log('Retry requested but already submitting');
                return;
            }
            this.hideProgress();
            this.handleFormSubmit();
        } catch (e) {
            console.warn('retryProcess error', e);
        }
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.hideError();
        if (window.toaster && window.toaster.warning) {
            window.toaster.warning('Warning', message);
        } else {
            console.warn('⚠️ WARNING:', message);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorContainer = this.elements.errorContainer;
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        }

        if (window.toaster && window.toaster.error) {
            window.toaster.error('Error', message);
        } else {
            console.error('❌ ERROR:', message);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorContainer = this.elements.errorContainer;
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    /**
     * Handle errors and reset state
     */
    handleError(error, context) {
        console.error(`❌ ${context}:`, error);

        this.state.isSubmitting = false;
        this.updateUIState('error');

        let errorMessage = error.message || 'An unexpected error occurred';

        // Handle specific error types
        if (error.message?.includes('413') || error.message?.includes('too large')) {
            errorMessage = 'The uploaded files are too large. Please use smaller images.';
        } else if (error.message?.includes('Network')) {
            errorMessage = 'Network error occurred. Please check your connection and try again.';
        }

        this.showError(errorMessage);
    }

    /**
     * Complete the process and reload current page or redirect
     */
    completeProcess(redirectUrl = null) {
        console.log('🏁 Completing listing update process...');

        this.state.isComplete = true;
        this.updateUIState('complete');

        // Check if we should reload the current edit page
        const finalRedirectUrl = redirectUrl || this.state.redirectUrl;
        const currentUrl = window.location.href;

        // If redirect URL is the current edit page, reload instead of redirect
        if (finalRedirectUrl && finalRedirectUrl.includes('/edit')) {
            // Show single comprehensive success message
            let successMessage = '✅ Listing updated successfully!';

            // Add details about what was updated
            if (this.state.galleryImages.length > 0) {
                if (this.state.uploadProgress.failed === 0) {
                    successMessage += ` All ${this.state.galleryImages.length} gallery images uploaded.`;
                } else {
                    const successCount = this.state.uploadProgress.completed;
                    successMessage += ` ${successCount}/${this.state.galleryImages.length} gallery images uploaded.`;
                }
            }

            successMessage += ' Page reloading with latest changes...';
            this.showSuccess(successMessage);

            setTimeout(() => {
                console.log('🔄 Reloading current edit page with latest changes');

                // Clear the form state before reload to prevent interference
                this.resetFormState();

                // Reload the current page to show updated data
                window.location.reload();
            }, 2000);
        } else {
            // Fallback to redirect behavior
            const fallbackUrl = finalRedirectUrl || '/affiliate/dashboard/listings';

            setTimeout(() => {
                console.log('🔄 Redirecting to:', fallbackUrl);
                window.location.href = fallbackUrl;
            }, 2000);
        }
    }

    /**
     * Reset form state to allow for fresh editing after update
     */
    resetFormState() {
        // Reset internal state
        this.state.isSubmitting = false;
        this.state.isComplete = false;
        this.state.listingUpdated = false;
        this.state.galleryImages = [];
        this.state.uploadProgress = {
            total: 0,
            completed: 0,
            failed: 0
        };

        // Clear any uploaded files from gallery input
        if (this.elements.galleryInput) {
            this.elements.galleryInput.value = '';
        }

        console.log('🔄 Form state reset for fresh editing');
    }

    /**
     * Delay utility function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-initialize when DOM is ready (for backward compatibility)
document.addEventListener('DOMContentLoaded', function() {
    // Only auto-initialize if not already initialized manually
    if (!window.listingEditor) {
        const updateForm = document.getElementById('listingUpdateForm');
        if (updateForm) {
            console.log('🚀 Auto-initializing ListingEditor for update form...');
            try {
                window.listingEditor = new ListingEditor('#listingUpdateForm');
                console.log('✅ ListingEditor auto-initialized successfully');
            } catch (error) {
                console.error('❌ Failed to auto-initialize ListingEditor:', error);
                // Fallback to original behavior if initialization fails
                console.log('⚠️ Falling back to original form submission');
            }
        }
    } else {
        console.log('✅ ListingEditor already initialized manually');
    }
});
