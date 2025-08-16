import React, { useEffect } from 'react';

export const PaymentPage = () => {
  useEffect(() => {
    const yookassaStylesheet = document.createElement('link');
    yookassaStylesheet.rel = 'stylesheet';
    yookassaStylesheet.href = 'https://yookassa.ru/integration/simplepay/css/yookassa_construct_form.css?v=1.26.0';
    document.head.appendChild(yookassaStylesheet);

    const yookassaScript = document.createElement('script');
    yookassaScript.src = 'https://yookassa.ru/integration/simplepay/js/yookassa_construct_form.js?v=1.26.0';
    yookassaScript.async = true;
    document.body.appendChild(yookassaScript);

    return () => {
      document.head.removeChild(yookassaStylesheet);
      document.body.removeChild(yookassaScript);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Оплата тестирования</h2>
        <form className="yoomoney-payment-form" action="https://yookassa.ru/integration/simplepay/payment" method="post" acceptCharset="utf-8">
          <div className="ym-products">
            <div className="ym-block-title ym-products-title">Товары</div>
            <div className="ym-product">
              <div className="ym-product-line">
                <span className="ym-product-description"><span className="ym-product-count">1×</span>Цифровое исследование учебных функций</span>
                <span className="ym-product-price" data-price="500" data-id="420" data-count="1">500,00&nbsp;₽</span>
              </div>
              <input disabled type="hidden" name="text" value="Цифровое исследование учебных функций" />
              <input disabled type="hidden" name="price" value="500" />
              <input disabled type="hidden" name="quantity" value="1" />
              <input disabled type="hidden" name="paymentSubjectType" value="commodity" />
              <input disabled type="hidden" name="paymentMethodType" value="full_prepayment" />
              <input disabled type="hidden" name="tax" value="1" />
            </div>
          </div>
          <input value="" type="hidden" name="ym_merchant_receipt" />
          <div className="ym-customer-info">
            <div className="ym-block-title">О покупателе</div>
            <input name="cps_email" className="ym-input" placeholder="Email" type="text" value="" />
          </div>
          <div className="ym-hidden-inputs"></div>
          <input name="customerNumber" type="hidden" value="Покупка исследования учебных функций" />
          <div className="ym-payment-btn-block ym-before-line ym-align-space-between">
            <div className="ym-input-icon-rub ym-display-none">
              <input name="sum" placeholder="0.00" className="ym-input ym-sum-input ym-required-input" type="number" step="any" value="1000" />
            </div>
            <button data-text="Пройти тестирование" className="ym-btn-pay ym-result-price">
              <span className="ym-text-crop">Пройти тестирование</span> <span className="ym-price-output">500,00&nbsp;₽</span>
            </button>
            <img src="https://yookassa.ru/integration/simplepay/img/iokassa-gray.svg?v=1.26.0" className="ym-logo" width="114" height="27" alt="ЮKassa" />
          </div>
          <input name="shopId" type="hidden" value="1146276" />
          <input name="successURL" type="hidden" value="http://localhost:5173/test" />
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
