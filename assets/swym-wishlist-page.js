class RemoveFromWishlistButton extends HTMLElement {
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

    this.removeButton = this.querySelector("button");
    if (this.removeButton == null) return;
    this.removeButton.addEventListener(
      "click",
      this.deleteFromWishlist.bind(this)
    );
  }

  deleteFromWishlist(event) {
    if (event != null) event.preventDefault();

    function onError(error) {
      // Error is an xhrObject
      console.log("[WL] Error: ", error);
    }

    function onSuccess(deletedProduct) {
      console.log("[WL] Successfully deleted the Product", deletedProduct);

      const event = new CustomEvent("wishlist:render-wishlist");
      document.dispatchEvent(event);
    }

    function swymCallback(swat) {
      swat.deleteFromList(
        localStorage.getItem("WishlistID"),
        this.products[0],
        onSuccess.bind(this),
        onError
      );
    }

    if (!window.SwymCallbacks) {
      window.SwymCallbacks = [];
    }
    window.SwymCallbacks.push(swymCallback.bind(this));
  }
}

customElements.define("remove-from-wishlist-button", RemoveFromWishlistButton);

class PageWishlist extends HTMLElement {
  constructor() {
    super();

    this.createWishlistCard = this.createWishlistCard.bind(this);
    this.renderWishlist = this.renderWishlist.bind(this);

    this.fetchWishlist.call(this);

    document.addEventListener(
      "wishlist:render-wishlist",
      function () {
        console.log("[WL] Rendering through Event: ", this);
        this.fetchWishlist();
      }.bind(this)
    );
  }

  fetchWishlist() {
    function onFetchSuccess(lists) {
      console.log("[WL] Fetch successful response: ", lists);
      const [list] = lists;
      localStorage.setItem("WishlistID", list.lid);
      console.log(
        "[WL]: Wihslist ID has been set to: ",
        localStorage.getItem("WishlistID")
      );

      const { listcontents } = list;
      this.toggleLoadingState(listcontents);
      this.renderWishlist(listcontents);
    }

    function onError(error) {
      // Error is an xhrObject
      console.log("[WL] Error: ", error);
    }

    function swymCallback(swat) {
      swat.fetchLists({
        callbackFn: onFetchSuccess.bind(this),
        errorFn: onError,
      });
    }
    console.log("[WL] Fetching...");
    if (!window.SwymCallbacks) {
      window.SwymCallbacks = [];
    }
    window.SwymCallbacks.push(swymCallback.bind(this));
  }

  toggleLoadingState({ length }) {
    if (length > 0) {
      document
        .querySelectorAll("[data-empty-wishlist], [data-loading-wishlist]")
        .forEach((element) => element.classList.add("hidden"));
    } else if (length === 0) {
      document.querySelector("[data-loading-wishlist]").classList.add("hidden");
      document
        .querySelector("[data-empty-wishlist]")
        .classList.remove("hidden");
    }
  }

  getCardTemplateToRender() {
    const template = document.createElement("template");
    template.innerHTML = `
      <li class="grid__item">
        <wishlist-card class="sfl-page__card underline-links-hover card-wrapper">
          <remove-from-wishlist-button class="sfl-page__remove-button-wrapper">
            <button class="sfl-page__remove-button">
              X
            </button>
          </remove-from-wishlist-button>
          <wishlist-card-images class="media media--square"></wishlist-card-images>
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
                  <wishlist-variant-select class="wishlist-card__variant-select"></wishlist-variant-select>
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
        </wishlist-card>
      </li>
    `;
    return template;
  }

  renderWishlist(items) {
    let fragment = document.createDocumentFragment();
    for (const item of items) {
      let card = this.createWishlistCard(item);
      fragment.appendChild(card);
    }

    const targetToRender = this.querySelector("[data-render-wishlist]");

    if (targetToRender != null) {
      targetToRender.innerHTML = "";
      targetToRender.appendChild(fragment);
    } else {
      console.log(
        "[WL] There is no container to render wishlist cards."
      );
    }
  }

  createWishlistCard(product) {
    const card = this.getCardTemplateToRender().content.cloneNode(true);
    const title = card.querySelector("[data-product-title]");
    const images = card.querySelector("wishlist-card-images");
    const variants = card.querySelector("wishlist-variant-select");
    const links = card.querySelectorAll("a");
    const price = card.querySelector("[data-product-price]");
    const currency = card.querySelector("[data-product-currency]");
    const removeButton = card.querySelector("remove-from-wishlist-button");
    const variantIdInput = card.querySelector('product-form input[name="id"]');
    const addToCartButton = card.querySelector("product-form button");
    // const addToCartButtonText = addToCartButton.querySelector(
    //   "[data-sfl-add-to-cart-submit-text]"
    // );

    title.textContent = product.dt;

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

    // let isProductInCart = _swat.platform.isInDeviceCart(product.epi);

    // addToCartButton.disabled = isProductInCart;
    // addToCartButtonText.textContent = isProductInCart
    //   ? "Added to cart"
    //   : "Add to cart";

    fetch(`${product.du}.json`)
      .then((res) => res.json())
      .then((data) => {
        const productData = data.product;

        // Create a options array in variants...
        for (const variant of productData.variants) {
          variant.options = [];
          if (variant.option1 != null) variant.options.push(variant.option1);
          if (variant.option2 != null) variant.options.push(variant.option2);
          if (variant.option3 != null) variant.options.push(variant.option3);
        }

        // Find current variant info. product.epi is the Variant ID provided by Swym.
        const currentVariant = productData.variants.find( variant => { 
          return variant.id === product.epi 
        });

        if (productData.images.length > 0) {
          const imageSet = new Set();

          for (let i = 0; i < productData.images.length; i++) {
            if (imageSet.has(productData.images[i].alt) === false) {
              const image = document.createElement("img");
              image.src = productData.images[i].src;
              image.alt = productData.images[i].alt;
              if (i > 0) {
                // image.loading = "lazy";
                // image.style.zIndex = -1;
                image.style.display = 'none';
              }
              imageSet.add(productData.images[i].alt);
              images.appendChild(image);
            }
          }
        }

        if (productData.options.length > 0) {
          for (const option of productData.options) {
            if(option.values.length > 1) {
              const optionLabel = document.createElement("label");
              optionLabel.textContent = option.name;

              const optionElement = document.createElement("select");
              optionElement.name = `options[${option.name}]`;
              for (const value of option.values) {
                const valueElement = document.createElement("option");
                valueElement.textContent = value;
                valueElement.value = value;
                if (currentVariant.options.includes(value)) {
                  valueElement.selected = true;
                }
                optionElement.appendChild(valueElement);
              }
              optionLabel.appendChild(optionElement);
              variants.appendChild(optionLabel);
            }
          }
        }

        variants.init(productData.variants);
      });

    return card;
  }
}

customElements.define("page-wishlist", PageWishlist);

class WishlistVariantSelect extends HTMLElement {
  constructor() {
    super();

    this.form = this.closest("form");
    this.addEventListener("change", this.onVariantChange);
  }

  init(variants, ) {
    this.variants = variants;
    this.onVariantChange();
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    // this.toggleAddButton("", "", true);
    // this.updatePickupAvailability();
    // this.removeErrorMessage();
    // this.filterThumbnails();

    if (!this.currentVariant) {
      // this.toggleAddButton("", "", true);
      // this.setUnavailable();
    } else {
      // this.updateMedia();
      // this.updateURL();
      this.updateVariantInput();
      // this.renderProductInfo();
      // this.updateShareUrl();
      //SV-
      // this.updateLowStock();
      // document.dispatchEvent(
      //   new CustomEvent("variant:change", {
      //     detail: { currentVariant: this.currentVariant },
      //   })
      // );
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.variants.find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateVariantInput() {
    const input = this.form.querySelector('input[name="id"]');
    input.value = this.currentVariant.id;
    input.dispatchEvent(
      new CustomEvent("card:variant-change", {
        bubbles: true,
        detail: {
          optionName: this.currentVariant.option1, // By convention currentVariant.option1 is the Color / Colour option.
        },
      })
    );
  }
}

customElements.define("wishlist-variant-select", WishlistVariantSelect);

class WishlistCard extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "card:variant-change",
      function (event) {
        this.filterThumbnails(event.detail.optionName);
      }.bind(this)
    );
  }

  filterThumbnails(optionName) {
    // We must handleize because the theme uses alt tags in the following format stainless-steel-quartz for Stainless Steel \ Quartz
    function handleize(string) {
      return string.toLowerCase().replace(/[^a-zA-Z]+/g, "-");
    }

    this.images = this.querySelectorAll("img");

    for (let i = 0; i < this.images.length; i++) {
      if (this.images[i].alt === handleize(optionName)) {
        this.images[i].style.display = 'block';
        // this.images[i].style.zIndex = 1;
      } else {
        this.images[i].style.display = 'none';
        // this.images[i].style.zIndex = -1;
      }
    }
  }
}

customElements.define("wishlist-card", WishlistCard);
