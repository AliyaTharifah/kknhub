/**
 * KKNHub Client-Side Canvas Image Compressor
 * Compresses images client-side before uploading to Supabase Storage.
 * Safe for React 19 and Edge browsers (no native node dependencies).
 */

export async function compressImage(file: File, maxDimension = 1200, quality = 0.7): Promise<File> {
  // Only compress images
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions keeping aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file); // Fallback to original if context fails
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            
            // Create a new File from compressed Blob
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error("Gagal memuat gambar untuk kompresi."));
      };
    };
    
    reader.onerror = () => {
      reject(new Error("Gagal membaca file gambar."));
    };
  });
}
