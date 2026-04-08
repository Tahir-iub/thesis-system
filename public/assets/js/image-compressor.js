/**
 * Client-side image compression utility.
 * Compresses images using Canvas API before upload to avoid 413 (Request Entity Too Large) errors.
 */
var ImageCompressor = (function () {
    var defaults = {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        maxSizeKB: 1024, // 1MB target
        mimeType: 'image/jpeg'
    };

    /**
     * Compress a File object and return a Promise that resolves to a compressed File.
     * @param {File} file - The original image file
     * @param {Object} options - Override defaults (maxWidth, maxHeight, quality, maxSizeKB)
     * @returns {Promise<File>} Compressed file
     */
    function compress(file, options) {
        options = $.extend({}, defaults, options || {});

        return new Promise(function (resolve, reject) {
            // Skip non-image files or SVGs (can't canvas-compress SVG)
            if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
                resolve(file);
                return;
            }

            // If already under target size, skip compression
            if (file.size <= options.maxSizeKB * 1024) {
                resolve(file);
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    var canvas = document.createElement('canvas');
                    var width = img.width;
                    var height = img.height;

                    // Scale down if exceeds max dimensions
                    if (width > options.maxWidth || height > options.maxHeight) {
                        var ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;

                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to blob with quality reduction
                    var quality = options.quality;
                    var outputType = options.mimeType;

                    // Use original type if it's webp
                    if (file.type === 'image/webp') {
                        outputType = 'image/webp';
                    }

                    (function tryCompress(q) {
                        canvas.toBlob(function (blob) {
                            if (!blob) {
                                resolve(file); // fallback to original
                                return;
                            }

                            // If still too large and quality can be reduced, try again
                            if (blob.size > options.maxSizeKB * 1024 && q > 0.4) {
                                tryCompress(q - 0.1);
                                return;
                            }

                            // Create a new File from the blob
                            var compressedFile = new File([blob], file.name, {
                                type: outputType,
                                lastModified: Date.now()
                            });

                            console.log(
                                'Image compressed: ' +
                                (file.size / 1024).toFixed(0) + 'KB -> ' +
                                (compressedFile.size / 1024).toFixed(0) + 'KB' +
                                ' (quality: ' + q.toFixed(1) + ')'
                            );

                            resolve(compressedFile);
                        }, outputType, q);
                    })(quality);
                };

                img.onerror = function () {
                    resolve(file); // fallback to original on error
                };

                img.src = e.target.result;
            };

            reader.onerror = function () {
                resolve(file); // fallback to original on error
            };

            reader.readAsDataURL(file);
        });
    }

    /**
     * Compress image files in a FormData object before submission.
     * @param {HTMLFormElement} form - The form element
     * @param {Object} fieldConfigs - Map of field names to compression options
     *   e.g. { category_image: { maxWidth: 1920, maxSizeKB: 1024 }, icon_image: { maxWidth: 256, maxSizeKB: 512 } }
     * @returns {Promise<FormData>} FormData with compressed images
     */
    function compressFormImages(form, fieldConfigs) {
        var formData = new FormData(form);
        var promises = [];

        Object.keys(fieldConfigs).forEach(function (fieldName) {
            var input = form.querySelector('input[name="' + fieldName + '"]');
            if (input && input.files && input.files[0]) {
                var file = input.files[0];
                var config = fieldConfigs[fieldName];

                promises.push(
                    compress(file, config).then(function (compressedFile) {
                        formData.delete(fieldName);
                        formData.append(fieldName, compressedFile, compressedFile.name);
                    })
                );
            }
        });

        if (promises.length === 0) {
            return Promise.resolve(formData);
        }

        return Promise.all(promises).then(function () {
            return formData;
        });
    }

    return {
        compress: compress,
        compressFormImages: compressFormImages
    };
})();
