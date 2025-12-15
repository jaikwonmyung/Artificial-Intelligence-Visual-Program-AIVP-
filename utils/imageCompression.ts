export const compressBase64Image = async (
    base64: string,
    maxSizeBytes: number = 500000, // 500KB
    quality: number = 0.8
): Promise<string> => {
    // Already small enough?
    if (base64.length <= maxSizeBytes) {
        return base64;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Maintain aspect ratio, max dim 2048
            const maxDim = 2048;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = (height / width) * maxDim;
                    width = maxDim;
                } else {
                    width = (width / height) * maxDim;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG
            // Note: toDataURL returns "data:image/jpeg;base64,..."
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            // We usually store the full data URL in history, so return as is, or split if needed.
            // App.tsx usually stores full URL in history.
            resolve(compressedDataUrl);
        };

        img.onerror = () => reject(new Error('Failed to load image for compression'));

        // Handle if incoming base64 is just raw data or data URL
        img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
    });
};
