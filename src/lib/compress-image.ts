export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<File> {
  // Skip: non-images, HEIC/HEIF (Canvas can't decode), GIF (preserve animation)
  if (
    !file.type.startsWith("image/") ||
    ["image/heic", "image/heif", "image/gif"].includes(file.type)
  ) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const needsResize = width > maxDimension || height > maxDimension;
      if (!needsResize && file.size < 300_000) {
        resolve(file);
        return;
      }
      if (needsResize) {
        if (width >= height) {
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
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };
    img.src = url;
  });
}
