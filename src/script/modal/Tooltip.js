import u from '../base/util.js';
import Position from './Position.js';

const doc = document;

class Tooltip extends Position {
  constructor(selector, options) {
    const defaultSetting = {
      className: 'ui-tooltip',
      position: 'left bottom',
      // x: left center right  y: top bottom
      width: '',
      maxWidth: '',

      gap: 4,
      
      showEvent: 'mouseover',
      hideEvent: 'mouseout',
      template: null
    };

    const settings = Object.assign({}, defaultSetting, options);

    super(settings);

    this.settings = settings;

    this.init(selector);
  }

  init(selector) {
    const self = this;
    const { showEvent, hideEvent } = this.settings;


    u.on(doc, showEvent, selector, function (e) {
      if (e.target.matches(selector)) {
        this.timer = setTimeout(() => {
          self.showTooltip(this);
        }, 200);
      }
    });

    u.on(doc, hideEvent, selector, function (e) {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      Tooltip.destroyTooltip(this.tooltip, this);
    });
  }

  showTooltip(element) {
    const self = this;
    const ele = element;
    const { width, maxWidth } = this.settings;
    if (ele.noTooltip) return;

    const title = ele.getAttribute('data-title');
    
    if (title) {
      if (ele.scrollWidth <= ele.offsetWidth) {
        ele.noTooltip = true;
        return;
      }
    }
    
    const data = ele.getAttribute('data-position');
    const position = data || this.settings.position;
    const tooltip = this.createTooltipElement(ele, position);
    const style = tooltip.style;

    style.display = 'block';
    style.opacity = '0';

    if (width) {
      style.width = width + 'px';
      style.maxWidth = 'none';
    }

    if (maxWidth) {
      style.maxWidth = maxWidth + 'px';
    }

    style.left = '0';
    style.bottom = '0';

    ele.tooltip = tooltip;

    setTimeout(() => {
      style.left = 'auto';
      style.bottom = 'auto';
      self.setPosition(tooltip, element);
      style.opacity = '1';
    }, 0);
  }

  static destroyTooltip(tooltipElement, ele) {
    const tip = tooltipElement;

    if (tip) {
      tip.parentNode.removeChild(tip);
      ele.tooltip = null;
    }
  }

  createTooltipElement(element, position) {
    const { template } = this.settings;
    let text = element.getAttribute('data-text');
    const title = element.getAttribute('data-title');
    const dataTip = element.querySelector('.data-tip') ? element.querySelector('.data-tip').innerHTML : '';

    text = (dataTip || text || title);
    
    const { className } = this.settings;

    if (typeof template === 'function') {
      text = template(text);
    }

    const dom = u.createElement('div', { className: `${className} ${position}` }, text);
    return document.body.appendChild(dom);
  }
}

export default Tooltip;
