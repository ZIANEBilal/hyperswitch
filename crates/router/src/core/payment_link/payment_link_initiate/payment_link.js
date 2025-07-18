// @ts-check

/**
 * UTIL FUNCTIONS
 */

function decodeUri(uri) {
  try {
    var uriStr = decodeURIComponent(uri);
    return JSON.parse(uriStr);
  } catch (e) {
    console.error("Error decoding and parsing string URI:", e);
    return uri;
  }
}

function adjustLightness(hexColor, factor) {
  // Convert hex to RGB
  var r = parseInt(hexColor.slice(1, 3), 16);
  var g = parseInt(hexColor.slice(3, 5), 16);
  var b = parseInt(hexColor.slice(5, 7), 16);

  // Convert RGB to HSL
  var hsl = rgbToHsl(r, g, b);

  // Adjust lightness
  hsl[2] = Math.max(0, Math.min(100, hsl[2] * factor));

  // Convert HSL back to RGB
  var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);

  // Convert RGB to hex
  var newHexColor = rgbToHex(rgb[0], rgb[1], rgb[2]);

  return newHexColor;
}
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h = 1,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}
function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  var r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    var hue2rgb = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}
function rgbToHex(r, g, b) {
  var toHex = function (c) {
    var hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Ref - https://github.com/onury/invert-color/blob/master/lib/cjs/invert.js
 */
function padz(str, len) {
  if (len === void 0) {
    len = 2;
  }
  return (new Array(len).join("0") + str).slice(-len);
}
function hexToRgbArray(hex) {
  if (hex.slice(0, 1) === "#") hex = hex.slice(1);
  var RE_HEX = /^(?:[0-9a-f]{3}){1,2}$/i;
  if (!RE_HEX.test(hex)) throw new Error('Invalid HEX color: "' + hex + '"');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}
function toRgbArray(c) {
  if (!c) throw new Error("Invalid color value");
  if (Array.isArray(c)) return c;
  return typeof c === "string" ? hexToRgbArray(c) : [c.r, c.g, c.b];
}
function getLuminance(c) {
  var i, x;
  var a = [];
  for (i = 0; i < c.length; i++) {
    x = c[i] / 255;
    a[i] = x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function invertToBW(color, bw, asArr) {
  var DEFAULT_BW = {
    black: "#090302",
    white: "#FFFFFC",
    threshold: Math.sqrt(1.05 * 0.05) - 0.05,
  };
  var options = bw === true ? DEFAULT_BW : Object.assign({}, DEFAULT_BW, bw);
  return getLuminance(color) > options.threshold
    ? asArr
      ? hexToRgbArray(options.black)
      : options.black
    : asArr
      ? hexToRgbArray(options.white)
      : options.white;
}
function invert(color, bw) {
  if (bw === void 0) {
    bw = false;
  }
  color = toRgbArray(color);
  if (bw) return invertToBW(color, bw);
  return (
    "#" +
    color
      .map(function (c) {
        return padz((255 - c).toString(16));
      })
      .join("")
  );
}

/**
 * UTIL FUNCTIONS END HERE
 */

// @ts-ignore
{{ payment_details_js_script }}

// @ts-ignore
window.state = {
  prevHeight: window.innerHeight,
  prevWidth: window.innerWidth,
  isMobileView: window.innerWidth <= 1199,
  currentScreen: "payment_link",
};

var widgets = null;
var unifiedCheckout = null;
// @ts-ignore
var encodedPaymentDetails = window.__PAYMENT_DETAILS;
var paymentDetails = decodeUri(encodedPaymentDetails);
var pub_key = paymentDetails.pub_key;
var hyper = null;

// @ts-ignore
const translations = getTranslations(paymentDetails.locale);

var isFramed = false;
try {
  isFramed = window.parent.location !== window.location;

  // If parent's window object is restricted, DOMException is
  // thrown which concludes that the webpage is iframed
} catch (err) {
  isFramed = true;
}

/**
 * Trigger - on boot
 * Use - emit latest payment status to parent window
 */
function emitPaymentStatus(paymentDetails) {
  var message = {
    payment: {
      status: paymentDetails.status,
    }
  };

  window.parent.postMessage(message, "*");
}

/**
 * Trigger - init function invoked once the script tag is loaded
 * Use
 *  - Update document's title
 *  - Update document's icon
 *  - Render and populate document with payment details and cart
 *  - Initialize event listeners for updating UI on screen size changes
 *  - Initialize SDK
 **/
function boot() {
  // Emit latest payment status
  if (isFramed) {
    emitPaymentStatus(paymentDetails);
  }

  if (paymentDetails.display_sdk_only) {
    hide(".checkout-page")
    var sdkDisplayWidth = document.querySelector('.hyper-checkout-sdk');
    sdkDisplayWidth.style.width = '100vw';
  }
  else {
    var orderDetails = paymentDetails.order_details;
    if (orderDetails !== null) {
      var charges = 0;

      for (var i = 0; i < orderDetails.length; i++) {
        charges += parseFloat(orderDetails[i].amount * orderDetails[i].quantity);
      }
      orderDetails.push({
        "amount": (paymentDetails.amount - charges).toFixed(2),
        "product_img_link": "https://live.hyperswitch.io/payment-link-assets/cart_placeholder.png",
        "product_name": translations.miscellaneousCharges + "\n" +
          translations.miscellaneousChargesDetail,
        "quantity": null
      });
    }
  }

  if (paymentDetails.merchant_name) {
    document.title = "Payment requested by " + paymentDetails.merchant_name;
  }

  if (paymentDetails.merchant_logo) {
    var link = document.createElement("link");
    link.rel = "icon";
    link.href = paymentDetails.merchant_logo;
    link.type = "image/x-icon";
    document.head.appendChild(link);
  }

  // Render UI
  if (paymentDetails.display_sdk_only) {
    renderSDKHeader(paymentDetails);
    renderBranding(paymentDetails);
  }
  else {
    renderBackgroundImage(paymentDetails);
    renderPaymentDetails(paymentDetails);
    renderDynamicMerchantDetails(paymentDetails);
    renderCart(paymentDetails);
    renderDescription(paymentDetails);
    renderBranding(paymentDetails);
    renderSDKHeader(paymentDetails);
  }

  // Deal w loaders
  show("#sdk-spinner");
  hide("#page-spinner");
  hide("#unified-checkout");

  // Add event listeners
  initializeEventListeners(paymentDetails);

  // Initialize SDK
  // @ts-ignore
  if (window.Hyper) {
    initializeSDK();
  }

  // State specific functions
  // @ts-ignore
  if (window.state.isMobileView) {
    show("#hyper-footer");
    hide("#hyper-checkout-cart");
  } else {
    show("#hyper-checkout-cart");
  }
}
boot();

/**
 * Use - checks if a given value is an object
 * @param {any} val 
 * @returns {boolean}
 */
function isObject(val) {
  return val !== null && typeof val === "object" && Object.getPrototypeOf(val) === Object.prototype
}

/**
 * Use - add event listeners for changing UI on
 *        - Screen resize
 *        - Form inputs
 * @param {PaymentDetails} paymentDetails
 */
function initializeEventListeners(paymentDetails) {
  var primaryColor = paymentDetails.theme;
  var lighterColor = adjustLightness(primaryColor, 1.4);
  var darkerColor = adjustLightness(primaryColor, 0.8);
  var contrastBWColor = invert(primaryColor, true);
  var a = lighterColor.match(/[fF]/gi);
  var contrastingTone =
    Array.isArray(a) && a.length > 4 ? darkerColor : lighterColor;
  var hyperCheckoutNode = document.getElementById("hyper-checkout-payment");
  var hyperCheckoutCartImageNode = document.getElementById(
    "hyper-checkout-cart-image"
  );
  var hyperCheckoutFooterNode = document.getElementById(
    "hyper-checkout-payment-footer"
  );
  var submitButtonNode = document.getElementById("submit");
  var submitButtonLoaderNode = document.getElementById("submit-spinner");

  if (submitButtonLoaderNode instanceof HTMLSpanElement) {
    submitButtonLoaderNode.style.borderBottomColor = contrastingTone;
  }

  // Get locale for pay now
  var payNowButtonText = document.createElement("div");
  var payNowButtonText = document.getElementById('submit-button-text');
  var capture_type = paymentDetails.capture_method;
  if (payNowButtonText) {
    if (paymentDetails.payment_button_text) {
      payNowButtonText.textContent = paymentDetails.payment_button_text;
    } else if (paymentDetails.is_setup_mandate_flow || (paymentDetails.amount === "0.00" && paymentDetails.setup_future_usage_applied === "off_session")) {
      payNowButtonText.textContent = translations.addPaymentMethod;
    } else {
      payNowButtonText.textContent = capture_type === "manual" ? translations.authorizePayment : translations.payNow;

    }
  }

  if (submitButtonNode instanceof HTMLButtonElement) {
    var chosenColor = paymentDetails.payment_button_colour || primaryColor;
    submitButtonNode.style.color = paymentDetails.payment_button_text_colour || invert(chosenColor, true);
    submitButtonNode.style.backgroundColor = chosenColor;
  }

  if (hyperCheckoutCartImageNode instanceof HTMLDivElement) {
    hyperCheckoutCartImageNode.style.backgroundColor = contrastingTone;
  }

  if (window.innerWidth <= 1199) {
    if (hyperCheckoutNode instanceof HTMLDivElement) {
      hyperCheckoutNode.style.color = contrastBWColor;
    }
    if (hyperCheckoutFooterNode instanceof HTMLDivElement) {
      hyperCheckoutFooterNode.style.backgroundColor = contrastingTone;
    }
  } else if (window.innerWidth > 1199) {
    if (hyperCheckoutNode instanceof HTMLDivElement) {
      hyperCheckoutNode.style.color = "#333333";
    }
    if (hyperCheckoutFooterNode instanceof HTMLDivElement) {
      hyperCheckoutFooterNode.style.backgroundColor = "#F5F5F5";
    }
  }

  // @ts-ignore
  window.addEventListener("resize", function (event) {
    var currentHeight = window.innerHeight;
    var currentWidth = window.innerWidth;
    // @ts-ignore
    if (currentWidth <= 1199 && window.state.prevWidth > 1199) {
      hide("#hyper-checkout-cart");
      // @ts-ignore
      if (window.state.currentScreen === "payment_link") {
        show("#hyper-footer");
      }
      try {
        if (hyperCheckoutNode instanceof HTMLDivElement) {
          hyperCheckoutNode.style.color = contrastBWColor;
        }
        if (hyperCheckoutFooterNode instanceof HTMLDivElement) {
          hyperCheckoutFooterNode.style.backgroundColor = lighterColor;
        }
      } catch (error) {
        console.error("Failed to fetch primary-color, using default", error);
      }
      // @ts-ignore
    } else if (currentWidth > 1199 && window.state.prevWidth <= 1199) {
      // @ts-ignore
      if (window.state.currentScreen === "payment_link") {
        hide("#hyper-footer");
      }
      show("#hyper-checkout-cart");
      try {
        if (hyperCheckoutNode instanceof HTMLDivElement) {
          hyperCheckoutNode.style.color = "#333333";
        }
        if (hyperCheckoutFooterNode instanceof HTMLDivElement) {
          hyperCheckoutFooterNode.style.backgroundColor = "#F5F5F5";
        }
      } catch (error) {
        console.error("Failed to revert back to default colors", error);
      }
    }

    // @ts-ignore
    window.state.prevHeight = currentHeight;
    // @ts-ignore
    window.state.prevWidth = currentWidth;
    // @ts-ignore
    window.state.isMobileView = currentWidth <= 1199;
  });

  var paymentForm = document.getElementById("payment-form");
  if (paymentForm instanceof HTMLFormElement) {
    paymentForm.addEventListener("submit", function (event) {
      event.preventDefault();
      handleSubmit(event, paymentDetails);
    })
  }

  if (paymentDetails.enable_button_only_on_form_ready) {
    handleFormReadyForSubmission();
  }
}

function handleFormReadyForSubmission() {
  window.addEventListener("message", function (event) {
    // Event listener for updating the button rules
    if (event.origin == "{{sdk_origin}}") {
      if (isObject(event.data) && event.data["isFormReadyForSubmission"] !== null) {
        let isFormReadyForSubmission = event.data["isFormReadyForSubmission"];
        var submitButtonNode = document.getElementById("submit");
        if (submitButtonNode instanceof HTMLButtonElement) {
          if (isFormReadyForSubmission === false) {
            submitButtonNode.disabled = true;
            addClass("#submit", "not-ready");
            addClass("#submit", "disabled");
          } else if (isFormReadyForSubmission === true) {
            submitButtonNode.disabled = false;
            removeClass("#submit", "not-ready");
            removeClass("#submit", "disabled");
          }
        }
      }
    }
  });
}

/**
 * Trigger - post mounting SDK
 * Use - set relevant classes to elements in the doc for showing SDK
 **/
function showSDK(display_sdk_only, enable_button_only_on_form_ready) {
  if (!display_sdk_only) {
    show("#hyper-checkout-details");
  }
  show("#hyper-checkout-sdk");
  if (enable_button_only_on_form_ready) {
    addClass("#submit", "not-ready");
    addClass("#submit", "disabled");
    var submitButtonNode = document.getElementById("submit");
    if (submitButtonNode instanceof HTMLButtonElement) {
      submitButtonNode.disabled = true;
    }
  }
  show("#submit");
  show("#unified-checkout");
  hide("#sdk-spinner");
}

/**
 * Use - mount payment widget on the passed element
 * @param {String} id
 **/
function mountUnifiedCheckout(id) {
  if (unifiedCheckout !== null) {
    unifiedCheckout.mount(id);
  }
}

/**
 * Trigger - on clicking submit button
 * Uses
 *    - Trigger /payment/confirm through SDK
 *    - Toggle UI loaders appropriately
 *    - Handle errors and redirect to status page
 * @param {Event} e
 * @param {PaymentDetails} paymentDetails
 */
// @ts-ignore
function handleSubmit(e, paymentDetails) {
  // Update button loader
  hide("#submit-button-text");
  show("#submit-spinner");
  addClass("#submit", "processing");
  addClass("#submit", "disabled");
  var submitButtonNode = document.getElementById("submit");
  if (submitButtonNode instanceof HTMLButtonElement) {
    submitButtonNode.disabled = true;
  }

  hyper
    .confirmPayment({
      widgets: widgets,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: paymentDetails.return_url,
      },
    })
    .then(function (result) {
      var error = result.error;
      if (error) {
        if (error.type === "validation_error") {
          showMessage(error.message);
        } else {
          showMessage(translations.unexpectedError);
        }
      } else if (paymentDetails.skip_status_screen) {
        // Form query params
        var queryParams = {
          payment_id: paymentDetails.payment_id,
          status: result.status
        };
        var url = new URL(paymentDetails.return_url);
        var params = new URLSearchParams(url.search);
        // Attach query params to return_url
        for (var key in queryParams) {
          if (queryParams.hasOwnProperty(key)) {
            params.set(key, queryParams[key]);
          }
        }
        url.search = params.toString();
        window.top.location.href = url.toString();
      } else {
        redirectToStatus(paymentDetails);
      }
    })
    .catch(function (error) {
      console.error("Error confirming payment_intent", error);
    })
    .finally(() => {
      removeClass("#submit", "processing");
      hide("#submit-spinner");
      show("#submit-button-text");
      removeClass("#submit", "disabled");
      if (submitButtonNode instanceof HTMLButtonElement) {
        submitButtonNode.disabled = false;
      }
    });
}

function show(id) {
  removeClass(id, "hidden");
}
function hide(id) {
  addClass(id, "hidden");
}

function showMessage(msg) {
  show("#payment-message");
  addText("#payment-message", msg);
}

function addText(id, msg) {
  var element = document.querySelector(id);
  element.innerText = msg;
}

function addClass(id, className) {
  var element = document.querySelector(id);
  if (element instanceof HTMLElement) {
    element.classList.add(className);
  }
}

function removeClass(id, className) {
  var element = document.querySelector(id);
  if (element instanceof HTMLElement) {
    element.classList.remove(className);
  }
}

/**
 * Use - format date in "hh:mm AM/PM timezone MM DD, YYYY"
 * @param {Date} date
 **/
function formatDate(date) {
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  var hours = date.getHours();
  var minutes = date.getMinutes();
  // @ts-ignore
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var suffix = hours > 11 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  var day = date.getDate();
  var month = months[date.getMonth()];
  var year = date.getUTCFullYear();

  // @ts-ignore
  var locale = navigator.language || navigator.userLanguage;
  var timezoneShorthand = date
    .toLocaleDateString(locale, {
      day: "2-digit",
      timeZoneName: "long",
    })
    .substring(4)
    .split(" ")
    .reduce(function (tz, c) {
      return tz + c.charAt(0).toUpperCase();
    }, "");

  var formatted =
    hours +
    ":" +
    minutes +
    " " +
    suffix +
    " " +
    timezoneShorthand +
    "  " +
    month +
    " " +
    day +
    ", " +
    year;
  return formatted;
}

/**
 * Trigger - on boot
 * Uses
 *  - Render payment related details (header bit)
 *    - Amount
 *    - Merchant's name
 *    - Expiry
 * @param {PaymentDetails} paymentDetails
 **/
function renderPaymentDetails(paymentDetails) {
  // Create price node
  var priceNode = document.createElement("div");
  priceNode.className = "hyper-checkout-payment-price";
  priceNode.innerText = paymentDetails.currency + " " + paymentDetails.amount;

  // Create merchant name's node
  var merchantNameNode = document.createElement("div");
  merchantNameNode.className = "hyper-checkout-payment-merchant-name";
  merchantNameNode.innerText = translations.requestedBy + paymentDetails.merchant_name;

  // Create payment ID node
  var paymentIdNode = document.createElement("div");
  paymentIdNode.className = "hyper-checkout-payment-ref";
  paymentIdNode.innerText = translations.refId + paymentDetails.payment_id;

  // Create merchant logo's node
  var merchantLogoNode = document.createElement("img");
  merchantLogoNode.src = paymentDetails.merchant_logo;
  merchantLogoNode.setAttribute("height", "48");

  // Create expiry node
  var paymentExpiryNode = document.createElement("div");
  paymentExpiryNode.className = "hyper-checkout-payment-footer-expiry";
  var expiryDate = new Date(paymentDetails.session_expiry);
  var formattedDate = formatDate(expiryDate);
  paymentExpiryNode.innerText = translations.expiresOn + formattedDate;

  // Append information to DOM
  var paymentContextNode = document.getElementById(
    "hyper-checkout-payment-context"
  );
  if (paymentContextNode instanceof HTMLDivElement) {
    paymentContextNode.prepend(priceNode);
  }
  var paymentMerchantDetails = document.getElementById(
    "hyper-checkout-payment-merchant-details"
  );
  if (paymentMerchantDetails instanceof HTMLDivElement) {
    paymentMerchantDetails.append(merchantNameNode);
    paymentMerchantDetails.append(paymentIdNode);
  }
  var merchantImageNode = document.getElementById(
    "hyper-checkout-merchant-image"
  );
  if (merchantImageNode instanceof HTMLDivElement) {
    merchantImageNode.prepend(merchantLogoNode);
  }
  var footerNode = document.getElementById("hyper-checkout-payment-footer");
  if (footerNode instanceof HTMLDivElement) {
    footerNode.append(paymentExpiryNode);
  }
}

function renderDynamicMerchantDetails(paymentDetails) {
  var merchantDynamicDetails = document.getElementById(
    "hyper-checkout-payment-merchant-dynamic-details"
  );
  if (merchantDynamicDetails instanceof HTMLDivElement) {
    // add dynamic merchant details in the payment details section if present
    appendMerchantDetails(paymentDetails, merchantDynamicDetails);
  }
}

function appendMerchantDetails(paymentDetails, merchantDynamicDetails) {
  if (
    !(
      Array.isArray(paymentDetails.transaction_details) &&
      paymentDetails.transaction_details.length > 0
    )
  ) {
    return;
  }

  try {
    let merchantDetailsObject = paymentDetails.transaction_details;
    // sort the merchant details based on the position
    // if position is null, then it will be shown at the end
    merchantDetailsObject.sort((a, b) => {
      if (a.ui_configuration === null || a.ui_configuration.position === null)
        return 1;
      if (b.ui_configuration === null || b.ui_configuration.position === null)
        return -1;

      if (typeof a.ui_configuration.position === "number" && typeof b.ui_configuration.position === "number") {
        return a.ui_configuration.position - b.ui_configuration.position;
      }
      else return 0;
    });

    if (merchantDetailsObject.length > 0) {
      // show the dynamic merchant details container
      show("#hyper-checkout-payment-merchant-dynamic-details");
      // set min-height for the dynamic merchant details container
      merchantDynamicDetails.style.minHeight = "80px";
      // render a horizontal line above dynamic merchant details
      var horizontalLineContainer = document.getElementById(
        "hyper-checkout-payment-horizontal-line-container",
      );
      var horizontalLine = document.createElement("hr");
      horizontalLine.className = "hyper-checkout-payment-horizontal-line";
      if (horizontalLineContainer instanceof HTMLDivElement) {
        horizontalLineContainer.append(horizontalLine);
      }

      // max number of items to show in the merchant details
      let maxItemsInDetails = 50;
      for (var item of merchantDetailsObject) {
        var merchantData = document.createElement("div");
        merchantData.className = "hyper-checkout-payment-merchant-dynamic-data";
        var keyNode = document.createElement("span");
        keyNode.textContent = item.key;
        var valueNode = document.createElement("span");
        valueNode.textContent = item.value;
        // make the key and value bold if specified in the ui_configuration
        if (isObject(item.ui_configuration)) {
          if (item.ui_configuration.is_key_bold) {
            keyNode.style.fontWeight = "bold";
          }
          if (item.ui_configuration.is_value_bold) {
            valueNode.style.fontWeight = "bold";
          }
        }
        var separatorNode = document.createElement("span");
        separatorNode.textContent = " : ";
        merchantData.appendChild(keyNode);
        merchantData.appendChild(separatorNode);
        merchantData.appendChild(valueNode);

        merchantDynamicDetails.append(merchantData);
        if (--maxItemsInDetails === 0) {
          break;
        }
      }
    }
  }
  catch (error) {
    console.error("Error parsing merchant details", error);
  }
}

/**
 * Uses
 *    - Creates and appends description below the cart section (LAYOUT 1 / DEFAULT LAYOUT specification)
 * @param {String} merchantDescription 
 */
function renderDefaultLayout(merchantDescription) {
  var cartItemNode = document.getElementById("hyper-checkout-cart");
  if (cartItemNode instanceof HTMLDivElement) {
    var merchantDescriptionNode = document.createElement("div");
    merchantDescriptionNode.id = "hyper-checkout-merchant-description";
    merchantDescriptionNode.innerText = merchantDescription;
    cartItemNode.appendChild(merchantDescriptionNode);
    show("#hyper-checkout-merchant-description");
  }
}

/**
 * Uses
 *    - Renders description in the appropriate section based on the specified layout
 * @param {PaymentDetails} paymentDetails 
 */
function renderDescription(paymentDetails) {
  var detailsLayout = paymentDetails.details_layout;
  if (typeof paymentDetails.merchant_description === "string" && paymentDetails.merchant_description.length > 0) {
    switch (detailsLayout) {
      case "layout1": {
        renderDefaultLayout(paymentDetails.merchant_description);
        break;
      }
      case "layout2": {
        var paymentContextNode = document.getElementById("hyper-checkout-payment-context");
        if (paymentContextNode instanceof HTMLDivElement) {
          var merchantDescriptionNode = document.createElement("div");
          merchantDescriptionNode.id = "hyper-checkout-merchant-description";
          merchantDescriptionNode.innerText = paymentDetails.merchant_description;
          var merchantDetailsNode = document.getElementById("hyper-checkout-payment-merchant-details");
          if (merchantDetailsNode instanceof HTMLDivElement) {
            paymentContextNode.insertBefore(merchantDescriptionNode, merchantDetailsNode);
            show("#hyper-checkout-merchant-description");
          }
        }
        break;
      }
      default: {
        renderDefaultLayout(paymentDetails.merchant_description);
      }
    }
  }
}

/**
 * Uses
 *    - Creates and returns a div element with the HyperSwitch branding SVG
 * @param {String} wrapperId 
 * @returns {HTMLDivElement} brandingWrapperNode
 */
function createHyperSwitchBrandingSVGElement(wrapperId) {
  var brandingWrapperNode = document.createElement("div");
  brandingWrapperNode.id = wrapperId;
  brandingWrapperNode.innerHTML = '<svg class="fill-current" height="18" width="130"><use xlink:href="#hyperswitch-brand" x="0" y="0" height="18" width="130"></use></svg>';
  return brandingWrapperNode;
}

/**
 * Uses
 *    - Creates and appends HyperSwitch branding in appropriate sections based on the viewport dimensions (web vs mobile views)
 * @param {PaymentDetails} paymentDetails
 */
function renderBranding(paymentDetails) {
  if (paymentDetails.branding_visibility !== false) {
    // Append below cart section for web views
    var cartItemNode = document.getElementById("hyper-checkout-cart");
    if (cartItemNode instanceof HTMLDivElement) {
      var brandingWrapper = createHyperSwitchBrandingSVGElement("powered-by-hyper");
      cartItemNode.appendChild(brandingWrapper);
    }

    // Append in document's body for mobile views
    var mobileBrandingWrapper = createHyperSwitchBrandingSVGElement("hyper-footer");
    document.body.appendChild(mobileBrandingWrapper);
    if (!window.state.isMobileView) {
      hide("#hyper-footer");
    }
  }
}

/**
 * Uses
 *    - Renders background image in the payment details section
 * @param {PaymentDetails} paymentDetails 
 */
function renderBackgroundImage(paymentDetails) {
  var backgroundImage = paymentDetails.background_image;
  if (typeof backgroundImage === "object" && backgroundImage !== null) {
    var paymentDetailsNode = document.getElementById("hyper-checkout-details");
    if (paymentDetailsNode instanceof HTMLDivElement) {
      paymentDetailsNode.style.backgroundImage = "url(" + backgroundImage.url + ")";
      if (typeof backgroundImage.size === "string") {
        paymentDetailsNode.style.backgroundSize = backgroundImage.size;
      }
      if (typeof backgroundImage.position === "string") {
        paymentDetailsNode.style.backgroundPosition = backgroundImage.position;
      }
    }
  }
}

/**
 * Trigger - on boot
 * Uses
 *    - Render cart wrapper and items
 *    - Attaches an onclick event for toggling expand on the items list
 * @param {PaymentDetails} paymentDetails
 **/
function renderCart(paymentDetails) {
  var orderDetails = paymentDetails.order_details;

  // Cart items
  if (Array.isArray(orderDetails) && orderDetails.length > 0) {
    var cartNode = document.getElementById("hyper-checkout-cart");
    var cartItemsNode = document.getElementById("hyper-checkout-cart-items");
    var MAX_ITEMS_VISIBLE_AFTER_COLLAPSE =
      paymentDetails.max_items_visible_after_collapse;
    var yourCartText = document.createElement("span");
    var yourCartText = document.getElementById("your-cart-text");
    if (yourCartText) {
      yourCartText.textContent = translations.yourCart;
    }

    orderDetails.map(function (item, index) {
      if (index >= MAX_ITEMS_VISIBLE_AFTER_COLLAPSE) {
        return;
      }
      renderCartItem(
        item,
        paymentDetails,
        index !== 0 && index < MAX_ITEMS_VISIBLE_AFTER_COLLAPSE,
        // @ts-ignore
        cartItemsNode
      );
    });
    // Expand / collapse button
    var totalItems = orderDetails.length;
    if (totalItems > MAX_ITEMS_VISIBLE_AFTER_COLLAPSE) {
      var expandButtonNode = document.createElement("div");
      expandButtonNode.className = "hyper-checkout-cart-button";
      expandButtonNode.onclick = () => {
        handleCartView(paymentDetails);
      };
      var buttonImageNode = document.createElement("svg");
      buttonImageNode.id = "hyper-checkout-cart-button-arrow";
      var arrowDownImage = document.getElementById("arrow-down");
      if (arrowDownImage instanceof Object) {
        buttonImageNode.innerHTML = arrowDownImage.innerHTML;
      }
      var buttonTextNode = document.createElement("span");
      buttonTextNode.id = "hyper-checkout-cart-button-text";
      var hiddenItemsCount =
        orderDetails.length - MAX_ITEMS_VISIBLE_AFTER_COLLAPSE;
      buttonTextNode.innerText = translations.showMore + " (" + hiddenItemsCount + ")";
      expandButtonNode.append(buttonTextNode, buttonImageNode);
      if (cartNode instanceof HTMLDivElement) {
        cartNode.insertBefore(expandButtonNode, cartNode.lastElementChild);
      }
    }
  } else {
    hide("#hyper-checkout-cart-header");
    hide("#hyper-checkout-cart-items");
    hide("#hyper-checkout-cart-image");
  }
}

/**
 * Trigger - on cart render
 * Uses
 *    - Renders a single cart item which includes
 *      - Product image
 *      - Product name
 *      - Quantity
 *      - Single item amount
 * @param {OrderDetailsWithAmount} item
 * @param {PaymentDetails} paymentDetails
 * @param {boolean} shouldAddDividerNode
 * @param {HTMLDivElement} cartItemsNode
 **/
function renderCartItem(
  item,
  paymentDetails,
  shouldAddDividerNode,
  cartItemsNode,
) {
  // Wrappers
  var itemWrapperNode = document.createElement("div");
  itemWrapperNode.className = "hyper-checkout-cart-item";
  var nameAndQuantityWrapperNode = document.createElement("div");
  nameAndQuantityWrapperNode.className = "hyper-checkout-cart-product-details";
  // Image
  var productImageNode = document.createElement("img");
  productImageNode.setAttribute("width", 56);
  productImageNode.setAttribute("height", 56);

  productImageNode.className = "hyper-checkout-cart-product-image";
  productImageNode.src = item.product_img_link;
  // Product title
  var productNameNode = document.createElement("div");
  productNameNode.className = "hyper-checkout-card-item-name";
  productNameNode.innerText = item.product_name;
  // Product quantity
  if (item.quantity !== null) {
    var quantityNode = document.createElement("div");
    quantityNode.className = "hyper-checkout-card-item-quantity";
    quantityNode.innerText = translations.quantity + ": " + item.quantity;
  }
  // Product price
  var priceNode = document.createElement("div");
  priceNode.className = "hyper-checkout-card-item-price";
  priceNode.innerText = paymentDetails.currency + " " + item.amount;
  // Append items

  nameAndQuantityWrapperNode.append(productNameNode);
  if (item.quantity !== null) {
    // @ts-ignore
    nameAndQuantityWrapperNode.append(quantityNode);
  }

  itemWrapperNode.append(
    productImageNode,
    nameAndQuantityWrapperNode,
    priceNode
  );

  if (shouldAddDividerNode) {
    var dividerNode = document.createElement("div");
    dividerNode.className = "hyper-checkout-cart-item-divider";
    cartItemsNode.append(dividerNode);
  }
  cartItemsNode.append(itemWrapperNode);
}

/**
 * Trigger - on toggling expansion of cart list
 * Uses
 *    - Render or delete items based on current state of the rendered cart list
 * @param {PaymentDetails} paymentDetails
 **/
function handleCartView(paymentDetails) {
  var orderDetails = paymentDetails.order_details;
  var MAX_ITEMS_VISIBLE_AFTER_COLLAPSE =
    paymentDetails.max_items_visible_after_collapse;
  var itemsHTMLCollection = document.getElementsByClassName(
    "hyper-checkout-cart-item"
  );
  var dividerHTMLCollection = document.getElementsByClassName(
    "hyper-checkout-cart-item-divider"
  );
  var cartItems = [].slice.call(itemsHTMLCollection);
  var dividerItems = [].slice.call(dividerHTMLCollection);
  var isHidden = cartItems.length < orderDetails.length;
  var cartItemsNode = document.getElementById("hyper-checkout-cart-items");
  var cartButtonTextNode = document.getElementById(
    "hyper-checkout-cart-button-text"
  );
  var cartButtonImageNode = document.getElementById(
    "hyper-checkout-cart-button-arrow"
  );
  if (isHidden) {
    if (Array.isArray(orderDetails)) {
      orderDetails.map(function (item, index) {
        if (index < MAX_ITEMS_VISIBLE_AFTER_COLLAPSE) {
          return;
        }
        renderCartItem(
          item,
          paymentDetails,
          index >= MAX_ITEMS_VISIBLE_AFTER_COLLAPSE,
          cartItemsNode
        );
      });
    }
    if (cartItemsNode instanceof HTMLDivElement) {
      cartItemsNode.style.maxHeight = cartItemsNode.scrollHeight + "px";

      cartItemsNode.style.height = cartItemsNode.scrollHeight + "px";
    }

    if (cartButtonTextNode instanceof HTMLSpanElement) {
      cartButtonTextNode.innerText = translations.showLess;
    }

    var arrowUpImage = document.getElementById("arrow-up");
    if (
      cartButtonImageNode instanceof Object &&
      arrowUpImage instanceof Object
    ) {
      cartButtonImageNode.innerHTML = arrowUpImage.innerHTML;
    }
  } else {
    if (cartItemsNode instanceof HTMLDivElement) {
      cartItemsNode.style.maxHeight = "300px";
      cartItemsNode.style.height = "290px";
      cartItemsNode.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(function () {
        cartItems.map(function (item, index) {
          if (index < MAX_ITEMS_VISIBLE_AFTER_COLLAPSE) {
            return;
          }
          if (cartItemsNode instanceof HTMLDivElement) {
            cartItemsNode.removeChild(item);
          }
        });
        dividerItems.map(function (item, index) {
          if (index < MAX_ITEMS_VISIBLE_AFTER_COLLAPSE - 1) {
            return;
          }
          if (cartItemsNode instanceof HTMLDivElement) {
            cartItemsNode.removeChild(item);
          }
        });
      }, 300);
    }
    setTimeout(function () {
      var hiddenItemsCount =
        orderDetails.length - MAX_ITEMS_VISIBLE_AFTER_COLLAPSE;
      if (cartButtonTextNode instanceof HTMLSpanElement) {
        cartButtonTextNode.innerText = translations.showMore + " (" + hiddenItemsCount + ")";
      }
      var arrowDownImage = document.getElementById("arrow-down");
      if (
        cartButtonImageNode instanceof Object &&
        arrowDownImage instanceof Object
      ) {
        cartButtonImageNode.innerHTML = arrowDownImage.innerHTML;
      }
    }, 250);
  }
}

/**
 * Use - hide cart when in mobile view
 **/
function hideCartInMobileView() {
  window.history.back();
  var cartNode = document.getElementById("hyper-checkout-cart");
  if (cartNode instanceof HTMLDivElement) {
    cartNode.style.animation = "slide-to-right 0.3s linear";
    cartNode.style.right = "-582px";
  }
  setTimeout(function () {
    hide("#hyper-checkout-cart");
  }, 300);
}

/**
 * Use - show cart when in mobile view
 **/
function viewCartInMobileView() {
  window.history.pushState("view-cart", "");
  var cartNode = document.getElementById("hyper-checkout-cart");
  if (cartNode instanceof HTMLDivElement) {
    cartNode.style.animation = "slide-from-right 0.3s linear";
    cartNode.style.right = "0px";
  }
  show("#hyper-checkout-cart");
}

/**
 * Trigger - on boot
 * Uses
 *  - Render SDK header node
 *    - merchant's name
 *    - currency + amount
 * @param {PaymentDetails} paymentDetails
 **/
function renderSDKHeader(paymentDetails) {
  // SDK headers' items
  var sdkHeaderItemNode = document.createElement("div");
  sdkHeaderItemNode.className = "hyper-checkout-sdk-items";
  var sdkHeaderMerchantNameNode = document.createElement("div");
  sdkHeaderMerchantNameNode.className = "hyper-checkout-sdk-header-brand-name";
  sdkHeaderMerchantNameNode.innerText = paymentDetails.merchant_name;
  var sdkHeaderAmountNode = document.createElement("div");
  sdkHeaderAmountNode.className = "hyper-checkout-sdk-header-amount";
  sdkHeaderAmountNode.innerText =
    paymentDetails.currency + " " + paymentDetails.amount;
  sdkHeaderItemNode.append(sdkHeaderMerchantNameNode);
  sdkHeaderItemNode.append(sdkHeaderAmountNode);

  // Append to SDK header's node
  var sdkHeaderNode = document.getElementById("hyper-checkout-sdk-header");
  if (sdkHeaderNode instanceof HTMLDivElement) {
    // sdkHeaderNode.append(sdkHeaderLogoNode);
    sdkHeaderNode.append(sdkHeaderItemNode);
  }
}