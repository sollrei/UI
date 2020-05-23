import u from '../base/util.es6';
import SelectBase from './SelectBase.es6';

class Select extends SelectBase {
  constructor(elementSelector, options) {
    const defaultSettings = {
      selectedClass: 'selected',

      showClass: 'show',

      selectClass: 'ui-select ui-form-control',
      optionClass: 'ui-select-dropdown hide',

      valueName: 'value',
      labelName: 'label',

      placeholder: '',
      emptyLabel: '<span class="ft-light select-empty">请选择</span>',
      emptyLi: '暂无选项',

      group: false,
      clearable: false,
      multiple: false,
      enterable: false,
      max: null,
      checkable: false,
      search: false,

      data: null,
      selectFn: null,
      optionTemplate: null, // function 
      tagClass: null // function or string
    };

    const settings = Object.assign({}, defaultSettings, options);

    if (settings.placeholder) {
      settings.emptyLabel = '<span class="ft-light select-empty">' + settings.placeholder + '</span>';
    }

    super(settings);

    this.init(elementSelector);
  }

  /**
   * @method
   * @param {NodeList} element
   * 
   * 
   * this.data  [{label, value, selected[boolean]}]
   * this.cache {id: {label, value}}
   * */
  init(ele) {
    let element = ele;
    if (!element) return;

    let nodeName = element.nodeName.toLowerCase();
    if ((nodeName !== 'select') && (nodeName !== 'input')) return;

    this.value = [];
    this.cache = {};
    this.nodeType = nodeName;

    const { data, group, max, search, checkable, clearable, enterable, multiple } = this.settings;

    this.data = data;
    this.multiple = multiple;
    this.max = max;
    this.group = group;
    this.search = search;
    this.checkable = checkable;
    this.clearable = clearable;
    this.enterable = enterable;

    if (element.multiple || element.hasAttribute('data-multiple')) {
      this.multiple = true;
    }

    if (element.hasAttribute('data-max')) {
      this.max = Number(element.getAttribute('data-max'));
    }

    if (element.querySelector('optgroup')) {
      this.group = true;
    }

    if (element.hasAttribute('data-search')) {
      this.search = true;
    }

    if (element.hasAttribute('data-checkable')) {
      this.checkable = true;
    }

    if (element.hasAttribute('data-clearable')) {
      this.clearable = true;
    }

    if (element.hasAttribute('data-enterable')) {
      this.enterable = true;
    }

    if (element.hasAttribute('data-placeholder')) {
      this.settings.placeholder = element.getAttribute('data-placeholder');
      this.settings.emptyLabel = '<span class="ft-light select-empty">' 
        + this.settings.placeholder
        + '</span>';
    }

    if (!this.data) {
      this.data = this.getDataFromSelect(element);
    } else {
      this.createCacheFromData(this.data);
    }

    this.initSelect(element);
  }

  getDataFromSelect(element, parentId) {
    const elements = element.children;

    return [].slice.call(elements).map(item => {
      const nodeName = item.nodeName.toLowerCase();
      if (nodeName === 'option') {
        const { label, value, selected, disabled } = item;
        const _data = { label, value, disabled }; // 去掉了selected

        if (selected) {
          this.value.push(item.value);
        }

        if (parentId) {
          _data.parent = parentId;
        }

        this.cache[value] = _data;
        return _data;
      } if (nodeName === 'optgroup') {
        const id = u.createId();
        const child = [].slice.call(item.children).map(itm => itm.value);
        this.cache[id] = child;

        return {
          id,
          child, // children id array
          label: item.label,
          options: this.getDataFromSelect(item, id),
          type: 'optgroup'
        };
      }
      return null;
    });
  }

  createCacheFromData(data) {
    const { labelName, valueName } = this.settings;

    this.data = data.map(item => {
      const label = item[labelName];
      const value = item[valueName];
      const { selected } = item;

      if (selected) {
        this.value.push(value);
      }

      return Object.assign({}, item, {
        label, value, selected: false
      });
    });

    data.forEach(item => {
      const { type, child, options } = item;
      const label = item[labelName];
      const value = item[valueName];
      
      if (type === 'optgroup' || child || options) {
        const id = value || item.id;
        let _child = item.child;

        if (!_child && options) {
          _child = options.map(itm => itm.value);
          this.createCacheFromData(options);
        }

        this.cache[id] = _child;
        return;
      }
      // if (selected) {
      //   this.value.push(value);
      // }
      
      this.cache[value] = Object.assign({}, item, {
        label,
        value,
        selected: false
      });
    });
  }

  /**
   * @method
   * create new element to exchange select element
   * @param {HTMLElement} item
   * */
  initSelect(item) {
    const element = item;
    const { select, value, label } = this.createSelectDom(item);

    // hide original select element
    element.style.display = 'none';

    this.select = select;

    select.option = this.createOptionWrap(element);
    // select.option.innerHTML = this.createDropdown();
    this.createDropdown();
    select.options = select.option.querySelectorAll('.menu-item');

    const width = Math.max(select.clientWidth, select.option.clientWidth);
    
    select.option.style.width = width === 0 ? '100%' : width + 'px';
    select.originElement = element;

    // set default value
    // won't trigger 'change' event
    if (this.multiple) {
      this.changeMultiSelectValue(false, 'init');
    } else {
      this.changeSelectValue(select, value, label, false, 'init');
    }
    
    // bind event
    this.bindEvent();

    return select;
  }

  /**
   * @method
   * create new select element
   * @param {HTMLElement} element
   * @returns {Object}
   * */
  createSelectDom(element) {
    const { selectClass, emptyLabel } = this.settings;
    const dataClass = element.getAttribute('data-class') || '';
    let className = selectClass;
    
    if (dataClass) {
      className += ' ' + dataClass;
    }

    if (this.multiple) {
      className += ' multiple';
    }

    if (this.group) {
      className += ' group';
    }

    if (this.clearable) {
      className += ' clearable';
    }

    if (this.enterable) {
      className += ' enterable';
    }

    const selectUI = u.createElement('div', { className });

    const value = this.value[0];
    
    let label = value ? this.cache[value].label : emptyLabel;

    const wrap = element.parentNode;

    return {
      select: wrap.appendChild(selectUI),
      value,
      label
    };
  }

  // to base
  createOptionWrap(element) {
    let { optionClass } = this.settings;
    if (this.group) {
      optionClass += ' group';
    }

    if (this.multiple) {
      optionClass += ' multiple';
    }

    if (this.checkable) {
      optionClass += ' checkable';
    }

    if (this.max && this.value.length >= this.max) {
      optionClass += ' no-add';
    }

    const optionUI = u.createElement('div', { className: optionClass });

    const wrap = element.parentNode;

    return wrap.appendChild(optionUI);
  }

  /**
   * @method
   * create new 'option'
   * @param {HTMLElement} element
   * @returns {String}
   * */
  createDropdown(match) {
    let domString = '<div class="select-ul">';
    const { emptyLi } = this.settings;

    if (this.search) {
      domString += Select.createSearch() + '<ul class="select-main">';
    }

    domString += '<ul class="select-main">' + (this.createOptionContent(this.data, match) || `<li class="li-empty">${emptyLi}</li>`);

    this.select.option.innerHTML = domString + '</ul></div>';
  }

  /**
   * create main options list
   * @param element {HTMLElement} origin select
   * @param match {string|any} search content
   */ 
  createOptionContent(data, match, option) {
    return data.reduce((str, item) => {
      if (item.type && item.type === 'optgroup') {
        return str + this.createOptionGroup(item, match);
      }
      return str + this.createOptionSingle(item, match, option);
    }, '');
  }

  createOptionGroup(optgroup, match) {
    let { options, label, id } = optgroup;
    const str = this.createOptionContent(options, match);

    if (!str) return '';
    
    const className = ' expend';

    if (this.checkable) {
      label = `<label class="ui-checkbox"><input type="checkbox" class="check-group" value="${id}"><i class="iconfont"></i>${label}</label>`;
    }
    
    return `<li class="option-group">
              <div class="group-label${className}">
                <i class="iconfont icon-caret-right"></i>
                ${label}</div>
              <ul class="group-ul">
              ${str}
              </ul>
            </li>`;
  }

  createOptionSingle(item, match) {
    const { optionTemplate } = this.settings;

    if (match && item.label.indexOf(match) === -1) return '';

    if (this.checkable) {
      return Select.createOptionWithCheckbox(item);
    }
    
    if (optionTemplate) {
      const str = optionTemplate(item);
      let tpl = str;
      let className = '';
      if (typeof str === 'object') {
        tpl = str.tpl || '';
        className = str.className || '';
      }
      return this.createOptionItem(item, { tpl, className });
    }
    
    return this.createOptionItem(item);
  }

  static createSearch() {
    const searchDom = `<div class="select-search">
      <input type="search" class="ui-form-control">
    </div>`;
    return searchDom;
  }

  static createOptionWithCheckbox({ selected, value, label, disabled }) {
    const checked = selected ? 'checked' : '';
    let className = disabled ? 'disabled' : '';
    return `<li class="menu-item label-item ${className}" title="${label}" data-value="${value}">
      <label class="ui-checkbox"><input type="checkbox" ${checked} value="${value}"/><i class="iconfont"></i>${label}</label>
    </li>`;
  }

  changeCheck(checkbox) {
    if (u.hasClass(checkbox, 'check-group')) {
      this.changeCheckParent(checkbox);
    } else {
      const checked = checkbox.checked;
      this.changeCacheValue(checkbox.value, checked);
      this.changeCheckAll(checkbox.value);
    }

    this.changeMultiSelectValue(true);
  }

  changeCheckParent(checkbox) {
    const parent = checkbox.value;
    const { checked } = checkbox;
    const child = this.cache[parent];

    child.forEach(id => {
      this.select.option.querySelector('[value="' + id + '"]').checked = checked;
    });

    this.changeCacheValue(child, checked);
  }

  changeCheckAll(value) {
    const { parent } = this.cache[value];
    if (!parent) return;

    const child = this.cache[parent];
    const checkbox = this.select.option.querySelector('[value="' + parent + '"]');
    let check = true;
    let indeterminate = false;

    child.forEach(itm => {
      const { selected } = this.cache[itm];
      if (selected) {
        indeterminate = true;
      } else {
        check = false;
      }
    });

    checkbox.checked = check;
    checkbox.indeterminate = !check && indeterminate;
  }

  toggleItemSelected(value) {
    const add = this.value.indexOf(value) === -1;
    this.changeCacheValue(value, add);
  }

  changeCacheValue(value, add) {
    if (!this.multiple) {
      this.value = [value];
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        this.dealMultiValue(item, add);
      });
    } else {
      this.dealMultiValue(value, add);
    }
  }

  resetValue(value) {
    const self = this;

    if (Array.isArray(value)) {
      this.value = value;

      if (this.multiple) {
        this.changeMultiSelectValue(false, 'change');
      } else {
        const select = self.select;
        const label = self.cache[value].label;
        self.changeSelectValue(select, value, label);
        self.changeMultiSelectedClass();
      }
    }
  }

  dealMultiValue(value, add) {
    const { select, max } = this;
    const index = this.value.indexOf(value);
    
    if (add) {
      if (index === -1) {
        this.value.push(value);
      }
    } else if (index > -1) {
      this.value.splice(index, 1);
    }

    if (max) {
      if (this.value.length >= max) {
        u.addClass(select.option, 'no-add');
      } else {
        u.removeClass(select.option, 'no-add');
      }
    }
  }

  changeMultiSelectedClass() {
    const { select, value } = this;
    const { selectedClass } = this.settings;

    u.forEach(select.option.querySelectorAll('.menu-item'), item => {
      const _value = item.getAttribute('data-value');
      if (value.indexOf(_value) > -1) {
        u.addClass(item, selectedClass);
      } else {
        u.removeClass(item, selectedClass);
      }
    });
  }

  changeOriginElementValue(eventType) {
    const { select, nodeType, value } = this;
    const originElement = select.originElement;

    if (nodeType === 'input') {
      originElement.value = this.value;
    }

    if (nodeType === 'select') {
      const options = originElement.options;

      if (Array.isArray(value)) {
        u.forEach(options, item => {
          item.selected = value.indexOf(item.value) > -1;
        });
      }
    }

    originElement.trigger(eventType);
  }

  /**
   * @param {Boolean} show
   * @param {String} type
   * */
  changeMultiSelectValue(show = false, type = 'change') {
    const { select } = this;
    this.changeOriginElementValue(type);

    if (!show) {
      this.hideOption(select);
    }
    
    this.changeMultiSelectLabel(type);
    this.changeMultiSelectedClass();
  }

  changeMultiSelectLabel(type) {
    const { select } = this;
    select.innerHTML = this.createMultiTag() || this.settings.emptyLabel;

    if (this.enterable && type === 'change') {
      select.querySelector('.select-input').focus();
      this.createDropdown();
    }
  }

  createEnterInput() {
    const { value, enterable } = this;
    const { placeholder } = this.settings;

    if (!enterable) {
      return '';
    }

    if (!value.length) {
      return `<input class="select-input" placeholder="${placeholder}" autocomplete="off">`;
    }

    return '<input class="select-input" autocomplete="off" >';
  }

  createMultiTag() {
    const values = this.value;
    const { tagClass } = this.settings;
    let input = this.createEnterInput();

    if (!values.length) {
      return input || this.settings.emptyLabel;
    }

    const str = values.reduce((result, item) => {
      const data = this.cache[item];
      let tagClassName = 'gray';
      let label;
      let value;

      if (this.enterable && !data) {
        label = item;
        value = item;
      } 
      
      if (data) {
        label = data.label;
        value = data.value;
      }
      
      if (tagClass) {
        if (typeof tagClass === 'string') {
          tagClassName = tagClass;
        }
        if (typeof tagClass === 'function') {
          tagClassName = tagClass(data);
        }
      }

      return result + `<span class="ui-tag ${tagClassName} closeable" data-tooltip data-position="center top" data-title="${label}">${label} <i data-value="${value}" class="iconfont icon-times js-del-selected"></i></span>`;
    }, '');

    return str + input;
  }

  checkLabels(val) {
    const { cache } = this;
    
    let _v;

    Object.keys(cache).forEach(key => {
      const { value, label } = cache[key];
      if (label === val) {
        _v = value;
      }
    });

    if (typeof _v === 'undefined') {
      const id = 'cus-' + u.createId();
      this.cache[id] = {
        label: val,
        value: id
      };

      this.changeCacheValue(id, true);
    } else {
      let bool = !(this.value.indexOf(_v) > -1);
      this.changeCacheValue(_v, bool);
    }
    
    this.changeMultiSelectLabel('change');
  }

  dealSelectEnter(e, input) {
    const self = this;

    clearTimeout(self.inputTimer);

    if (e.keyCode === 13) {
      e.preventDefault();
      
      const value = input.value;

      if (value.trim().length) {
        self.checkLabels(value);
      }
    }
  }

  /**
   * @method
   * @param {Object} select
   * */
  bindEvent() {
    const select = this.select;
    const option = select.option;
    const self = this;
    const selectFn = this.settings.selectFn;

    this.selectClickEvent(select, function () {
      if (self.enterable) {
        // select.option.innerHTML = self.createDropdown();
        self.createDropdown();
      }
    });

    u.on(select, 'keydown', '.select-input', function (e) {
      e.stopPropagation();
      
      self.dealSelectEnter(e, this);
    });

    u.on(select, 'click', '.select-input', function (e) {
      e.stopPropagation();
      self.showOption(select);
    });

    u.on(option, 'click', '.menu-item', function (e) {
      e.stopPropagation();
      
      // group label
      if (u.hasClass(this, 'label-item')) return;

      // disabled item
      if (u.hasClass(this, 'disabled')) return;

      // max limit
      if (self.max && self.value.length >= self.max && !u.hasClass(this, 'selected')) {
        return;
      }

      // single select [selected]
      if (!self.multiple && u.hasClass(this, 'selected')) {
        self.hideOption(select);
        return;
      }

      const value = this.getAttribute('data-value');
      const { label } = self.cache[value];

      if (selectFn && typeof selectFn === 'function') {
        selectFn(value, select);
      }

      self.toggleItemSelected(value);

      if (self.multiple) {
        self.changeMultiSelectValue(true);
      } else {
        self.changeSelectValue(select, value, label);
        self.changeMultiSelectedClass();
      }
    });

    u.on(option, 'click', '.group-label', function (e) {
      e.stopPropagation();

      u.toggleClass(this, 'expend');
    });

    u.on(option, 'change', 'input', function () {
      self.changeCheck(this);
    });

    u.on(option, 'click', '.select-search', function (e) {
      e.stopPropagation();
    });

    this.inputTimer = null;

    u.on(select, 'input', '.select-input', function () {
      clearTimeout(self.inputTimer);

      self.inputTimer = setTimeout(() => {
        const val = this.value;
        const main = self.createOptionContent(self.data, val);
        let con = main || '<li class="li-empty">暂无搜索结果</li>';

        option.querySelector('.select-main').innerHTML = con;
      }, 200);
    });
  }
}

export default function (selector, options) {
  if (typeof selector === 'string') {
    const elements = document.querySelectorAll(selector);

    return [].slice.call(elements).map(item => {
      return new Select(item, options);
    });
  } 

  if (typeof selector === 'object' && selector !== null) {
    return new Select(selector, options);
  }

  return null;
}
