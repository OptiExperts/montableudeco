// Your code goes here

/*!
 * Copyright MaxDesign. All Rights Reserved. 
  ⚠ FR : CONTENU PROTÉGÉ PAR LES DROITS D'AUTEURS (article L. 111-1 du code de la propriété intellectuelle). Cette ressource ne peut pas être utilisée, diffusée ou exploitée sans l'approbation de ses auteurs. Pour plus d'informations, veuillez contacter admin(at)maxdesign.expert
  ⚠ EN : CONTENT PROTECTED WITH AUTHOR COPYRIGHTS (section L. 111-1 of the intellectual property code). This resource may not be used, distributed or exploited without the approval of its authors. For any information request, please contact admin(at)maxdesign.expert
 */

window.MaxDesign = window.MaxDesign || {};

/*****************************************************************************************************************************************************
 # pragma DRAWER
******************************************************************************************************************************************************/

class Drawer extends HTMLElement {
  constructor() {
    super();
    MaxDesign.drawer = this;
    this.settings = JSON.parse(this.querySelector(':scope > [type="application/json"]').innerHTML);
    this.setVariables();
    this.setEvents();
  }

  /*****************************************
   SET VARIABLES & EVENTS
  *****************************************/

  setVariables() {
    this.selectors = {
      cartWrapper: document.querySelector('.cart-drawer__wrapper'),
      bundles: document.querySelector('bundles-maxdesign'),
    };

    this.classes = {
      drawerOpen: 'cart-drawer__open',
      drawerClose: '.cart__close, overlay-maxdesign, .cart__continue--shopping, .cart__back--shopping',
      drawerEmpty: '.cart-drawer__wrapper:empty',
    };
  }

  setEvents() {
    this.onFormSubmit();
    this.onOpenDrawer();
  }

  /*****************************************
   ON USER INTERACTION
  *****************************************/

  /**
   * On form submission with event bubbling for dynamic ATC.
   * Conditional step to check if form is valid
   */
  onFormSubmit() {
    if (!this.selectors.bundles) {
      document.addEventListener(
        'click',
        event => {
          for (let btn of document.querySelectorAll(this.settings.drawerFormSubmit)) {
            let form = btn.closest('form[action*="/cart/add"]');
            if (form && btn.contains(event.target) && !this.unvalidForm(form)) {
              event.preventDefault();
              event.stopImmediatePropagation();
              this.submitForm(form, btn);
              this.btnAnimate(true, btn);
            }
          }
        },
        true
      );
    }
  }

  /**
   * On drawer trigger.
   */
  onOpenDrawer() {
    document.addEventListener(
      'click',
      event => {
        for (let trigger of document.querySelectorAll(this.settings.drawerTrigger)) {
          if (trigger.contains(event.target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (document.querySelector(this.classes.drawerEmpty)) {
              this.fetchCart();
            } else {
              this.openDrawer();
            }
          }
        }
      },
      true
    );
    addEventListener('load', () => {
      for (let trigger of document.querySelectorAll(this.settings.drawerTrigger)) {
        trigger.addEventListener(
          'mouseover',
          event => {
            event.preventDefault();
            event.stopImmediatePropagation();
          },
          true
        );
      }
    });
  }

  /**
   * close drawer interaction.
   */
  onCloseDrawer() {
    for (let closeDrawer of document.querySelectorAll(this.classes.drawerClose)) {
      closeDrawer.addEventListener('click', e => {
        e.preventDefault();
        document.body.classList.remove(this.classes.drawerOpen);
      });
    }
  }

  /*****************************************
   UTILITY FUNCTIONS
  *****************************************/

  /**
   * submit form.
   * @param {Object} form - form element
   * @param {Object} btn - btn element
   */
  submitForm(form, btn) {
    let formData = new FormData(form);
    fetch('/cart/add.js', {
      body: formData,
      method: 'POST',
    })
      .then(() => this.fetchCart(btn))
      .catch(console.error);
  }

  /**
   * check form validation.
   * @param {Object} form.
   */
  unvalidForm(form) {
    return [...form.querySelectorAll('input[name], select[name]')].find(field => {
      return (
        (field.hasAttribute('required') && field.matches('[type="text"]') && field.value == '') ||
        (!field.matches('[type="text"]') && field.value == '')
      );
    });
  }

  /**
   * btn loading animation.
   * @param {boolean} load - whether to animate btn
   * @param {Object} btn - btn element
   */
  btnAnimate(load, btn) {
    if (load && btn) {
      if (!btn.querySelector('[data-spinner]')) {
        btn.innerHTML = `<span>${btn.innerHTML}</span>`;
        btn.insertAdjacentHTML(
          'beforeend',
          '<svg viewBox="0 0 20 20" data-spinner><path d="M20 10c0 5.523-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0v2c-4.418 0-8 3.582-8 8s3.582 8 8 8 8-3.582 8-8h2z"></path></svg>'
        );
      }
      btn.dataset.cartLoader = 'loading';
      for (let loader of document.querySelectorAll('[data-cart-loader]')) loader.dataset.cartLoader = 'loading';
    } else if (!load && btn) {
      btn.dataset.cartLoader = '';
      for (let loader of document.querySelectorAll('[data-cart-loader]')) loader.dataset.cartLoader = '';
    }
  }

  /**
   * fetch drawer page.
   * @param {Object} btn - triggering btn element
   */
  fetchCart(btn = null) {
    fetch('/cart?view=drawer')
      .then(response => response.text())
      .then(html => {
        const section = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
        this.selectors.cartWrapper.innerHTML = section;
        /* Dispatch custom event for tierce use */
        document.dispatchEvent(new Event('fetchCart'));
        /* display cart */
        this.openDrawer();
        this.onCloseDrawer();
        this.btnAnimate(false, btn);
      })
      .catch(alert);
  }

  /**
   * open cart drawer.
   * @param {Object} theme settings.
   */
  openDrawer() {
    document.body.classList.add(this.classes.drawerOpen);
  }
}

/*****************************************************************************************************************************************************
 # pragma CART
******************************************************************************************************************************************************/

class Cart extends HTMLElement {
  constructor() {
    super();
    MaxDesign.cart = this;
    this.settings = JSON.parse(this.querySelector(':scope > [type="application/json"]').innerHTML);
    this.setVariables();
    this.setEvents();
  }

  /*****************************************
   SET VARIABLES & EVENTS
  *****************************************/

  setVariables() {
    this.selectors = {
      price: {
        subtotal: this.querySelector('.summary__price--subtotal'),
        total: this.querySelector('.summary__price--total'),
        delivery: this.querySelector('.summary__price--delivery'),
        savings: this.querySelector('.summary__savings--price'),
      },
      discount: {
        remove: this.querySelector('.summary__total--discount-tag svg.summary__total--discount-close'),
        title: this.querySelector('.summary__total--discount-title'),
        text: this.querySelector('.cartDiscount__text'),
        price: this.querySelector('.summary__price--discount'),
        field: this.querySelector('.cartDiscount'),
        btn: this.querySelector('.cartDiscount button'),
        fieldInput: this.querySelector('.cartDiscount input:not([type=hidden]'),
        submitInput: this.querySelector('.cartDiscount input[name=discount]'),
      },
      offer: {
        progress: this.querySelector('.upsell-threshold__progress'),
        text: this.querySelector('.upsell-threshold__text'),
        goalText: this.querySelector('.upsell-threshold__text span'),
      },
      timer: this.querySelector('#cdTimerCart'),
      cartItems: this.querySelectorAll('.cartItems__container'),
      qtyButtons: this.querySelectorAll('.cartItems__quantity--controls'),
      qtyDropdown: this.querySelectorAll('.cartItems__quantity .quantity-dropdown'),
      removeItems: this.querySelectorAll('.cartItems__close, .cartItems__bin'),
      summaryDetails: this.querySelector('.summary__total--details'),
      summarySavings: this.querySelector('.summary__savings'),
      stickyATC: this.querySelector('.btnCart__sticky'),
      btnATC: this.querySelector('.btnCart'),
      terms: this.querySelector('.cart__terms'),
      sentinelBottom: this.querySelector('.cart__sentinel--bottom'),
      cartMessageWrapper: this.querySelector('.cartMessage__wrapper'),
      section: this.parentElement,
      cartCount: document.querySelectorAll(this.settings.cartCountSelector),
      cartIndication: document.querySelectorAll(this.settings.cartIndicationSelector),
    };

    this.classes = {
      removeItem: 'cartItems__container--remove',
      btnShadow: 'btnCart__sticky--shadow',
      btnLoading: 'btnCart--loading',
      discountLoading: 'discount__svg--loading',
      summaryTotalDetails: 'summary__total--details-discount',
      hidePromoField: 'cartDiscount__hidden',
      hideMsgBar: 'cartMessage__wrapper--hidden',
      hideSavings: 'summary__savings--hidden',
      barOffset: 'upsell-threshold__progress--offset',
      cartLoading: 'cart-loading',
      cartIndicationOn: this.settings.cartIndicationOn,
      cartIndicationOff: this.settings.cartIndicationOff,
    };
  }

  setEvents() {
    if (this.settings.cart.item_count > 0) {
      this.onInit();
      this.onUpdateQty(); /* update cart quantity on quantity click */
      this.onSubmitCart(); /* button loader on cart submit */
      this.onSubmitDiscount(); /* apply discount on cart page */
      this.onCookieDiscount(); /* reset previous discount code within 1 hour */
      this.onRemoveDiscount(); /* remove discount promotion on close action */
      this.onCdTimer(); /* Countdown timer with cookie deposit */
    }
  }

  /*****************************************
   ON CART INIT
  *****************************************/

  onInit() {
    if (this.settings.discount.qtyManual) this.solveSwapCart(); /* swap cart variants when discount option */
    if (this.settings.offer.enable) this.refreshOffer(this.settings.offer.type); /* update upsell on cart init */
    this.observeStickyBtn(); /* ATC sticky shadow on mobile */
    this.iosFixes(); /* ios fix when returning from checkout */
    this.updateCount(); /* update count selector */
    this.discountBtnStatus(); /* enable or disable discount btn */
  }

  /*****************************************
   ON USER INTERACTION
  *****************************************/

  /**
   * update cart quantity on quantity click
   * 1 > Mobile selector
   * 2 > Increment / decrement buttons
   * 3 > Bin / cross
   */
  onUpdateQty() {
    for (let select of this.selectors.qtyDropdown) {
      select.addEventListener('change', e => {
        let item = e.target.closest('[data-item-line]');
        let qty = parseInt(select.value, 10);
        let qtyMax = +e.target.dataset.quantityMax;
        if (!qtyMax || qty <= qtyMax) {
          select.previousElementSibling.querySelector('input').value = qty;
          item.dataset.itemQty = qty;
          this.changeCart(qty, item);
        } else {
          alert(this.settings.inventoryAlert);
          this.cartLoader();
          this.cartRefresh();
        }
      });
    }
    for (let button of this.selectors.qtyButtons) {
      let input = button.querySelector('input');
      button.addEventListener('click', e => {
        this.diffTime, this.lastClick;
        if (this.monitorClicks(e)) {
          let item = e.target.closest('[data-item-line]');
          let qty = parseInt(input.value, 10);
          if (e.target.hasAttribute('data-decrement')) {
            qty = isNaN(qty) ? 0 : qty;
            qty--;
            input.value = qty;
            item.dataset.itemQty = qty;
            button.nextElementSibling.value = qty;
            this.changeCart(qty, item);
          } else if (e.target.hasAttribute('data-increment')) {
            let qtyMax = +e.target.dataset.quantityMax;
            qty = isNaN(qty) ? 0 : qty;
            qty++;
            if (!qtyMax || qty <= qtyMax) {
              input.value = qty;
              item.dataset.itemQty = qty;
              button.nextElementSibling.value = qty;
              this.changeCart(qty, item);
            } else {
              alert(this.settings.inventoryAlert);
              this.cartLoader();
              this.cartRefresh();
            }
          }
        }
      });
    }
    for (let el of this.selectors.removeItems) {
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        let item = e.target.closest('[data-item-line]');
        item.dataset.itemQty = 0;
        this.changeCart(0, item);
      });
    }
  }

  /**
   * button loader on cart submit
   * fetch('https://domain.name/cart.json').then((resp) => resp.json()).then(console.log)
   */
  onSubmitCart() {
    document.addEventListener(
      'click',
      e => {
        if (this.selectors.btnATC.contains(e.target)) {
          let allowSubmit = !this.selectors.terms || this.selectors.terms.querySelector('input').checked;
          if (allowSubmit) {
            this.selectors.btnATC.classList.add(this.classes.btnLoading);
            if (this.settings.appsDisable != 'default') {
              e.preventDefault();
              e.stopImmediatePropagation();
              window.location.href =
                this.selectors.discount.submitInput && this.selectors.discount.submitInput.value != ''
                  ? '/checkout?discount=' + this.selectors.discount.submitInput.value
                  : '/checkout';
            }
          }
        }
      },
      this.settings.appsDisable == 'force_2' ? true : false
    );
  }

  /**
   * apply discount on cart page
   */
  onSubmitDiscount() {
    if (!this.settings.discount.auto) {
      if (this.settings.discount.custom) {
        this.selectors.discount.btn.addEventListener('click', () => {
          for (const [discount, codes] of Object.entries(this.settings.discount.discounts)) {
            for (let code of codes) {
              if (code == this.selectors.discount.fieldInput.value) {
                this.selectors.discount.submitInput.value = this.selectors.discount.fieldInput.value;
                this.settings.cart.custom_discount = +discount;
                this.discountBtnStatus(true);
                this.cookieDiscount(true, this.selectors.discount.fieldInput.value);
                setTimeout(() => this.updateSummary(true, true), 750);
                return;
              }
            }
          }
          discountWarning.bind(this)();
        });
      } else {
        this.selectors.discount.fieldInput.addEventListener('focus', discountWarning.bind(this));
      }
      /* default behaviour */
      function discountWarning() {
        this.selectors.discount.text.classList.add('show');
        this.selectors.discount.btn.disabled = true;
        this.selectors.discount.submitInput.value = this.selectors.discount.fieldInput.value;
        this.updateSummary(false);
      }
    }
  }

  /**
   * reset previous discount code within 1 hour
   */
  onCookieDiscount() {
    if (!this.settings.discount.auto && this.settings.discount.custom) {
      if (document.cookie.match(/^(.*;)?\s*discount_code\s*=\s*[^;]+(.*)?$/)) {
        let discount_code = this.getCookie('discount_code');
        for (const [discount, codes] of Object.entries(this.settings.discount.discounts)) {
          for (let code of codes) {
            if (code.toUpperCase() == discount_code.toUpperCase()) {
              this.selectors.discount.submitInput.value = code;
              this.settings.cart.custom_discount = +discount;
              this.discountBtnStatus(true);
              this.updateSummary(true, true);
              return;
            }
          }
        }
      }
    }
  }

  /**
   * remove discount promotion on close action
   */
  onRemoveDiscount() {
    if (this.selectors.discount.remove) {
      this.selectors.discount.remove.addEventListener('click', () => {
        this.selectors.discount.submitInput.value = '';
        this.settings.cart.custom_discount = 0;
        this.updateSummary(false);
        this.cookieDiscount(false);
        this.selectors.discount.text.classList.remove('show');
      });
    }
  }

  /**
   * run cdTimer with cookies
   * (needs complete rebuild)
   */
  onCdTimer() {
    if (this.settings.cdTimer.enabled) {
      var totalTime = this.settings.cdTimer.time * 60 * 1000;
      if (!document.cookie.match(/^(.*;)?\s*cdTime\s*=\s*[^;]+(.*)?$/) && this.selectors.timer != null) {
        var firstTime = new Date();
        function cookieTimer(cname, cvalue, exdays) {
          var d = new Date();
          d.setTime(d.getTime() + exdays * 60 * 1000 + totalTime);
          var expires = this.settings.cdTimer.expiry == 0 ? ';' : ';expires=' + d.toUTCString();
          document.cookie = cname + '=' + cvalue + expires + 'path=/';
        }
        cookieTimer.bind(this, 'firstTime', firstTime, this.settings.cdTimer.expiry)();
        cookieTimer.bind(this, 'cdTime', totalTime, this.settings.cdTimer.expiry)();
        var deadline = new Date(Date.parse(new Date()) + totalTime);
        initializeClock.bind(this, 'cdTimerCart', deadline)();
      } else if (this.selectors.timer) {
        var firstTimeValue = Date.parse(
          document.cookie.replace(/(?:(?:^|.*;\s*)firstTime\s*\=\s*([^;]*).*$)|^.*$/, '$1')
        );
        var currentTime = Date.parse(new Date());
        var usedTime = currentTime - firstTimeValue;
        var runTimer = new Date(Date.parse(new Date()) + (totalTime - usedTime)); //new deadline after time has passed
        initializeClock.bind(this, 'cdTimerCart', runTimer)();
      }
      function getTimeRemaining(endtime) {
        var t = Date.parse(endtime) - Date.parse(new Date());
        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);
        var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        return {
          total: t,
          days: days,
          hours: hours,
          minutes: minutes,
          seconds: seconds,
        };
      }
      function initializeClock(id, endtime) {
        var clock = document.getElementById(id);
        if (clock) {
          var minutesSpan = clock && clock.querySelector('#cart_minutes');
          var secondsSpan = clock && clock.querySelector('#cart_seconds');
          var pageLoad = true;
          function updateClock() {
            var t = getTimeRemaining(endtime);
            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);
            //reset timer when days > 0
            if (t.total <= 0 || isNaN(t.total)) {
              clearInterval(timeinterval);
              if (
                this.selectors.timer.nextElementSibling &&
                this.selectors.timer.nextElementSibling.nodeName == 'HR'
              ) {
                this.selectors.timer.nextElementSibling.remove();
              }
              this.selectors.timer.remove();
            } else if (pageLoad) {
              this.selectors.timer.classList.add('cdTimerCart--active');
              pageLoad = false;
            }
          }
          updateClock.bind(this)();
          var timeinterval = setInterval(updateClock.bind(this), 1000);
        }
      }
    }
  }

  /*****************************************
   ADD, CHANGE, RENDER, SWAP, UPDATE CART
  *****************************************/

  /**
   * add to cart and call renderCart
   * @param {array} data - items dictionary of id, qty and properties
   * @param {function} callback - ATC Action
   * @param {boolean} loader - cart loader animation
   */
  addToCart(data, callback, loader) {
    if (loader) this.cartLoader();
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: data }),
    })
      .then(response => response.json())
      .then(callback)
      .catch(console.error);
  }

  /**
   * update cart and call renderCart
   * @param {number} qty - updated qty of line item
   * @param {object} item - item node
   * @param {string} key - variant id / key
   * @param {boolean} allowswap - allow cartSwap feature
   */
  changeCart(qty, item, key, allowSwap = true) {
    // run condition before change cart
    if (this.priorCartChange(qty, allowSwap, item, key)) return;
    // change line item
    let bodyData = item ? { quantity: qty, line: item.dataset.itemLine } : { quantity: qty, id: key };
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    })
      .then(data => data.json())
      .then(newCart => {
        let reloadCart = this.solveReloadCart(qty, newCart);
        if (!reloadCart) this.renderCart(qty, item);
      })
      .catch(console.error);
  }

  /**
   * Do some operations ahead of cart change
   * @param {number} qty - updated qty of line item
   * @param {boolean} allowswap - allow cartSwap feature
   * @param {object} item - item node
   * @param {string} key - variant id / key
   */
  priorCartChange(qty, allowSwap, item, key) {
    if (qty == 0) {
      this.cartLoader();
    } else if (this.settings.discount.qtyManual && item.dataset.offerId && allowSwap) {
      this.solveSwapCart(qty, item, key);
      return true;
    } else if (this.settings.offer.enable && this.settings.offer.type != 'shipping') {
      this.cartLoader(false);
    }
  }

  /**
   * cart rendering
   * @param {number} qty - updated qty of line item
   * @param {object} item - item node
   */
  renderCart(qty, item) {
    // update cart count
    this.updateCount();
    // update upsell offers & allow more api calls
    if (this.settings.offer.enable) this.refreshOffer(this.settings.offer.type);
    // update line item prices
    this.updateLineItems(qty, item);
    // update summary price
    this.updateSummary();
  }

  /**
   * check if we need to swapCart()
   * @param {number} qty - updated qty of line item
   * @param {number} item - item node
   * @param {string} key - variant key
   */
  solveSwapCart(qty, item, key) {
    let offerItems = item
      ? this.querySelectorAll(`[data-offer-id="${item.dataset.offerId}"]`)
      : this.querySelectorAll(`[data-offer-id]`);

    if (offerItems.length) {
      // create dict to help check if items need to be swapped
      let offerSets = [...offerItems].reduce((obj, item) => {
        let key = item.dataset.offerId;
        obj[key] = obj[key] || {};
        obj[key].qty = (obj[key].qty || 0) + +item.dataset.itemQty;
        obj[key].itemDiscounts = item.dataset.itemDiscounts;
        obj[key].discountValues = (obj[key].discountValues || []).concat([item.dataset.discountValue]);
        return obj;
      }, {});

      // check total qtys against active discounts
      for (let [offerId, cart] of Object.entries(offerSets)) {
        let promoValuesList = cart.itemDiscounts.split(',');
        let promoValue = promoValuesList[Math.min(cart.qty - 1, promoValuesList.length - 1)];
        let needSwapCart = !cart.discountValues.every(discount => discount == promoValue);
        if (needSwapCart) {
          this.cartLoader();
          this.swapCart(offerId, promoValue);
          return;
        }
      }

      // fallback to changeCart if qty is changed in cart
      if (item) this.changeCart(qty, item, key, false);
    }

    // restore submit btn
    this.cartLoader(false, false);
  }

  /**
   * permute variants with their matching Discount option
   * 1 - loop through all discounted items
   * 2 - loop through their variants
   * 3 - push matching variant to array (based on new discount option)
   * 4 - remove current variant and add new variant
   * @param {number} offerId - offer id (product id)
   * @param {string} promoValue - value of discount
   */
  swapCart(offerId, promoValue) {
    let allItems = [...this.selectors.cartItems];
    let promoItems = allItems.filter(el => +el.dataset.offerId == offerId);
    let promoIndex = +promoItems[0].dataset.discountPosition;
    let variantsToAdd = [];

    // build array of variants to add
    for (let item of allItems) {
      if (item.dataset.offerId == offerId) {
        let itemData = JSON.parse(item.querySelector('[data-variant]').textContent);
        let currentOptions = itemData.currentOptions;
        let variants = itemData.variants;

        for (let variant of variants) {
          if (variant.options.includes(promoValue)) {
            // remove promo option to find matching variant
            variant.options.splice(promoIndex, 1);
            currentOptions.splice(promoIndex, 1);

            if (variant.options.every(option => currentOptions.includes(option))) {
              variantsToAdd.push({
                quantity: +item.dataset.itemQty,
                id: variant.id,
              });
            }
          }
        }
      } else {
        variantsToAdd.push({
          quantity: +item.dataset.itemQty,
          id: +item.dataset.itemId,
        });
      }
    }

    // clear cart and rebuild it
    this.resetCart(variantsToAdd.reverse());
  }

  /**
   * erase cart and rebuild it
   * @param {array} variantsToAdd - items data to add
   */
  resetCart(variantsToAdd) {
    fetch('/cart/clear.js', { method: 'POST' })
      .then(response => response.json())
      .then(() => this.addToCart(variantsToAdd, this.cartRefresh.bind(this), true))
      .catch(console.error);
  }

  /*****************************************
   DYNAMIC CART REFRESH
  *****************************************/

  /**
   * update line item prices
   * @param {number} qty - qty of variant
   * @param {object} item - item node
   */
  updateLineItems(qty, item) {
    let product = {
      total: item.querySelector('.cartItems__prices-total'),
      compare_price: item.querySelector('.cartItems__prices--compare'),
    };
    /* update line item prices */
    product.total.innerHTML =
      product.total.dataset.price == 0 ? this.settings.free : this.formatMoney(product.total.dataset.price * qty);
    product.compare_price &&
      (product.compare_price.innerHTML = this.formatMoney(product.compare_price.dataset.comparePrice * qty));
  }

  /**
   * update cart count notifications
   */
  updateCount() {
    if (this.selectors.cartCount) {
      for (let el of this.selectors.cartCount) el.textContent = this.settings.cart.item_count;
    }
    for (let el of this.selectors.cartIndication) {
      el.classList.toggle(this.classes.cartIndicationOn, this.settings.cart.item_count > 0);
      el.classList.toggle(this.classes.cartIndicationOff, this.settings.cart.item_count == 0);
    }
  }

  /**
   * update discount code and prices
   * @param {boolean} allowDiscount - whether discount should be applied
   * @param {boolean} customDiscount - whether discount is custom or not
   */
  updateSummary(allowDiscount, customDiscount) {
    // update discount
    this.updateDiscount(allowDiscount, customDiscount);
    // update delivery
    this.updateDelivery();
    // update subtotal price
    this.updateSubtotal();
    // update total price
    this.updateTotal();
    // update savings
    this.updateSavings();
    // update Message bar
    this.updateMessageBar();
  }

  /**
   * get current discount value to apply
   * @param {boolean} allowDiscount - whether discount should be applied
   * @param {boolean} customDiscount - whether discount is custom or not
   * @return {Object} - cart total discount & params used in main function
   */
  updateDiscount(allowDiscount = true, customDiscount) {
    this.qtyDiscountIndex;
    let autoDiscount = this.settings.cart.total_discount > 0;
    this.qtyDiscount = allowDiscount && !customDiscount && !autoDiscount && this.settings.discount.qty.enabled;
    let discountValue = allowDiscount ? this.settings.cart.custom_discount || 0 : 0;
    this.cartDiscount = autoDiscount
      ? this.settings.cart.total_discount
      : Math.floor((this.settings.cart.original_total_price * discountValue) / 100);

    // overide with qty discount if enabled
    if (this.qtyDiscount) {
      this.qtyDiscountIndex = Math.max(Math.min(this.settings.cart.item_count - 1, 3), 0);
      discountValue = +this.settings.discount.qty.values[this.qtyDiscountIndex];
      this.cartDiscount = Math.floor((this.settings.cart.original_total_price * discountValue) / 100);
      this.selectors.discount.submitInput.value = this.settings.discount.qty.codes[this.qtyDiscountIndex];
      this.settings.cart.custom_discount = +discountValue;
    }

    // update discount price & layout
    if (autoDiscount || discountValue > 0) {
      this.selectors.discount.field.classList.add(this.classes.hidePromoField);
      this.selectors.summaryDetails.classList.add(this.classes.summaryTotalDetails);
      this.selectors.discount.price.innerHTML = '- ' + this.formatMoney(this.cartDiscount);
      !autoDiscount && (this.selectors.discount.title.textContent = this.selectors.discount.submitInput.value);
    } else {
      this.settings.discount.promoField &&
        this.selectors.discount.field.classList.remove(this.classes.hidePromoField);
      this.selectors.summaryDetails.classList.remove(this.classes.summaryTotalDetails);
    }
  }

  /**
   * get current delivery value to apply
   * can inject text instead of money
   */
  updateDelivery() {
    this.deliveryAmount = this.settings.offer.shipping.defaultPrice;
    // overide delivery amount if upsell / shipping threshold enabled
    if (this.settings.offer.type == 'shipping' || this.settings.offer.type == 'both') {
      let threshold = this.settings.offer.shipping.thresholdValue;
      this.deliveryThresholdMet = this.settings.cart.original_total_price >= threshold;
      this.deliveryAmount = this.deliveryThresholdMet
        ? this.settings.offer.shipping.priceAfter
        : this.settings.offer.shipping.priceBefore;
      this.deliveryAmount = this.deliveryAmount.replace(/[,.]/g, '');
      // inject delivery price in DOM
      if (this.selectors.price.delivery) {
        this.selectors.price.delivery.innerHTML = isNaN(+this.deliveryAmount)
          ? this.deliveryAmount
          : this.formatMoney(+this.deliveryAmount);
      }
      // convert value to number for other methods
      this.deliveryAmount = isNaN(+this.deliveryAmount) ? 0 : +this.deliveryAmount;
    }
  }

  /**
   * update subtotal price
   */
  updateSubtotal() {
    this.selectors.price.subtotal.innerHTML = this.formatMoney(this.settings.cart.original_total_price);
  }

  /**
   * update total price
   */
  updateTotal() {
    this.selectors.price.total.innerHTML = this.formatMoney(
      this.settings.cart.original_total_price - (this.cartDiscount || 0) + this.deliveryAmount
    );
  }

  /**
   * update savings
   */
  updateSavings() {
    if (this.selectors.summarySavings) {
      let totalCPValue = 0;

      // cumulate compare at price diff
      for (let item of this.selectors.cartItems) {
        let qtyValue = +item.dataset.itemQty;
        let comparePriceValue = item.querySelector('[data-compare-price]')
          ? +item.querySelector('[data-compare-price]').dataset.comparePrice
          : +item.querySelector('[data-price]').dataset.price;
        totalCPValue += comparePriceValue * qtyValue;
      }
      // inject updated total savings
      let savings = Math.round((this.cartDiscount || 0) + totalCPValue - this.settings.cart.original_total_price);
      if (savings > 0) {
        this.selectors.price.savings.innerHTML = this.formatMoney(savings);
        this.selectors.summarySavings.classList.remove(this.classes.hideSavings);
      } else {
        this.selectors.summarySavings.classList.add(this.classes.hideSavings);
      }
    }
  }

  /**
   * update Announce Bar by priority
   */
  updateMessageBar() {
    let msgWrapper = this.selectors.cartMessageWrapper;
    if (msgWrapper) {
      if (this.qtyDiscount && this.settings.discount.qty.messages[this.qtyDiscountIndex] != '') {
        // > Qty discount
        msgWrapper.firstElementChild.innerHTML = this.settings.discount.qty.messages[this.qtyDiscountIndex];
        msgWrapper.classList.remove(this.classes.hideMsgBar);
        return;
      }

      // > Cart message
      if (this.settings.announce.enabled && this.settings.announce.text != '') {
        msgWrapper.firstElementChild.innerHTML = this.settings.announce.text;
        msgWrapper.classList.remove(this.classes.hideMsgBar);
        return;
      }

      // > default behaviour
      msgWrapper.classList.add(this.classes.hideMsgBar);
    }
  }

  /*****************************************
   UPSELL PRODUCT / SHIPPING OFFER
  *****************************************/

  /**
   * refresh upsell progress
   *  > 1 upsell threshold for product or shipping
   *  > 2 upsell threshold for both
   **  >> if step 2 qualify, congrats text
   **  >> if step 1 qualify, promote step 2
   **  >> if none qualify, promote step 1
   */
  refreshOffer(type) {
    switch (type) {
      case 'both':
        let type_step1 = this.settings.offer.both.step_1;
        let type_step2 = this.settings.offer.both.step_2;
        if (this.getOfferProgress(type_step2) >= 100) {
          this.updateOffer(this.settings.offer.qualify, type_step2, false, true, true, true);
        } else if (this.getOfferProgress(type_step1) >= 100) {
          // oppositely add and remove offers based on step order
          let getOffer = type_step1 == 'shipping' ? true : false;
          this.updateOffer(this.settings.offer[type_step2].text, type_step2, true, getOffer, !getOffer);
        } else {
          this.updateOffer(this.settings.offer[type_step1].text, type_step1, true, false, false);
        }
        break;
      default:
        if (this.getOfferProgress(type) >= 100) {
          this.updateOffer(this.settings.offer.qualify, type, false, true, true);
        } else {
          this.updateOffer(this.settings.offer[type].text, type, true, false, false);
        }
    }
    // restore submit btn
    this.cartLoader(false, false);
    // animate bar (use max threshold if both offers)
    this.animateBarOffer(this.settings.offer.type);
  }

  /**
   * get offerProgress (1 to 100)
   * exclude upsell price when product or both type
   * @param {string} type - type of offer
   */
  getOfferProgress(type) {
    this.offerTotal = this.settings.cart.original_total_price;
    if (type != 'shipping') {
      this.productsInCartQty = 0;
      this.productsInCart = this.settings.cart.items.filter(item => {
        if (this.settings.offer.product.id == item.variant_id) {
          this.offerTotal -= item.original_line_price;
          this.productsInCartQty += item.quantity;
          return true;
        }
      });
    }
    return (this.offerTotal * 100) / this.settings.offer[type].thresholdValue;
  }

  /**
   * update upsell text content
   * @param {string} text - text to change
   * @param {string} type - type of offer
   * @param {boolean} showBar - show / hide bar
   * @param {boolean} offerShipping - offer / pay shipping
   * @param {boolean} offerProduct - add / remove product
   */
  updateOffer(text, type, showBar, offerShipping, offerProduct, check) {
    // update text and bar display with new XX & YY
    let moneyGoal = this.formatMoney(
      this.settings.offer[type].thresholdValue - this.settings.cart.original_total_price
    );
    let threshold = this.formatMoney(this.settings.offer[type].thresholdValue);
    setTimeout(
      () => {
        this.selectors.offer.text.innerHTML = text.replace('XX', moneyGoal).replace('YY', threshold);
        this.selectors.section.style.setProperty('--upsell-bar-display', showBar ? 'flex' : 'none');
      },
      showBar ? 0 : 700
    );
    // update product & shipping states
    switch (this.settings.offer.type) {
      case 'product':
        this.updateProductOffer(offerProduct);
        break;
      case 'shipping':
        this.updateDelivery();
        this.updateTotal();
        this.updateSavings();
        break;
      default:
        this.updateProductOffer(offerProduct);
        this.updateDelivery();
        this.updateTotal();
        this.updateSavings();
    }
  }

  /**
   * check if product should be added
   * @param {boolean} offerProduct - add / remove product
   */
  updateProductOffer(offerProduct) {
    if (offerProduct && !this.productsInCart.length && this.settings.offer.product.id && !this.productOfferAdded) {
      this.productOfferAdded = true;
      setTimeout(() => {
        this.addToCart(
          [{ quantity: 1, id: this.settings.offer.product.id, properties: this.settings.offer.product.prop }],
          this.cartRefresh.bind(this),
          true
        );
      }, 500);
    } else if ((!offerProduct && this.productsInCart.length) || this.productsInCartQty > 1) {
      this.changeCart(0, null, this.productsInCart[0].key, false);
    }
  }

  /**
   * update progress bar
   */
  animateBarOffer(type) {
    this.selectors.offer.progress.dataset.progress = this.formatMoney(
      this.settings.cart.original_total_price
    ).replace(/<\/?[^>]+(>|$)/g, '');
    this.selectors.offer.progress.style.width = this.getBarProgress(type) + '%';
  }

  /**
   * calcualte visual bar progress
   * @param {string} type - type of offer
   */
  getBarProgress(type) {
    let threshold =
      type == 'both'
        ? this.settings.offer[this.settings.offer.both.step_2].thresholdValue
        : this.settings.offer[type].thresholdValue;
    let progress = (this.offerTotal * 100) / threshold;
    let iconProgress = +this.settings.offer.both.iconProgress;
    let isOffset = type == 'both' && progress > iconProgress && progress - iconProgress < 3;
    this.selectors.section.style.setProperty('--upsell-price-transition', progress >= 100 ? '.25s' : '.4s .3s');
    this.selectors.offer.progress.classList.toggle(this.classes.barOffset, isOffset);
    return progress;
  }

  /*****************************************
   UTILITY FUNCTIONS
  *****************************************/

  /**
   * money formater.
   */
  formatMoney(cents) {
    if (typeof cents == 'string') {
      cents = cents.replace('.', '');
    }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = this.settings.moneyFormat;
    function defaultOption(opt, def) {
      return typeof opt == 'undefined' ? def : opt;
    }
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal = defaultOption(decimal, '.');
      if (isNaN(number) || number == null) {
        return 0;
      }
      number = (number / 100.0).toFixed(precision);
      var parts = number.split('.'),
        dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
        cents = parts[1] ? decimal + parts[1] : '';
      return dollars + cents;
    }
    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }
    return formatString.replace(placeholderRegex, value);
  }

  /**
   * ATC sticky shadow on mobile
   */
  observeStickyBtn() {
    let observer = new IntersectionObserver(entry => {
      if (entry[0].target == this.selectors.sentinelBottom) {
        if (entry[0].isIntersecting) {
          this.selectors.stickyATC.classList.remove(this.classes.btnShadow);
        } else {
          this.selectors.stickyATC.classList.add(this.classes.btnShadow);
        }
      }
    });
    this.selectors.sentinelBottom && observer.observe(this.selectors.sentinelBottom);
  }

  /**
   * ios fix when returning from checkout
   */
  iosFixes() {
    window.onpageshow = event => {
      if (event.persisted) {
        this.selectors.btnATC.classList.remove(this.classes.btnLoading);
      }
    };
  }

  /**
   * prevent too many click on quantity buttons
   * @event {object} - event triggered on qty increment or decrement
   */
  monitorClicks(event) {
    if (this.lastClick) {
      this.diffTime = event.timeStamp - this.lastClick;
      if (this.diffTime >= 400) {
        this.lastClick++;
      } else {
        console.warn('Too many simultaneous requests');
        return false;
      }
    }
    this.lastClick = event.timeStamp;
    return true;
  }

  /**
   * get cookie value by name
   * @param {string} name - name of cookie (key)
   */
  getCookie(name) {
    let v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
  }

  /**
   * enable or disable discount btn
   * @loading {boolean} - discount btn loading animation
   */
  discountBtnStatus(loading = false) {
    if (!this.settings.discount.auto && this.selectors.discount.fieldInput) {
      if (loading) {
        this.selectors.discount.btn.classList.add(this.classes.discountLoading);
        setTimeout(() => {
          this.selectors.discount.fieldInput.value = '';
          this.selectors.discount.btn.disabled = true;
          this.selectors.discount.btn.classList.remove(this.classes.discountLoading);
          this.selectors.discount.field.classList.add(this.classes.hidePromoField);
        }, 750);
        return;
      }
      this.selectors.discount.fieldInput.addEventListener('keyup', e => {
        e.currentTarget.nextElementSibling.disabled = this.value == '' ? true : false;
        this.selectors.discount.submitInput.value = this.selectors.discount.fieldInput.value;
        if (e.keyCode === 13) {
          e.preventDefault();
          this.selectors.discount.btn.click();
        }
      });
    }
  }

  /**
   * set 1hr cookie when custom discount is added.
   * @param {boolean} addCookie - whether add or remove cookie
   * @param {string} code - discount code submitted
   */
  cookieDiscount(addCookie, code) {
    if (addCookie) {
      let date = new Date();
      date.setTime(date.getTime() + 60 * 60 * 1000);
      document.cookie = `discount_code=${code}; expires=${date.toUTCString()}; path=/`;
    } else {
      document.cookie = 'discount_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    }
  }

  /**
   * update cart and call renderCart
   * @param {number} qty - updated qty of line item
   * @param {object} newCart - updated cart object
   */
  solveReloadCart(qty, newCart) {
    // reload if auto discount status has changed
    const wasAutoDiscount = this.settings.cart.total_discount > 0;
    Object.assign(this.settings.cart, newCart);
    const isAutoDiscount = this.settings.cart.total_discount > 0;
    if (isAutoDiscount || wasAutoDiscount) {
      this.cartLoader();
      this.cartRefresh();
      return true;
    }
    // remove discounted upsell if upsell trigger was removed & reload cart if qty is 0
    if (qty == 0) {
      for (let item of this.settings.cart.items.values()) {
        if (item.properties._url_original) {
          let originalItemInCart = Object.values(this.settings.cart.items).find(
            originalItem => item.sku == originalItem.sku && !originalItem.properties._url_original
          );
          if (!originalItemInCart) {
            this.changeCart(0, null, item.key, false);
            return true;
          }
        }
      }
      // reload cart
      this.cartRefresh();
      return true;
    }
    return false;
  }

  /**
   * cart load animation & disable ATC
   * @param {boolean} load - load animations default = true
   * @param {boolean} disable - disable button default = true
   */
  cartLoader(load = true, disable = true) {
    if (load) this.selectors.section.classList.add(this.classes.cartLoading);
    this.selectors.btnATC.disabled = disable;
  }

  /**
   * reload cart or fetch drawer
   */
  cartRefresh() {
    this.updateCount();
    this.settings.cartType == 'drawer' ? MaxDesign.drawer.fetchCart() : location.reload.bind(window.location)();
  }
}

/*****************************************************************************************************************************************************
 # pragma UPSELL
******************************************************************************************************************************************************/

class Upsell extends HTMLElement {
  constructor() {
    super();
    if (this.children.length) {
      MaxDesign.upsell = this;
      this.settings = JSON.parse(this.querySelector(':scope > [type="application/json"]').innerHTML);
      this.setVariables();
      this.setEvents();
    }
  }

  /*****************************************
   SET VARIABLES & EVENTS
  *****************************************/

  setVariables() {
    this.selectors = {
      btn: this.querySelector('.upsell__submit'),
    };

    this.classes = {
      btnLoading: 'upsell__submit--loading',
    };
  }

  setEvents() {
    this.onAddUpsell();
  }

  /*****************************************
   ON USER INTERACTION
  *****************************************/

  onAddUpsell() {
    this.selectors.btn.addEventListener('click', e => {
      /* load button */
      e.currentTarget.classList.add(this.classes.btnLoading);
      /* replace and/or add item to cart */
      if (this.settings.replaceItem) {
        fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: 0, id: this.settings.refID }),
        })
          .then(() => {
            MaxDesign.cart.addToCart(
              [{ quantity: 1, id: this.settings.upsellID, properties: this.settings.upsellProp }],
              MaxDesign.cart.cartRefresh.bind(MaxDesign.cart),
              false
            );
          })
          .catch(alert);
      } else {
        MaxDesign.cart.addToCart(
          [{ quantity: 1, id: this.settings.upsellID, properties: this.settings.upsellProp }],
          MaxDesign.cart.cartRefresh.bind(MaxDesign.cart),
          false
        );
      }
    });
  }
}

/*****************************************
   REGISTER ELEMENTS
*****************************************/

customElements.define('drawer-maxdesign', Drawer);
customElements.define('cart-maxdesign', Cart);
customElements.define('upsell-maxdesign', Upsell);
