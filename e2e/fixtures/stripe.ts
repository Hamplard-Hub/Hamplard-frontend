import type { Page } from '@playwright/test';

/**
 * Stand-in for https://js.stripe.com so checkout tests run offline. The card
 * "iframes" become plain inputs (data-testid="stripe-<element>"). The last four
 * digits typed end up in the returned payment method, which is what the app's
 * simulatePaymentConfirmation reads (…0002 is declined, anything else succeeds).
 */
const FAKE_STRIPE_JS = String.raw`
(function () {
  function digitsOf(input) { return input ? input.value.replace(/\D/g, '') : ''; }

  function Stripe() {
    var created = {};

    function createElement(type, options) {
      var handlers = {};
      var input = null;
      function emit(name, payload) {
        (handlers[name] || []).forEach(function (h) { h(payload); });
      }
      function snapshot() {
        var d = digitsOf(input);
        var complete = type === 'cardNumber' ? d.length >= 16
          : type === 'cardExpiry' ? d.length === 4
          : d.length >= 3;
        var event = { elementType: type, empty: d.length === 0, complete: complete, error: undefined, value: {} };
        if (type === 'cardNumber') {
          event.brand = d.charAt(0) === '4' ? 'visa' : d.charAt(0) === '5' ? 'mastercard' : 'unknown';
        }
        return event;
      }

      var element = {
        _input: function () { return input; },
        mount: function (node) {
          input = document.createElement('input');
          input.setAttribute('data-testid', 'stripe-' + type);
          input.setAttribute('autocomplete', 'off');
          input.style.cssText = 'width:100%;border:0;outline:0;background:transparent;font:inherit';
          input.disabled = !!(options && options.disabled);
          input.addEventListener('input', function () { emit('change', snapshot()); });
          node.appendChild(input);
          emit('ready', { elementType: type });
        },
        on: function (name, handler) { (handlers[name] = handlers[name] || []).push(handler); return element; },
        off: function (name, handler) {
          handlers[name] = (handlers[name] || []).filter(function (h) { return h !== handler; });
          return element;
        },
        update: function (next) {
          options = Object.assign({}, options, next);
          if (input) input.disabled = !!options.disabled;
        },
        focus: function () { if (input) input.focus(); },
        blur: function () { if (input) input.blur(); },
        clear: function () { if (input) input.value = ''; },
        unmount: function () { if (input && input.parentNode) input.parentNode.removeChild(input); },
        destroy: function () {
          element.unmount();
          if (created[type] === element) delete created[type];
        }
      };
      created[type] = element;
      return element;

    }

    return {
      elements: function () {
        return {
          create: createElement,
          getElement: function (arg) {
            var type = typeof arg === 'string' ? arg : arg && arg.__elementType;
            return created[type] || null;
          },
          update: function () {},
          fetchUpdates: function () { return Promise.resolve(); }
        };
      },
      createToken: function () { return Promise.resolve({ error: { message: 'not supported in e2e' } }); },
      confirmCardPayment: function () { return Promise.resolve({ error: { message: 'not supported in e2e' } }); },
      createPaymentMethod: function (args) {
        var number = args && args.card && args.card._input ? digitsOf(args.card._input()) : '';
        var last4 = number.slice(-4);
        return Promise.resolve({
          paymentMethod: {
            id: 'pm_e2e_' + last4,
            object: 'payment_method',
            type: 'card',
            card: { brand: 'visa', last4: last4 },
            billing_details: (args && args.billing_details) || {}
          }
        });
      },
      paymentRequest: function () {
        return {
          canMakePayment: function () { return Promise.resolve(null); },

          on: function () {},
          off: function () {},
          update: function () {}
        };
      }
    };
  }

  Stripe.version = 3;
  window.Stripe = Stripe;
})();
`;

export async function mockStripe(page: Page): Promise<void> {
  await page.route('https://js.stripe.com/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_STRIPE_JS }),
  );
}