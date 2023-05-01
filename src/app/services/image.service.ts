import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Solution borrowed from:
 * https://stackoverflow.com/a/39235724/6454252
 */

export interface ImageOptions {
  /** Maximum image width in pixels. */
  maxWidth?: number;
  /** Maximum image height in pixels. */
  maxHeight?: number;
  /** JPEG or PNG. Using JPEG will lose transparency. */
  type?: 'png' | 'jpeg';
}

const DEFAULT_SIZE = 400;
const DEFAULT_FORMAT = 'jpeg';

const dataURLtoBlob = (dataURI: string) => {
  const bytes =
    dataURI.split(',')[0].indexOf('base64') >= 0 ? atob(dataURI.split(',')[1]) : unescape(dataURI.split(',')[1]);
  const mime = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const max = bytes.length;
  const ia = new Uint8Array(max);
  for (let i = 0; i < max; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ia], { type: mime });
};

const resize = (
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  options: ImageOptions = { maxWidth: DEFAULT_SIZE, maxHeight: DEFAULT_SIZE, type: DEFAULT_FORMAT }
) => {
  const { maxHeight = DEFAULT_SIZE, maxWidth = DEFAULT_SIZE, type = DEFAULT_FORMAT } = options;
  let width = image.width;
  let height = image.height;

  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, width, height);

  if (type === 'jpeg') {
    // Set the transparent background of canvas to white
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      // When the pixel is transparent, it is set to white
      if (imageData.data[i + 3] == 0) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 255;
        imageData.data[i + 2] = 255;
        imageData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  const dataUrl = canvas.toDataURL(`image/${type}`);
  return { dataUrl, blob: dataURLtoBlob(dataUrl) };
};

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  constructor() {}

  resizeImage = (file: File, options?: ImageOptions): Observable<{ dataUrl: string; blob: Blob }> => {
    const reader = new FileReader();
    const image = new Image();
    const canvas = document.createElement('canvas');

    return new Observable((subscriber) => {
      if (!file.type.match(/image.*/)) {
        subscriber.error(new Error('Not an image'));
        return;
      }
      reader.onload = (readerEvent: any) => {
        image.onload = () => {
          subscriber.next(resize(image, canvas, options));
          subscriber.complete();
        };
        image.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);
    });
  };
}
