if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cartNotification = document.querySelector("cart-notification");


        // SFL 
        this.SFLWrapper = this.closest('sfl-wrapper');

        // SV - Low Stock & Bell
        let productJsonData = this.querySelector("[data-product-json]");

        // SV's code should not run if this is a product card (Standard, SFL or Wishlist);
        if (productJsonData != null) {
          let _this = this;
          document.addEventListener("variant:change", (e) => {
            _this.product.currentVariant = e.detail.currentVariant;
            this.UpdateSizeAvailability();
          });

          this.ConvertStringToJS(productJsonData.content.textContent);
          this.product = product;
          document.dispatchEvent(
            new CustomEvent("variant:change", {
              detail: { currentVariant: this.product.currentVariant },
            })
          );

          this.InitEventHandlers();
        }
        // SV - Low Stock & Bell - end
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        const submitButton = this.querySelector('[type="submit"]');
        if (submitButton.classList.contains("loading")) return;

        this.handleErrorMessage();
        this.cartNotification.setActiveElement(document.activeElement);

        submitButton.setAttribute("aria-disabled", true);
        submitButton.classList.add("loading");
        this.querySelector(".loading-overlay__spinner").classList.remove(
          "hidden"
        );

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        formData.append(
          "sections",
          this.cartNotification
            .getSectionsToRender()
            .map((section) => section.id)
        );
        formData.append("sections_url", window.location.pathname);
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
              return;
            }

            this.cartNotification.renderContents(response);
            // added for minicart
            document.querySelector(".cart-drawer").classList.add("active");
            document.querySelector(".cart-bg").classList.add("active");
            document
              .querySelector("cart-items")
              ?.classList.toggle("is-empty", response.item_count === 0);
            document
              .getElementById("main-cart-items")
              ?.classList.toggle("is-empty", response.item_count === 0);
            
            const cartFooters = document.querySelectorAll('[data-cart-footer]');
            if (cartFooters.length > 0) {
              cartFooters.forEach( footer => {
                console.log('Footer updated: ', footer);
                footer.classList.toggle("is-empty", response.item_count === 0);
              });
            } else {
              console.log('No footer found to update.')
            }
          
            // Wunderkind: 
            document.dispatchEvent(
              new CustomEvent("cart:item-added", {
                detail: { 
                  finalPrice: response.final_price },
              })
            );

            // SFL
            if (this.SFLWrapper != null) {
              const SFLCard = this.closest('[data-sfl-card]');
              if (SFLCard != null) {
                const removeButton = SFLCard.querySelector('remove-from-sfl-button');
                removeButton.removeFromSFL();
              }
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            submitButton.classList.remove("loading");
            submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading-overlay__spinner").classList.add(
              "hidden"
            );
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      ConvertStringToJS(str) {
        var script = document.createElement("script");
        script.text = str;
        document.head.appendChild(script).parentNode.removeChild(script);
      }

      UpdateSizeAvailability() {
        if (!this.form || !this.product) return;
        let currentVariant = this.product.currentVariant;
        let sizeOption = this.product.options_with_values.find(
          (opt) => opt.name == "Size"
        );

        // Prevents console.log error in Development Mode.
        if (sizeOption == null) return;

        let sizeOptionId = `option${sizeOption.position}`;

        let $product = this.form.closest(".product__info-container");
        let sizeVariants = sizeOption.values.map((size) => {
          return {
            value: size,
            variants: this.product.variants.filter(
              (v) => v[sizeOptionId] == size
            ),
          };
        });

        sizeVariants.forEach((size) => {
          let size_variant = size.variants.find((variant) => {
            let match_flag = true;
            this.product.options_with_values.forEach((option) => {
              let option_id = `option${option.position}`;
              if (
                option_id !== sizeOptionId &&
                variant[option_id] !== currentVariant[option_id]
              ) {
                match_flag = false;
              }
            });
            return match_flag;
          });

          let $size = $product.querySelector(`[data-value="${size.value}"]`);
          if ($size) {
            $size.classList.toggle("isSoldout", !size_variant.available);
          }
        });

        let $btn_outofstock = document.querySelector(".btn-outofstock");
        if ($btn_outofstock) {
          $btn_outofstock.classList.toggle("hidden", currentVariant.available);
        }
      }

      CheckBISModal() {
        let bis_modal_t = setInterval(() => {
          let $bis_frame = document.querySelector("#klaviyo-bis-iframe");
          let isModalClosed = $bis_frame.style.display == "none";
          if (isModalClosed) {
            document.body.classList.remove("noscroll");
            clearInterval(bis_modal_t);
          }
        }, 100);
      }

      InitEventHandlers() {
        let sizeOption = this.product.options_with_values.find(
          (opt) => opt.name == "Size"
        );

        // Prevents console.log error in Development Mode.
        if (sizeOption == null) return;

        let sizeOptionId = `option${sizeOption.position}`;

        let $product = this.form.closest(".product__info-container");
        let sizeClickNotify =
          JSON.parse($product.dataset.soldout_hover) || false;
        let sizeVariants = sizeOption.values.map((size) => {
          return {
            value: size,
            variants: this.product.variants.filter(
              (v) => v[sizeOptionId] == size
            ),
          };
        });

        let OpenBISModal = () => {
          document.querySelector(".klaviyo-bis-trigger").click();
          this.CheckBISModal();
        };

        sizeVariants.forEach((size) => {
          let $size = $product.querySelector(`[data-value="${size.value}"]`);
          if (sizeClickNotify) {
            if ($size) {
              $size.addEventListener("click", (e) => {
                if (!$size.classList.contains("isSoldout")) return;
                setTimeout(OpenBISModal);
              });
            }
          }
        });

        let $btn_outofstock = document.querySelector(
          ".btn-outofstock:not(.init)"
        );
        if ($btn_outofstock) {
          $btn_outofstock.addEventListener("click", OpenBISModal);
        }

        // Klaviyo fix after opening modal
        document
          .querySelectorAll('[data-type="add-to-cart-form"]')
          .forEach(($form) => {
            $form.addEventListener("click", (e) => {
              if (e.target.classList.contains("klaviyo-bis-trigger")) {
                this.CheckBISModal();
              }
            });
          });
      }
    }
  );
}
