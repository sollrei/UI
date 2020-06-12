import u from '../base/util.js';
import Upload from './Upload.js';

// move this js file to common

class UploadHelper {
  constructor(selector, options) {
    const defaultSettings = {
      url: ''
    };

    this.settings = Object.assign({}, defaultSettings, options);

    this.init(selector);
  }

  init(selector) {
    let element = selector;

    if (typeof selector === 'string') {
      element = document.querySelector(selector);
    }

    if (!element) return;

    const input = element.querySelector('input[type="file"]');

    this.wrap = element;
    this.input = input;

    if (element.hasAttribute('data-drag')) {
      this.dragEvents();
    }

    if (input.hasAttribute('accept')) {
      this.settings.fileType = input.getAttribute('accept').split(',');
    }

    if (u.hasClass(element, 'ui-upload-img')) {
      this.singleUpload();
    }

    this.inputEvent();
  }

  createUpload(input) {
    const { url } = this.settings;

    new Upload(url, input, this.settings);

    // input.value = ''; // eslint-disable-line
  }

  singleUpload() {
    const { wrap } = this;
    const trigger = wrap.querySelector('.trigger');
    const image = wrap.querySelector('.image');
    const self = this;

    u.on(wrap, 'click', '.js-clean', function () {
      u.removeClass(trigger, 'hidden');
      u.addClass(image, 'hidden');
      image.innerHTML = '';
      self.input.value = '';
    });
  }

  inputEvent() {
    const { input } = this;
    const self = this;

    input.addEventListener('change', function () {
      self.createUpload(this);
    });
  }

  dragEvents() {
    const { wrap } = this;
    const self = this;

    wrap.addEventListener('dragenter', function (e) {
      e.preventDefault();
      e.stopPropagation();

      u.addClass(this, 'highlight');
    }, false);

    wrap.addEventListener('dragleave', function (e) {
      e.preventDefault();
      e.stopPropagation();

      u.removeClass(this, 'highlight');
    }, false);

    wrap.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.stopPropagation();

      u.addClass(this, 'highlight');
    }, false);

    wrap.addEventListener('drop', function (e) {
      e.preventDefault();
      e.stopPropagation();

      u.removeClass(this, 'highlight');
      
      const files = e.dataTransfer.files;

      self.createUpload(files);
    }, false);
  }
}

/**
 * @param selector
 * @param options
 */
export default function (selector, options) {
  if (typeof selector === 'string') {
    const element = document.querySelectorAll(selector);
    u.forEach(element, item => {
      new UploadHelper(item, options);
    });
    return;
  }
  
  if (typeof selector === 'object') {
    if (selector.length) {
      u.forEach(selector, item => {
        new UploadHelper(item, options);
      });
      return;
    }
    new UploadHelper(selector, options);
  }
}
