import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Solution borrowed from:
 * https://stackoverflow.com/a/39235724/6454252
 */

export interface ImageOptions {
  /** Maximum image size in pixels */
  maxSize?: number;
}

const DEFAULT_SIZE = 500;

const dataURItoBlob = (dataURI: string) => {
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
  options: ImageOptions = { maxSize: DEFAULT_SIZE }
) => {
  const { maxSize = DEFAULT_SIZE } = options;
  let width = image.width;
  let height = image.height;

  if (width > height) {
    if (width > maxSize) {
      height *= maxSize / width;
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width *= maxSize / height;
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg');
  return { dataUrl, blob: dataURItoBlob(dataUrl) };
};

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  constructor() {}

  resizeImage = (file: File, options: ImageOptions): Observable<{ dataUrl: string; blob: Blob }> => {
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
