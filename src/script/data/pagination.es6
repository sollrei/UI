class Pagination {
  constructor(selector, options) {
    const defaultSettings = {
      total: 0,
      page: 1,
      size: 5, // data length per page
      pages: 5 // page number
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
    
    this.wrapper = element;
    
    this.page = this.settings.page;

    this.createPageDom();
  }

  static createNormalPageItem(number) {
    return `<a href="javascript:;" class="page" data-page="${number}">${number}</a>`;
  }

  static createCurrentPageItem(number) {
    return `<span class="page active" data-page="${number}">${number}</span>`;
  }
  
  static createInput() {
    return '<span class="text">跳至</span><input class="ui-form-control js-jump-page" type="number" name="page" autocomplete="off"><span class="text">页</span>';
  }
  
  static createArray(start, length) {
    return Array.from({ length }).map((item, index) => index + start);
  }
  
  static createPageArray({ total, page, pages, size }) {
    const pageTotal = Math.ceil(total / size);
    const middle = Math.ceil(pages / 2);
    const half = Math.floor(pages / 2);

    let pageArr = [];

    if (pageTotal <= pages) {
      for (let i = 0; i < pageTotal; i += 1) {
        pageArr.push(i + 1);
      }
    } else if (page <= middle) {
      for (let i = 0; i < pages; i += 1) {
        pageArr.push(i + 1);
      }
    } else if (page >= pageTotal - half) {
      for (let i = 0; i < pages; i += 1) {
        pageArr.push((pageTotal - pages) + 1 + i);
      }
    } else {
      for (let i = 0; i < pages; i += 1) {
        pageArr.push((page - half) + i);
      }
    }

    return pageArr;
  }
  
  createPageNav(type, limit) {
    const { page } = this;
    const className = (page === limit) ? 'disabled' : '';
    const pageNumber = (type === 'left') ? (page - 1) : (page + 1);

    return `<a href="javascript:;" class="page ${className}" data-page="${pageNumber}">
      <i class="iconfont icon-arrow-${type}"></i>
    </a>`;
  }
  
  createPageButton(str, cur) {
    const { page } = this;

    if (cur === page) {
      return str + `<span class="page active" data-page="${page}">${page}</span>`;
    }
    
    return str + `<a href="javascript:;" class="page" data-page="${page}">${page}</a>`;
  }

  createPageDom(page) {
    const { total, size, pages } = this.settings; 

    if (total <= size) {
      return '';
    }

    const pageArr = Pagination.createPageArray({ total, pages, page, size });
    const pageHtml = pageArr.reduce(this.createPageButton, '');
    const prevButton = this.createPageNav('prev', 0);
    const nextButton = this.createPageNav('next', pageArr.length);

    return prevButton + pageHtml + nextButton + Pagination.createInput();
  }
}

export default Pagination;
