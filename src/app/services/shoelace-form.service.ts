import { Injectable } from '@angular/core';

/**
 * This is meant to be a fallback for the currently not existing
 * Shoelace UI form controls. See more:
 * https://github.com/shoelace-style/shoelace/issues/472
 */

@Injectable({
  providedIn: 'root'
})
export class ShoelaceFormService {

  constructor() { }

  resetForm(formControls: HTMLInputElement[]): void {
    for (const control of formControls) {
      switch (control.tagName.toLowerCase()) {
        case 'input':
          control.type === 'checkbox' || control.type === 'radio' ? control.checked = false : control.value = '';
          control.setCustomValidity('');
          break;
        case 'sl-checkbox':
        case 'sl-radio':
          control.checked = false;
          break;
        default:
          control.value = '';
      }
    }
  }
}
