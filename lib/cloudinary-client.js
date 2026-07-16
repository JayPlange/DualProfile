/**
 * DualProfile Cloudinary Client
 * Handles photo uploads to Cloudinary via unsigned upload preset.
 * No API key needed in client - uses unsigned upload preset.
 */
const CloudinaryClient = {
  /**
   * Upload a photo to Cloudinary.
   * Accepts base64 data URL or Blob.
   * @param {string|Blob} photo - Base64 data URL string or Blob
   * @returns {Promise<{url: string, publicId: string}>}
   */
  async uploadPhoto(photo) {
    const cloudName = DualProfileConfig.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = DualProfileConfig.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) throw new Error('Cloudinary cloud name not configured');
    if (!uploadPreset) throw new Error('Cloudinary upload preset not configured');

    // Convert base64 to Blob if needed
    let blob;
    if (typeof photo === 'string' && photo.startsWith('data:')) {
      blob = this._dataURLtoBlob(photo);
    } else if (photo instanceof Blob) {
      blob = photo;
    } else {
      throw new Error('Invalid photo format: expected base64 data URL or Blob');
    }

    // Resize before uploading to stay within free tier limits
    const resizedBlob = await this._resizeImage(blob, DualProfileConfig.MAX_PHOTO_DIMENSION);

    const formData = new FormData();
    formData.append('file', resizedBlob, 'profile.jpg');
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'dualprofile');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} ${text}`);
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  },

  /**
   * Convert a base64 data URL to a Blob.
   * @param {string} dataURL - Base64 data URL
   * @returns {Blob}
   */
  _dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const raw = atob(parts[1]);
    const array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
  },

  /**
   * Resize an image blob to max dimensions.
   * Uses OffscreenCanvas in service worker or Canvas in page context.
   * @param {Blob} blob - Image blob
   * @param {number} maxDim - Maximum width/height in pixels
   * @returns {Promise<Blob>} - Resized image blob
   */
  async _resizeImage(blob, maxDim) {
    // In service worker context, OffscreenCanvas may not be available
    // or createImageBitmap may not work. Return original if resize fails.
    try {
      const bitmap = await createImageBitmap(blob);
      const { width, height } = bitmap;

      // Skip resize if already small enough
      if (width <= maxDim && height <= maxDim) {
        bitmap.close();
        return blob;
      }

      const scale = maxDim / Math.max(width, height);
      const newW = Math.round(width * scale);
      const newH = Math.round(height * scale);

      // Use OffscreenCanvas (works in service workers and modern browsers)
      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(newW, newH);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, newW, newH);
        bitmap.close();
        return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
      }

      // Fallback: use regular canvas (popup/content script context)
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0, newW, newH);
        bitmap.close();

        return new Promise((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
      }

      bitmap.close();
      return blob;
    } catch (e) {
      return blob;
    }
  }
};

// Export for different contexts
if (typeof module !== 'undefined') {
  module.exports = CloudinaryClient;
}
