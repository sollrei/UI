const util = {
  IEVersion() {
    const agent = window.navigator.userAgent;
    const index = agent.indexOf('MSIE');

    return index > 0 || agent.match(/Trident.*rv:11\./)
      ? parseInt(agent.substring(index + 5, agent.indexOf('.', index)), 10)
      : 999;
  },

  forEach(arrLike, callback) {
    [].slice.call(arrLike).forEach(callback);
  },

  isEmpty(value) {
    return value === undefined ||
            value === null ||
            (typeof value === 'object' && Object.keys(value).length === 0) ||
            (typeof value === 'string' && value.trim().length === 0);
  },

  hasClass(element, className) {
    if (!element) return false;

    if (!element.className) return false;
    
    return className.match(/(\w|-)+/g).every(function (item) {
      return element.classList.contains(item);
    });
  },

  // addClass removeClass toggleClass ie10+
  addClass(element, className) {
    if (!element || !className) return;

    if (element.classList) {
      className.match(/(\w|-)+/g).forEach(item => {
        element.classList.add(item);
      });
    }
  },

  removeClass(element, className) {
    if (!element || !className) return;

    if (element.classList) {
      className.match(/(\w|-)+/g).forEach(item => {
        element.classList.remove(item);
      });
    }
  },

  toggleClass(element, className) { 
    if (!element || !className) return;

    if (element.classList) {
      className.match(/(\w|-)+/g).forEach(item => {
        element.classList.toggle(item);
      });
    }
  },

  addMultiEvent(element, eventNames, listener) {
    const eventArray = eventNames.split(' ');
    for (let i = 0, l = eventArray.length; i < l; i += 1) {
      element.addEventListener(eventArray[i], listener, false);
    }
  },

  /**
   * @description
   * @param {HTMLElement} element
   * @param {string} eventName
   * @param {string} selector
   * @param {Function} handler
   */
  on(element, eventName, selector, handler) {
    this.addMultiEvent(element, eventName, event => {
      for (let target = event.target; target && target !== element; target = target.parentNode) {
        if (target.matches(selector)) {
          handler.call(target, event);
          break;
        }
      }
    });
  },

  /**
   * @param {string} type - element type
   * @param {object} attribute - element attributes
   * @param {string} html - innerHTML
   * @returns {HTMLElement} -
   * */
  createElement(type, attribute = {}, html = '') {
    const dom = document.createElement(type);
    for (let i in attribute) {
      if (Object.prototype.hasOwnProperty.call(attribute, i)) {
        dom[i] = attribute[i];
      }
    }
    try {
      dom.innerHTML = html;
    } catch (e) {
      console.warn('innerHTML error');
    }
    return dom;
  },

  createId() {
    return Number(Math.random().toString().substr(3, 3) + Date.now()).toString(36);
  },

  supportPseudo(pseudoClass) {
    // from https://gomakethings.com/testing-for-css-pseudo-class-support-with-vanilla-javascript/
    // Get the document stylesheet
    let _pseudoClass = pseudoClass;
    let ss = document.styleSheets[0];

    // Create a stylesheet if one doesn't exist
    if (!ss) {
      let el = document.createElement('style');
      document.head.appendChild(el);
      ss = document.styleSheets[0];
      document.head.removeChild(el);
    }

    // Test the pseudo-class by trying to style with it
    let testPseudo = function () {
      try {
        if (!(/^:/).test(pseudoClass)) {
          _pseudoClass = ':' + pseudoClass;
        }
        ss.insertRule('html' + _pseudoClass + '{}', 0);
        ss.deleteRule(0);
        return true;
      } catch (e) {
        return false;
      }
    };

    // Run the test
    return testPseudo();
  },

  /**
   * @param {string} url - request url
   * @param {object} data - request data
   * @param {string} method  - request method
   * @param {object} header -
   * @returns {Promise} - 
   * */
  fetchData(url, data = {}, method = 'GET', header = { 'Content-Type': 'application/x-www-form-urlencoded' }) {
    let dataArr = [];
    let dataStr = '';

    for (let i in data) {
      if (Object.prototype.hasOwnProperty.call(data, i)) {
        dataArr.push(`${i}=${data[i]}`);
      }
    }

    dataStr = dataArr.join('&');

    if (method === 'POST') {
      return fetch(url, {
        method: method,
        headers: header,
        body: dataStr
        // credentials: 'include'
      }).then(res => {
        if (res.status) {
          return res.json();
        }
        throw new Error('post data fetch error!');
      });
    }

    let getUrl = url;

    if (dataStr) {
      getUrl = url.indexOf('?') > 0 ? `${url}&${dataStr}` : `${url}?${dataStr}`;
    }

    return fetch(getUrl, {
      // credentials: 'include'
    }).then(res => {
      if (res.status) {
        return res.json();
      }
      throw new Error('get data fetch error!');
    });
  }
};

export default util;
