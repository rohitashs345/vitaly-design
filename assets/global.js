function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

document.querySelectorAll('[id^="Details-"] summary').forEach((summary) => {
  summary.setAttribute("role", "button");
  summary.setAttribute("aria-expanded", "false");

  if (summary.nextElementSibling.getAttribute("id")) {
    summary.setAttribute("aria-controls", summary.nextElementSibling.id);
  }

  summary.addEventListener("click", (event) => {
    event.currentTarget.setAttribute(
      "aria-expanded",
      !event.currentTarget.closest("details").hasAttribute("open")
    );
  });

  if (summary.closest("header-drawer")) return;
  summary.parentElement.addEventListener("keyup", onKeyUpEscape);
});

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });

    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define("quantity-input", QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    if (navigator.platform === "iPhone")
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${window.innerHeight}px`
      );

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(".menu-drawer__close-button").forEach((button) =>
      button.addEventListener("click", this.onBackButtonClick.bind(this))
    );
    this.querySelectorAll(".sub-menu__close").forEach((button) =>
      button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );

    this.querySelectorAll(".mobile-facets__close-button").forEach((button) =>
      button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );
    this.querySelectorAll(".currency-selector-button").forEach((button) =>
      button.addEventListener("click", this.onCurrencyClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    //SV-filters
    const isAccordion = detailsElement.hasAttribute("data-accordion");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        if (isAccordion) {
          detailsElement.classList.toggle("menu-open");
          summaryElement.setAttribute(
            "aria-expanded",
            detailsElement.classList.contains("menu-open")
          );
        } else {
          detailsElement.classList.add("menu-opening");
          summaryElement.setAttribute("aria-expanded", true);
        }
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
              "transitionend",
              addTrapFocus
            );
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove("menu-opening");
      this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
        details.classList.remove("menu-opening");
      });
      document.body.classList.remove(
        `overflow-hidden-${this.dataset.breakpoint}`
      );
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCurrencyClick(event) {
    event.preventDefault();
  }

  onBackButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  onCloseButtonClick(event) {
    const subMenu = document.getElementById("Details-menu-drawer-container");
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
    this.closeSubmenu(subMenu);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector('.section-header');
    this.borderOffset =
      this.borderOffset ||
      this.closest(".header-wrapper").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }
}

customElements.define("header-drawer", HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this)
    );
    this.addEventListener("keyup", (event) => {
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        if (event.target.nodeName === "MODAL-DIALOG") this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class WishlistModalDialog extends ModalDialog {
  constructor() {
    super();
    this.productTitle = this.querySelector("[data-product-title]");
    this.swymButtons = document.querySelectorAll("[data-swym-button]");
    this.swymButtons.forEach((button) =>
      button.addEventListener("click", this.onSwymButtonClick.bind(this), {
        once: true,
      })
    );
  }

  onSwymButtonClick(event) {
    if (
      this.dataset.customer === "true" ||
      sessionStorage.getItem("wishlistModalHasOpened") === "true"
    )
      return;
    if (
      this.productTitle != null &&
      event.currentTarget.dataset.productTitle != null
    )
      this.productTitle.textContent = event.currentTarget.dataset.productTitle;
    this.show(event.currentTarget);
    sessionStorage.setItem("wishlistModalHasOpened", "true");
  }
}
customElements.define("wishlist-modal-dialog", WishlistModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      const deferredElement = this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      );
      if (focus) deferredElement.focus();
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientWidth > 0
    );
    this.sliderLastItem =
      this.sliderItemsToShow[this.sliderItemsToShow.length - 1];
    if (this.sliderItemsToShow.length === 0) return;
    this.slidesPerPage = Math.floor(
      this.slider.clientWidth / this.sliderItemsToShow[0].clientWidth
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollLeft / this.sliderLastItem.clientWidth) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0])) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (this.isSlideVisible(this.sliderLastItem)) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (
      element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
      element.offsetLeft >= this.slider.scrollLeft
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollLeft + step * this.sliderLastItem.clientWidth
        : this.slider.scrollLeft - step * this.sliderLastItem.clientWidth;
    this.slider.scrollTo({
      left: this.slideScrollPosition,
    });
  }
}

customElements.define("slider-component", SliderComponent);

class VerticalSliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientHeight > 0
    );
    this.sliderLastItem =
      this.sliderItemsToShow[this.sliderItemsToShow.length - 1];
    if (this.sliderItemsToShow.length === 0) return;
    this.slidesPerPage = Math.floor(
      this.slider.clientHeight / this.sliderItemsToShow[0].clientHeight
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollTop / this.sliderLastItem.clientHeight) + 1;
    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (this.isSlideVisible(this.sliderItemsToShow[0])) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (this.isSlideVisible(this.sliderLastItem)) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientHeight + this.slider.scrollTop - offset;

    return (
      element.offsetTop + element.clientHeight <= lastVisibleSlide &&
      element.offsetTop >= this.slider.scrollTop
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;

    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollTop + step * this.sliderLastItem.clientHeight
        : this.slider.scrollTop - step * this.sliderLastItem.clientHeight;
    this.slider.scrollTo({
      top: this.slideScrollPosition,
    });
  }
}

customElements.define("vertical-slider-component", VerticalSliderComponent);

class SlideshowComponent extends SliderComponent {
  constructor() {
    super();
    this.sliderControlWrapper = this.querySelector(".slider-buttons");
    this.enableSliderLooping = true;

    if (!this.sliderControlWrapper) return;

    this.sliderFirstItemNode = this.slider.querySelector(".slideshow__slide");
    if (this.sliderItemsToShow.length > 0) this.currentPage = 1;

    this.sliderControlLinksArray = Array.from(
      this.sliderControlWrapper.querySelectorAll(".slider-counter__link")
    );
    this.sliderControlLinksArray.forEach((link) =>
      link.addEventListener("click", this.linkToSlide.bind(this))
    );
    this.slider.addEventListener("scroll", this.setSlideVisibility.bind(this));
    this.setSlideVisibility();

    if (this.slider.getAttribute("data-autoplay") === "true")
      this.setAutoPlay();
  }

  setAutoPlay() {
    this.sliderAutoplayButton = this.querySelector(".slideshow__autoplay");
    this.autoplaySpeed = this.slider.dataset.speed * 1000;

    this.sliderAutoplayButton.addEventListener(
      "click",
      this.autoPlayToggle.bind(this)
    );
    this.addEventListener("mouseover", this.focusInHandling.bind(this));
    this.addEventListener("mouseleave", this.focusOutHandling.bind(this));
    this.addEventListener("focusin", this.focusInHandling.bind(this));
    this.addEventListener("focusout", this.focusOutHandling.bind(this));

    this.play();
    this.autoplayButtonIsSetToPlay = true;
  }

  onButtonClick(event) {
    super.onButtonClick(event);
    const isFirstSlide = this.currentPage === 1;
    const isLastSlide = this.currentPage === this.sliderItemsToShow.length;

    if (!isFirstSlide && !isLastSlide) return;

    if (isFirstSlide && event.currentTarget.name === "previous") {
      this.slideScrollPosition =
        this.slider.scrollLeft +
        this.sliderFirstItemNode.clientWidth * this.sliderItemsToShow.length;
    } else if (isLastSlide && event.currentTarget.name === "next") {
      this.slideScrollPosition = 0;
    }
    this.slider.scrollTo({
      left: this.slideScrollPosition,
    });
  }

  update() {
    super.update();
    this.sliderControlButtons = this.querySelectorAll(".slider-counter__link");
    this.prevButton.removeAttribute("disabled");

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove("slider-counter__link--active");
      link.removeAttribute("aria-current");
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add(
      "slider-counter__link--active"
    );
    this.sliderControlButtons[this.currentPage - 1].setAttribute(
      "aria-current",
      true
    );
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    const focusedOnAutoplayButton =
      event.target === this.sliderAutoplayButton ||
      this.sliderAutoplayButton.contains(event.target);
    if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
    this.play();
  }

  focusInHandling(event) {
    const focusedOnAutoplayButton =
      event.target === this.sliderAutoplayButton ||
      this.sliderAutoplayButton.contains(event.target);
    if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
      this.play();
    } else if (this.autoplayButtonIsSetToPlay) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute("aria-live", "off");
    clearInterval(this.autoplay);
    this.autoplay = setInterval(
      this.autoRotateSlides.bind(this),
      this.autoplaySpeed
    );
  }

  pause() {
    this.slider.setAttribute("aria-live", "polite");
    clearInterval(this.autoplay);
  }

  togglePlayButtonState(pauseAutoplay) {
    if (pauseAutoplay) {
      this.sliderAutoplayButton.classList.add("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.playSlideshow
      );
    } else {
      this.sliderAutoplayButton.classList.remove("slideshow__autoplay--paused");
      this.sliderAutoplayButton.setAttribute(
        "aria-label",
        window.accessibilityStrings.pauseSlideshow
      );
    }
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length
        ? 0
        : this.slider.scrollLeft +
          this.slider.querySelector(".slideshow__slide").clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const button = item.querySelector("a");
      if (index === this.currentPage - 1) {
        if (button) button.removeAttribute("tabindex");
        item.setAttribute("aria-hidden", "false");
        item.removeAttribute("tabindex");
      } else {
        if (button) button.setAttribute("tabindex", "-1");
        item.setAttribute("aria-hidden", "true");
        item.setAttribute("tabindex", "-1");
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.sliderFirstItemNode.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) +
          1 -
          this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define("slideshow-component", SlideshowComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton("", "", true);
    this.updatePickupAvailability();
    this.removeErrorMessage();
    this.filterThumbnails();

    if (!this.currentVariant) {
      this.toggleAddButton("", "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.updateShareUrl();
      //SV-
      this.updateLowStock();
      document.dispatchEvent(
        new CustomEvent("variant:change", {
          detail: { currentVariant: this.currentVariant },
        })
      );
    }
  }

  updateLowStock() {
    let $lowStock = document.querySelector(".low-stock-warning");
    if ($lowStock) {
      let quantity = this.currentVariant.inventory_quantity;
      let trigger = JSON.parse($lowStock.dataset.trigger);
      $lowStock.querySelector(".qty").textContent = `${quantity} unit${
        quantity > 1 ? "s" : ""
      }`;
      $lowStock.classList.toggle(
        "hidden",
        !(quantity > 0 && quantity <= trigger)
      );
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  filterThumbnails() {
    if (
      this.currentVariant.featured_image != null &&
      this.currentVariant.featured_image.alt != null
    ) {
      //hide all thumbnails
      document
        .querySelectorAll("[data-thumbnail-color]")
        .forEach(function (img) {
          img.style.display = "none";
        });

      //then show thumbnails for selected color
      var selected_color = this.currentVariant.featured_image.alt;
      var thumbnail_selector = document.querySelectorAll(
        '[data-thumbnail-color="' + selected_color + '"]'
      );
      thumbnail_selector.forEach(function (img) {
        img.style.display = "block";
      });
    } else {
      //fallback - show ALL thumbnails
      document
        .querySelectorAll("[data-thumbnail-color]")
        .forEach(function (img) {
          img.style.display = "block";
        });
    }
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;

    const mediaGalleries = document.querySelectorAll(
      `#MediaGallery-${this.dataset.section}`
    );

    mediaGalleries.forEach((mediaGallery) => {
      mediaGallery.setActiveMedia(
        `${this.dataset.section}-${this.currentVariant.featured_media.id}`,
        true
      );
    });

    const modalContent = document.querySelector(
      `#ProductModal-${this.dataset.section} .product-media-modal__content`
    );
    const newMediaModal = modalContent.querySelector(
      `[data-media-id="${this.currentVariant.featured_media.id}"]`
    );
    modalContent.prepend(newMediaModal);
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateShareUrl() {
    const shareButton = document.getElementById(
      `Share-${this.dataset.section}`
    );
    if (!shareButton) return;
    shareButton.updateUrl(
      `${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    fetch(
      `${this.dataset.url}?variant=${this.currentVariant.id}&section_id=${this.dataset.section}`
    )
      .then((response) => response.text())
      .then((responseText) => {
        const id = `price-${this.dataset.section}`;
        const html = new DOMParser().parseFromString(responseText, "text/html");
        const destination = document.getElementById(id);
        const source = html.getElementById(id);

        if (source && destination) destination.innerHTML = source.innerHTML;

        const price = document.getElementById(`price-${this.dataset.section}`);

        if (price) price.classList.remove("visibility-hidden");
        this.toggleAddButton(
          !this.currentVariant.available,
          window.variantStrings.soldOut
        );
      });
  }

  toggleAddButton() {
    // const productForm = document.getElementById(`product-form-${this.dataset.section}`);
    // if (!productForm) return;
    // const addButton = productForm.querySelector('[name="add"]');
    // const addButtonText = productForm.querySelector('[name="add"] > span');

    // if (!addButton) return;

    // if (disable) {
    //   addButton.setAttribute('disabled', 'disabled');
    //   if (text) addButtonText.textContent = text;
    // } else {
    //   addButton.removeAttribute('disabled');
    //   addButtonText.textContent = window.variantStrings.addToCart;
    // }

    // if (!modifyClass) return;

    // change to account for "glitchy" looking add to cart vs. sold out buttons

    const inStock = document.querySelector(".in-stock");
    const soldOut = document.querySelector(".sold-out");

    if (this.currentVariant.available) {
      soldOut.style.display = "none";
      inStock.style.display = "block";
    } else {
      inStock.style.display = "none";
      soldOut.style.display = "block";
    }
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      return Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      ).value;
    });
  }
}

customElements.define("variant-radios", VariantRadios);

class TabComponent extends HTMLElement {
  constructor() {
    super();
    this.tabButtons = Array.from(this.querySelectorAll('[data-tab="button"]'));
    this.tabContents = Array.from(
      this.querySelectorAll('[data-tab="content"]')
    );

    if (
      this.tabButtons.length == 0 ||
      this.tabContents.length == 0 ||
      this.tabButtons.length != this.tabContents.length
    ) {
      console.log(
        "[TabComponent] No tab buttons, no tab contents, or number of buttons and content containers do not match"
      );
      return;
    }

    this.activateTab(0);

    // Attach click event listeners to each tab
    this.tabButtons.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        this.activateTab(index);
      });
    });
  }

  activateTab(index) {
    if (this.activeTab != null) {
      this.tabButtons[this.activeTab].classList.remove("active");
      this.tabContents[this.activeTab].classList.remove("active");
    }

    this.tabButtons[index].classList.add("active");
    this.tabContents[index].classList.add("active");
    this.activeTab = index;
  }
}

customElements.define("tab-component", TabComponent);

class CountdownTimer extends HTMLElement {
  constructor() {
    super();
    this.daysContainer = this.querySelector('[data-timer="days"]');
    this.hoursContainer = this.querySelector('[data-timer="hours"]');
    this.minutesContainer = this.querySelector('[data-timer="minutes"]');
    this.secondsContainer = this.querySelector('[data-timer="seconds"]');

    this.endDate = this.dataset.timerEndDate;
    this.endTime = this.dataset.timerEndTime;
    this.endDateAndTime = Date.parse(`${this.endDate} ${this.endTime}-04:00`);

    this.countdown = setInterval(this.updateTimer.bind(this), 1000);
  }

  updateTimer() {
    this.now = new Date().getTime();
    this.diff = this.endDateAndTime - this.now;

    this.days = Math.floor(this.diff / (1000 * 60 * 60 * 24));
    this.hours = Math.floor(this.diff / (1000 * 60 * 60));
    this.mins = Math.floor(this.diff / (1000 * 60));
    this.secs = Math.floor(this.diff / 1000);

    this.updateView();

    if (this.diff < 0) {
      clearInterval(this.countdown);
      this.style.display = "none";
      // location.reload();
    }
  }

  updateView() {
    if (this.daysContainer != null) {
      this.daysContainer.innerText = this.days;
    }

    if (this.hoursContainer != null) {
      this.hoursContainer.innerText = String(
        this.hours - this.days * 24
      ).padStart(2, "0");
    }

    if (this.minutesContainer != null) {
      this.minutesContainer.innerText = String(
        this.mins - this.hours * 60
      ).padStart(2, "0");
    }

    if (this.secondsContainer != null) {
      this.secondsContainer.innerText = String(
        this.secs - this.mins * 60
      ).padStart(2, "0");
    }
  }
}

customElements.define("countdown-timer", CountdownTimer);

// Wishlist:
class SFLWrapper extends TabComponent {
  constructor() {
    super();
    this.SFLFetchTriggerButton = this.querySelector("[data-sfl-fetch-trigger]");
    this.SFLList =
      this.querySelector("cart-sfl") || this.querySelector("page-sfl");

    if (this.SFLFetchTriggerButton != null && this.SFLList != null) {
      this.SFLFetchTriggerButton.addEventListener(
        "click",
        function () {
          if (this.SFLListHasBeenInitialized == true) return;
          this.SFLList.fetchSFL();
        }.bind(this)
      );
    }

    // Debugging Init & Fetch Buttons {% endcomment %}
    this.initButton = this.querySelector('[data-btn-type="init"]');
    this.fetchButton = this.querySelector('[data-btn-type="fetch"]');

    if (this.initButton != null) {
      this.initButton.addEventListener(
        "click",
        this.initSaveForLater.bind(this)
      );
    }

    if (this.fetchButton != null) {
      this.fetchButton.addEventListener(
        "click",
        function () {
          this.SFLList.fetchSFL();
        }.bind(this)
      );
    }
  }

  initSaveForLater() {
    let onSuccess = function (response) {
      localStorage.setItem("SFLListID", response?.list?.lid);
    };

    if (!window.SwymCallbacks) {
      window.SwymCallbacks = [];
    }
    window.SwymCallbacks.push(this.swymCallback.bind(this));
    // _swat.SaveForLater.init(onSuccess, this.onError); {% endcomment %}
  }

  swymCallback(swat) {
    swat.SaveForLater.init(onSuccess, this.onError);
  }

  showMessage(message, container) {
    const successMessage = document.createElement("sfl-cart-message");
    successMessage.innerHTML = message;

    const SFLMessageContainer = this.querySelector(
      `[data-sfl-message="${container}"]`
    );
    if (SFLMessageContainer != null) {
      SFLMessageContainer.appendChild(successMessage);
    }
  }
}

customElements.define("sfl-wrapper", SFLWrapper);

document.addEventListener("DOMContentLoaded", function () {
  // Cart drawer functionality:
  document
    .querySelector(".cart-close")
    .addEventListener("click", function (event) {
      closeCart();
    });

  document
    .querySelector(".cart-bg")
    .addEventListener("click", function (event) {
      closeCart();
    });

  function closeCart() {
    document.querySelector(".cart-drawer").classList.remove("active");
    document.querySelector(".cart-bg").classList.remove("active");
    document.querySelector("body").classList.remove("noscroll");
    // Swym forces a overflow hidden class.
    document.body.classList.remove("swym-modal-active");
  }

  document
    .querySelector("[data-cart-toggle]")
    .addEventListener("click", function (event) {
      document.querySelector(".cart-drawer").classList.add("active");
      document.querySelector(".cart-bg").classList.add("active");
      document.body.classList.add("noscroll");
    });

  document.documentElement.style.setProperty(
    "--header-height",
    document.querySelector(".header-wrapper").clientHeight + "px"
  );

  // Wordmark to logo fade in header
  window.addEventListener("scroll", () => {
    const checkpoint = 46;
    const currentScroll = window.scrollY;
    if (currentScroll <= checkpoint) {
      opacity = 1 - currentScroll / checkpoint;
      document.querySelector(".header__heading-logo").style.display = "block";
      document.querySelector(".scroll-logo").style.display = "none";
      document.querySelector("header").style.opacity = opacity;
    } else {
      opacity = 0;
      document.querySelector(".header__heading-logo").style.display = "none";
    }
    if (currentScroll >= checkpoint) {
      document.querySelector(".scroll-logo").style.display = "flex";
      opacity = -1 + currentScroll / checkpoint;
      document.querySelector("header").style.opacity = opacity;
    } else {
    }
    document.querySelector(".header__heading-logo").style.opacity = opacity;
    document.querySelector(".scroll-logo").style.opacity = opacity;
  });
});

class ProgressBar extends HTMLElement {
  constructor() {
    super();
    this.classList.add("loading");
    this.promotions = [];
    this.max = 0;
    this.cartTotal = Number.parseInt(this.dataset.cartTotal) / 100;
    this.bar = this.querySelector("[data-bar]");
    this.messages = this.querySelector("[data-messages]");
    this.proportion = this.dataset.proportion;
    console.log('shipScoutTestObject', window.shipScoutTestObject);
    if (window.shipScoutTestObject != null) {
      this.init();
    }
  }

  init() {
    this.getThemePromotions();
    this.getShipScoutPromotions();
    this.sortAndSetActivePromotion();
    this.createStepsAndBadges();
    this.createProgressBar();
    // this.displayMessage();
    this.classList.remove("loading");
  }

  getThemePromotions() {
    if(Shopify.country == 'US') {
      console.log('Country', Shopify.country, 'is US. Not adding theme promotions')
      return;
    }
    const promotions = this.querySelectorAll("[data-promotion]");
    // Create a Promotions Array of all the arrays.
    for (const promotion of promotions) {
      const threshold = Number.parseInt(promotion.dataset.threshold);
      this.promotions.push({
        title: promotion.dataset.title,
        threshold:
          Shopify.currency.active != null
            ? Math.ceil(threshold * Shopify.currency.rate)
            : threshold,
        messageText: promotion.dataset.messageText,
      });
    }
  }

  getShipScoutPromotions() {
    if(Shopify.country != 'US') {
      console.log('Country', Shopify.country,'is not US. Not adding ShipScout promotions')
      return;
    }
    // Add Ship Scout tests to promotions array.
    if (window.shipScoutTestObject == null) return; 
    this.promotions.push(window.shipScoutTestObject);
    console.log("Promotions Array", this.promotions);
  }

  sortAndSetActivePromotion() {
    // Sort Promotions Array in ascending order based on thresholds.
    function compare(a, b) {
      if (a.threshold < b.threshold) {
        return -1;
      }
      if (a.threshold > b.threshold) {
        return 1;
      }
      return 0;
    }
    this.promotions.sort(compare);

    // Set promotions as active, find max threshold, find current promotion.
    this.promotions.forEach((promotion) => {
      if (promotion.threshold <= this.cartTotal) {
        promotion.active = true;
      } else {
        promotion.active = false;
        if (this.currentPromotion == null) {
          this.currentPromotion = promotion;
        }
      }
      if (this.max < promotion.threshold) {
        this.max = promotion.threshold;
      }
    });
  }

  getCurrenctySymbol() {
    const currencyMap = {
      CAD: "$",
      USD: "$",
      AUD: "$",
      BRL: "R$",
      EUR: "€",
      HKD: "$",
      ILS: "₪",
      JPY: "¥",
      MXN: "$",
      NZD: "$",
      NOK: "kr",
      SGD: "$",
      KRW: "₩",
      GBP: "£",
    };

    return currencyMap[Shopify.currency.active] ?? Shopify.currency.active;
  }

  createStepsAndBadges() {
    const firstStep = document.createElement("div");
    firstStep.classList.add("progress-bar__step");
    firstStep.classList.add("progress-bar__step--dot");
    firstStep.style.left = "0%";
    this.bar.append(firstStep);

    this.promotions.forEach((promotion, i) => {
      const step = document.createElement("div");
      step.innerHTML = `<svg aria-hidden="true" focusable="false" role="presentation" class="progress-bar__checkmark" viewBox="0 0 7.8 6.3" fill="none"><path d="M6.7,1L2.5,5.3L1,3.8"/></svg><svg aria-hidden="true" focusable="false" role="presentation" class="progress-bar__lock" fill="none" viewBox="0 0 12 14" xml:space="preserve"><path d="M6,0C1,0,1,6,1,6H0v8h12V6h-1C11,6,11,0,6,0z M6,2c3,0,3,4,3,4H3C3,6,3,2,6,2z"/></svg>`;
      step.classList.add("progress-bar__step");
      step.classList.add("progress-bar__step--icon");

      // Build Step Caption
      const stepCaption = document.createElement("div");
      stepCaption.classList.add("progress-bar__step-caption");
      stepCaption.textContent = `${this.getCurrenctySymbol()}${
        promotion.threshold
      }`;
      step.appendChild(stepCaption);

      const left =
        this.proportion === "equidistant"
          ? ((i + 1) / this.promotions.length) * 100
          : (promotion.threshold / this.max) * 100;
      step.style.left = `${left}%`;
      if (promotion.active) step.classList.add("progress-bar__step--active");
      if (i == this.promotions.length - 1)
        step.classList.add("progress-bar__step--last");
      this.bar.append(step);

      // Build and attach message
      const message = document.createElement("div");
      message.classList.add("progress-bar__message");
      message.innerHTML = promotion.active
        ? `You've unlocked <span>${promotion.messageText}</span>!`
        : `You're ${this.getCurrenctySymbol()}${
            promotion.threshold - this.cartTotal
          } away from <span>${promotion.messageText}</span>!`;

      if (this.currentPromotion === promotion)
        message.classList.add("progress-bar__message--current");
      this.messages.append(message);

      // Add listener to step
      step.addEventListener(
        "click",
        function () {
          this.messages.children.forEach((message) => {
            message.classList.remove("progress-bar__message--current");
          });
          message.classList.add("progress-bar__message--current");
        }.bind(this)
      );
    });

    // Add current message class to last message if none are current
    const currentMessage = this.messages.querySelector(
      ".progress-bar__message--current"
    );
    if (currentMessage == null) {
      this.messages.lastElementChild.classList.add(
        "progress-bar__message--current"
      );
    }
  }

  createProgressBar() {
    const innerProgressBar = document.createElement("div");
    innerProgressBar.classList.add("progress-bar__inner-bar");
    let width = 0;
    if (this.proportion === "equidistant") {
      let currentThreshold = 0;
      for (let i = 0; i < this.promotions.length; i++) {
        if (this.promotions[i].active) {
          width += 100 / this.promotions.length;
          currentThreshold = this.promotions[i].threshold;
        } else {
          width +=
            ((this.cartTotal - currentThreshold) /
              (this.promotions[i].threshold - currentThreshold)) *
            (100 / this.promotions.length);
          break;
        }
      }
    } else {
      width = (this.cartTotal / this.max) * 100;
    }
    innerProgressBar.style.width = `${width >= 100 ? 100 : width}%`;
    this.bar.append(innerProgressBar);
  }
}

customElements.define("progress-bar", ProgressBar);

document.documentElement.className = document.documentElement.className.replace(
  "no-js",
  "js"
);
if (Shopify.designMode) {
  document.documentElement.classList.add("shopify-design-mode");
}