class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      this.closest("cart-items").updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById(
      "shopping-cart-line-item-status"
    );

    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]')
    ).reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0
    );

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener("change", this.debouncedOnChange.bind(this));
  }

  async render(callback, options) {
    // This method is only necessary for Aftership.
    options = options || {};
    const {line, enableLoading = true} = options;
    const requestSectionUrl = new URL(window.location.origin + window.location.pathname);
    requestSectionUrl.searchParams.append("sections", this.getSectionsToRender().map((section) => section.section));
    requestSectionUrl.searchParams.append("sections_url", window.location.pathname);
    enableLoading && this.enableLoading(line);

    try {
      const req = await Promise.all([fetch(requestSectionUrl), fetch('/cart.js')]);
      const [sections, cart] = await Promise.all(req.map(item => item.json()));
      this.classList.toggle("is-empty", cart.item_count === 0);
      const cartFooters = document.querySelectorAll("[data-cart-footer]");

      if (cartFooters.length > 0) {
        cartFooters.forEach(footer => footer.classList.toggle("is-empty", cart.item_count === 0))
      };

      this.getSectionsToRender().forEach((section) => {
        const elementToReplace =
          document
            .getElementById(section.id)
            .querySelector(section.selector) ||
          document.getElementById(section.id);


        elementToReplace.innerHTML = this.getSectionInnerHTML(
          sections[section.section],
          section.selector
        );
      });

      if(callback && typeof callback === 'function') {
        callback();
      }
      
      this.disableLoading();

      // Wunderkind
      document.dispatchEvent(
        new CustomEvent("cart:updated", {
          detail: { 
            totalPrice: cart.total_price,
            itemCount: cart.item_count,
          },
        })
      );
    }
    catch (e){
      this.querySelectorAll(".loading-overlay").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
      document.getElementById("cart-errors").textContent =
          window.cartStrings.error;
      this.disableLoading();
    }
  }

  onChange(event) {
    this.updateQuantity(
      event.target.dataset.index,
      event.target.value,
      document.activeElement.getAttribute("name")
    );
  }

  getSectionsToRender() {
    return [
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "cart-drawer",
        section: "cart-drawer",
        selector: "cart-items .js-contents",
      },
      {
        id: "cart-drawer",
        section: "cart-drawer",
        selector: "#cart-drawer-footer .js-contents",
      },
    ];
  }

  updateQuantity(line, quantity, name) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        
        this.classList.toggle("is-empty", parsedState.item_count === 0);
        const cartFooters = document.querySelectorAll("[data-cart-footer]");

        if (cartFooters.length > 0) {
          cartFooters.forEach(footer => footer.classList.toggle("is-empty", parsedState.item_count === 0))
        };

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document
              .getElementById(section.id)
              .querySelector(section.selector) ||
            document.getElementById(section.id);

          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });

        this.updateLiveRegions(line, parsedState.item_count);
        const lineItem = document.getElementById(`CartItem-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`))
          lineItem.querySelector(`[name="${name}"]`).focus();
        this.disableLoading();

        // Wunderkind
        document.dispatchEvent(
          new CustomEvent("cart:updated", {
            detail: { 
              totalPrice: parsedState.total_price,
              itemCount: parsedState.item_count,
            },
          })
        );
      })
      .catch(() => {
        this.querySelectorAll(".loading-overlay").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
        document.getElementById("cart-errors").textContent =
          window.cartStrings.error;
        this.disableLoading();
      });
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      document
        .getElementById(`Line-item-error-${line}`)
        .querySelector(".cart-item__error-text").innerHTML =
        window.cartStrings.quantityError.replace(
          "[quantity]",
          document.getElementById(`Quantity-${line}`).value
        );
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus = document.getElementById("cart-live-region-text");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    document
      .getElementById("main-cart-items")
      .classList.add("cart__items--disabled");
    this.querySelectorAll(`#CartItem-${line} .loading-overlay`).forEach(
      (overlay) => overlay.classList.remove("hidden")
    );
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading() {
    document
      .getElementById("main-cart-items")
      .classList.remove("cart__items--disabled");
  }
}

customElements.define("cart-items", CartItems);

// Wishlist: 
class SFLCartMessage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.classList.add("cart-with-sfl__message");
    setTimeout(this.show.bind(this), 100);
  }

  show() {
    this.classList.add("show");
    setTimeout(this.hide.bind(this), 3000);
  }

  hide() {
    this.classList.remove("show");
    setTimeout(
      function () {
        this.remove();
      }.bind(this),
      400
    );
  }
}

customElements.define("sfl-cart-message", SFLCartMessage);

class AddToSFLButton extends HTMLElement {
  constructor() {
    super();
    /* 
      du = Canonical URL of the product being added.
      epi = Variant ID of the product being added.
      empi = Product ID of the product being added. 
    */

    this.products = [
      {
        du: this.dataset.du,
        empi: this.dataset.empi,
        epi: this.dataset.epi,
      },
    ];

    this.addButton = this.querySelector('button[data-btn-type="add"]');
    this.addButton.addEventListener("click", this.addToSFL.bind(this));
    this.SFLWrapper = this.closest("sfl-wrapper");
    this.cartSFL = this.SFLWrapper.querySelector("cart-sfl");
  }

  addToSFL(event) {
    event.preventDefault();

    if (!window.SwymCallbacks) {
      window.SwymCallbacks = [];
    }
    window.SwymCallbacks.push(this.swymCallback.bind(this));
  }

  onError(error) {
    // Error is an xhrObject
    // TO DO : ADD MESSAGE {% endcomment %}
    console.log("[SFL] Error: ", error);
  }

  onSuccess(response) {
    let message;
    if (response.itemsadded.length > 0) {
      message = `<div><span class="underline">${response.itemsadded[0].dt}</span> was added to <span class="underline">save for later</span></div>`;
    } else if (response.itemsfailed.length > 0) {
      message = `<div>There was an error adding <span class="underline">${response.itemsdeleted[0].dt}</span> to <span class="underline">save for later</span></div>`;
    }

    this.SFLWrapper.showMessage(message, "cart");
    // No need to dispatch an event to render SFL components since it will be dispatched once item is removed from Cart.
    this.removeFromCart();
  }

  swymCallback(swat) {
    swat.SaveForLater.add(
      localStorage.getItem("SFLListID"),
      this.products,
      this.onSuccess.bind(this),
      this.onError
    );
  }

  removeFromCart() {
    const cartItems =
      this.closest("cart-items") || this.closest("cart-drawer-items");
    cartItems.updateQuantity(this.dataset.index, 0);
  }
}

customElements.define("add-to-sfl-button", AddToSFLButton);

class RemoveFromSFLButton extends HTMLElement {
  constructor() {
    super();
    
    /* 
      du = Canonical URL of the product being added.
      epi = Variant ID of the product being added.
      empi = Product ID of the product being added. 
    */

    this.products = [
      {
        du: this.dataset.du,
        empi: this.dataset.empi,
        epi: this.dataset.epi,
      },
    ];

    this.SFLWrapper = this.closest("sfl-wrapper");
    this.SFLList = this.closest("cart-sfl") || this.closest("page-sfl");
    this.removeButton = this.querySelector("button");

    if (this.removeButton == null) return;
    this.removeButton.addEventListener("click", this.removeFromSFL.bind(this));
  }

  removeFromSFL(event) {
    if (event != null) event.preventDefault();

    // _swat.SaveForLater.remove(localStorage.getItem('SFLListID'), this.products, this.onSuccess.bind(this), this.onError); {% endcomment %}

    if (!window.SwymCallbacks) {
      window.SwymCallbacks = [];
    }
    window.SwymCallbacks.push(this.swymCallback.bind(this));
  }

  onError(error) {
    // Error is an xhrObject
    console.log("[SFL] Error: ", error);
  }

  onSuccess(response) {
    let message;
    if (response.itemsdeleted.length > 0) {
      message = `<div><span class="underline">${response.itemsdeleted[0].dt}</span> was removed from <span class="underline">save for later</span></div>`;
    } else if (response.itemsfailed.lenght > 0) {
      message = `<div>There was an error adding <span class="underline">${response.itemsfailed[0].dt}</span> to <span class="underline">save for later</span></div>`;
    }

    this.SFLWrapper.showMessage(
      message,
      "sfl"
    );

    // this.SFLList.renderSFL();
    const event = new CustomEvent("wishlist:render-sfl");
    document.dispatchEvent(event);
  }

  swymCallback(swat) {
    swat.SaveForLater.remove(
      localStorage.getItem("SFLListID"),
      this.products,
      this.onSuccess.bind(this),
      this.onError
    );
  }
}

customElements.define("remove-from-sfl-button", RemoveFromSFLButton);

class CartSFL extends HTMLElement {
  constructor() {
    super();

    this.createSFLCard = this.createSFLCard.bind(this);
    this.renderSFL = this.renderSFL.bind(this);

    document.addEventListener(
      "wishlist:render-sfl",
      function () {
        this.fetchSFL();
      }.bind(this)
    );
  }

  connectedCallback() {
    this.style.display = "block";
  }

  fetchSFL() {
    console.log("[SFL] Starting fetch...");

    if (!window.SwymCallbacks) {
      window.SwymCallbacks = [];
    }
    window.SwymCallbacks.push(this.swymCallback.bind(this));
  }

  swymCallback(swat) {
    swat.SaveForLater.fetch(
      localStorage.getItem("SFLListID"),
      this.onFetchSuccess.bind(this),
      this.onError
    );
  }

  onError(error) {
    // Error is an xhrObject
    console.error("[SFL] Error: ", error);
  }

  onFetchSuccess({ items }) {
    console.log("[SFL] Fetch successful. Rendering...");
    this.toggleLoadingState(items);
    this.renderSFL(items);
  }

  toggleLoadingState({ length }) {
    if (length > 0) {
      document
        .querySelectorAll("[data-empty-sfl]")
        .forEach(container => container.classList.add("hidden"))
    } else if (length == 0) {
      document
        .querySelectorAll("[data-empty-sfl]")
        .forEach(container => container.classList.remove("hidden"))
    }
  }

  getCardTemplateToRender() {
    const template = document.createElement("template");
    template.innerHTML = `
      <tr class="cart-item" role="row" data-sfl-card>
        <td class="cart-item__media" role="cell" headers="CartDrawer-ColumnProductImage">
          <a href="" class="cart-item__link" tabindex="-1" aria-hidden="true"> </a>
          <img class="cart-item__image" src="" alt="" loading="lazy" width="150" height="150">
        </td>
        <td class="cart-item__details" role="cell" headers="CartDrawer-ColumnProduct">
          <div>
          <a href="" class="cart-item__name h4 break" data-product-title></a>
          <div class="product-option" data-product-details></div>
          </div>
          <div class="product-option">
            <span data-product-currency></span><span data-product-price></span>
          </div>
        </td>
        <td class="cart-item__quantity" role="cell" headers="CartDrawer-ColumnQuantity">
          <div class="cart-item__quantity-wrapper">
            <product-form>
              <div class="product-form__error-message-wrapper" role="alert" hidden>
                <svg
                  aria-hidden="true"
                  focusable="false"
                  role="presentation"
                  class="icon icon-error"
                  viewBox="0 0 13 13"
                >
                  <circle cx="6.5" cy="6.50049" r="5.5" stroke="white" stroke-width="2"/>
                  <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" stroke-width="0.7"/>
                  <path d="M5.87413 3.52832L5.97439 7.57216H7.02713L7.12739 3.52832H5.87413ZM6.50076 9.66091C6.88091 9.66091 7.18169 9.37267 7.18169 9.00504C7.18169 8.63742 6.88091 8.34917 6.50076 8.34917C6.12061 8.34917 5.81982 8.63742 5.81982 9.00504C5.81982 9.37267 6.12061 9.66091 6.50076 9.66091Z" fill="white"/>
                  <path d="M5.87413 3.17832H5.51535L5.52424 3.537L5.6245 7.58083L5.63296 7.92216H5.97439H7.02713H7.36856L7.37702 7.58083L7.47728 3.537L7.48617 3.17832H7.12739H5.87413ZM6.50076 10.0109C7.06121 10.0109 7.5317 9.57872 7.5317 9.00504C7.5317 8.43137 7.06121 7.99918 6.50076 7.99918C5.94031 7.99918 5.46982 8.43137 5.46982 9.00504C5.46982 9.57872 5.94031 10.0109 6.50076 10.0109Z" fill="white" stroke="#EB001B" stroke-width="0.7">
                </svg>
                <span class="product-form__error-message"></span>
              </div>
              <form method="post" action="/cart/add" id="" accept-charset="UTF-8" class="form" enctype="multipart/form-data" novalidate="novalidate" data-type="add-to-cart-form">
                <input type="hidden" name="form_type" value="product">
                <input type="hidden" name="utf8" value="✓">
                <input type="hidden" name="id">
                <button 
                  id="" 
                  type="submit" 
                  name="add"
                  class="sfl-add-to-cart-button button button--full-width button--secondary"
                >
                  <span data-sfl-add-to-cart-submit-text>Add to cart</span>
                  <span class="sold-out-message hidden">
                    Sold out
                  </span>
                  <div class="loading-overlay__spinner hidden">
                    <svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                      <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
                    </svg>
                  </div>
                </button>
              </form>
            </product-form>
            <remove-from-sfl-button>
              <button class="button button--tertiary button--tertiary--cart" aria-label="">
                REMOVE
              </button>
            </remove-from-sfl-button>
          </div>
        </td>
      </tr>
      `;
    return template;
  }

  renderSFL(items) {
    let fragment = document.createDocumentFragment();
    for (const item of items) {
      let card = this.createSFLCard(item);
      fragment.appendChild(card);
    }

    this.targetToRender = this.querySelector("[data-render-sfl]");

    if (this.targetToRender != null) {
      this.targetToRender.innerHTML = "";
      this.targetToRender.appendChild(fragment);
    } else {
      console.log("[SFL] There are no container to render SFL cards.");
    }
  }

  createSFLCard(product) {
    const card = this.getCardTemplateToRender().content.cloneNode(true);
    const title = card.querySelector("[data-product-title]");
    const details = card.querySelector("[data-product-details]");
    const image = card.querySelector("img");
    const links = card.querySelectorAll("a");
    const price = card.querySelector("[data-product-price]");
    const currency = card.querySelector("[data-product-currency]");
    const removeButton = card.querySelector("remove-from-sfl-button");
    const variantIdInput = card.querySelector('product-form input[name="id"]');
    const addToCartButton = card.querySelector("product-form button");
    const addToCartButtonText = addToCartButton.querySelector(
      "[data-sfl-add-to-cart-submit-text]"
    );

    title.textContent = product.dt;

    if (details != null) details.textContent = product.vi;

    image.src = product.iu;
    image.alt = product.dt;

    links.forEach((link) => {
      link.href = product.du;
      link.ariaLabel = product.dt;
    });

    price.textContent = product.pr;

    if (Shopify.currency.active != null && currency != null) {
      // TO DO: Add to the curencyMap all the current currencies. {% endcomment %}
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
      currency.textContent =
        currencyMap[Shopify.currency.active] ?? Shopify.currency.active;
      price.textContent = Math.ceil(product.pr * Shopify.currency.rate);
    }

    removeButton.dataset.du = product.du;
    removeButton.dataset.empi = product.empi;
    removeButton.dataset.epi = product.epi;

    variantIdInput.value = product.epi;

    let isProductInCart = _swat.platform.isInDeviceCart(product.epi);

    addToCartButton.disabled = isProductInCart;
    addToCartButtonText.textContent = isProductInCart
      ? "Added to cart"
      : "Add to cart";

    return card;
  }
}

customElements.define("cart-sfl", CartSFL);

const PageSFLTemplate = document.createElement("template");

class PageSFL extends CartSFL {
  constructor() {
    super();
  }

  getCardTemplateToRender() {
    const template = document.createElement("template");
    template.innerHTML = `
        <li class="grid__item sfl-page__card underline-links-hover card-wrapper" data-sfl-card>
          <remove-from-sfl-button class="sfl-page__remove-button-wrapper">
            <button class="sfl-page__remove-button">
              X
            </button>
          </remove-from-sfl-button>
          <div class="media media--square">
            <img>
          </div>
          <div class="card-information">
            <div class="card-information__wrapper card-information__wrapper--wishlist">
              <h3 class="card-information__text h5">
                <a class="card-wrapper-link" data-product-title>
                </a>
              </h3>
              <div class="price">
                <div class="price__regular">
                  <span class="visually-hidden visually-hidden--inline">Regular price</span>
                  <span class="price-item price-item--regular">
                    <span data-product-currency></span><span data-product-price></span>
                  </span>
                </div>
              </div>
            </div>
            <div class="quick-add">
              <product-form>
                <div class="product-form__error-message-wrapper" role="alert" hidden>
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    role="presentation"
                    class="icon icon-error"
                    viewBox="0 0 13 13"
                  >
                    <circle cx="6.5" cy="6.50049" r="5.5" stroke="white" stroke-width="2"/>
                    <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" stroke-width="0.7"/>
                    <path d="M5.87413 3.52832L5.97439 7.57216H7.02713L7.12739 3.52832H5.87413ZM6.50076 9.66091C6.88091 9.66091 7.18169 9.37267 7.18169 9.00504C7.18169 8.63742 6.88091 8.34917 6.50076 8.34917C6.12061 8.34917 5.81982 8.63742 5.81982 9.00504C5.81982 9.37267 6.12061 9.66091 6.50076 9.66091Z" fill="white"/>
                    <path d="M5.87413 3.17832H5.51535L5.52424 3.537L5.6245 7.58083L5.63296 7.92216H5.97439H7.02713H7.36856L7.37702 7.58083L7.47728 3.537L7.48617 3.17832H7.12739H5.87413ZM6.50076 10.0109C7.06121 10.0109 7.5317 9.57872 7.5317 9.00504C7.5317 8.43137 7.06121 7.99918 6.50076 7.99918C5.94031 7.99918 5.46982 8.43137 5.46982 9.00504C5.46982 9.57872 5.94031 10.0109 6.50076 10.0109Z" fill="white" stroke="#EB001B" stroke-width="0.7">
                  </svg>
                  <span class="product-form__error-message"></span>
                </div>
                <form method="post" action="/cart/add" id="" accept-charset="UTF-8" class="form" enctype="multipart/form-data" novalidate="novalidate" data-type="add-to-cart-form">
                  <input type="hidden" name="form_type" value="product">
                  <input type="hidden" name="utf8" value="✓">
                  <input type="hidden" name="id">
                  <button 
                    id="" 
                    type="submit" 
                    name="add"
                    class="quick-add__submit button button--full-width button--secondary"
                  >
                    <span data-sfl-add-to-cart-submit-text>Add to cart</span>
                    <span class="sold-out-message hidden">
                      Sold out
                    </span>
                    <div class="loading-overlay__spinner hidden">
                      <svg aria-hidden="true" focusable="false" role="presentation" class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                        <circle class="path" fill="none" stroke-width="6" cx="33" cy="33" r="30"></circle>
                      </svg>
                    </div>
                  </button>
                </form>
              </product-form>
            </div>
          </div>
        </li>
      `;
    return template;
  }
}

customElements.define("page-sfl", PageSFL);

document.addEventListener('apz:added', async () => {
  let cart = document.querySelector('cart-items');
  cart.render();
});