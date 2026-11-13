/*
MIT License

Copyright (c) 2026 jmfrohs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function () {
  'use strict';

  var ADVANCE_DELAY_MS = 250;

  function init(root) {
    if (root.dataset.wmReady) {
      return;
    }
    root.dataset.wmReady = 'true';

    var dom = window.EsdiWertermittlung.dom;
    var validation = window.EsdiWertermittlung.validation;
    var addressService = window.EsdiWertermittlung.addressService;
    var exportService = window.EsdiWertermittlung.exportService;
    var stepperFactory = window.EsdiWertermittlung.stepper;

    var form = root.querySelector('[data-wm-form]');
    var progress = root.querySelector('[data-wm-progress]');
    var successBox = root.querySelector('[data-wm-success]');
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-wm-step]'));
    var bar = root.querySelector('[data-wm-bar]');
    var currentLabel = root.querySelector('[data-wm-current]');
    var totalLabel = root.querySelector('[data-wm-total]');
    var backButton = root.querySelector('[data-wm-back]');
    var nextButton = root.querySelector('[data-wm-next]');
    var submitButton = root.querySelector('[data-wm-submit]');
    var livingLabel = root.querySelector('[data-wm-living-label]');
    var areaOutput = root.querySelector('[data-wm-area-output]');
    var yearField = root.querySelector('[data-wm-year]');
    var conditionField = root.querySelector('[data-wm-condition]');
    var addressInput = root.querySelector('[data-wm-address]');
    var addressSuggestions = root.querySelector('[data-wm-address-suggestions]');
    var addressStatus = root.querySelector('[data-wm-address-status]');

    if (!form || !steps.length) {
      return;
    }

    var validationContext = {
      form: form,
      steps: steps,
      yearField: yearField,
      conditionField: conditionField,
      addressInput: addressInput
    };

    var stepper = stepperFactory.createStepper({
      root: root,
      steps: steps,
      bar: bar,
      currentLabel: currentLabel,
      totalLabel: totalLabel,
      backButton: backButton,
      nextButton: nextButton,
      submitButton: submitButton
    });

    var addressController = addressService.createAddressController({
      form: form,
      addressStep: steps[2],
      addressInput: addressInput,
      addressSuggestions: addressSuggestions,
      addressStatus: addressStatus
    });

    function goNext() {
      var current = stepper.getIndex();
      if (validation.validateStep(current, validationContext)) {
        stepper.showStep(current + 1, true);
      }
    }

    nextButton.addEventListener('click', goNext);

    backButton.addEventListener('click', function () {
      stepper.showStep(stepper.getIndex() - 1, true);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!stepper.isLastStep()) {
        goNext();
        return;
      }

      for (var n = 0; n < steps.length; n++) {
        if (!validation.validateStep(n, validationContext)) {
          stepper.showStep(n, true);
          return;
        }
      }

      var data = dom.collectData(form, addressInput);
      exportService.handleSubmission(root, data);
      if (progress) {
        progress.hidden = true;
      }
      form.hidden = true;
      if (successBox) {
        successBox.hidden = false;
        dom.focusHeading(root, successBox);
      }
      root.dispatchEvent(
        new CustomEvent('wm:submit', {
          detail: {
            data: data
          },
          bubbles: true
        })
      );
    });

    form.addEventListener('change', function (event) {
      if (event.target.name === 'yearBuilt') {
        dom.markInvalid(yearField, false);
        dom.setError(steps[1], '');
        return;
      }
      if (event.target.name === 'condition') {
        dom.markInvalid(conditionField, false);
        dom.setError(steps[3], '');
        return;
      }
      if (event.target.name === 'location') {
        addressController.resetAutoLocationFlag();
        return;
      }
      if (event.target.name !== 'propertyType') {
        return;
      }
      dom.applyPropertyType(form, livingLabel);
      dom.setError(steps[0], '');
      if (stepper.getIndex() === 0) {
        window.setTimeout(function () {
          if (stepper.getIndex() === 0) {
            stepper.showStep(1, true);
          }
        }, ADVANCE_DELAY_MS);
      }
    });

    form.addEventListener('input', function (event) {
      if (validation.CONTACT_FIELDS.indexOf(event.target.name) !== -1) {
        dom.markInvalid(event.target, !event.target.value.trim() || !event.target.checkValidity());
        var contactFieldsValid = validation.CONTACT_FIELDS.every(function (name) {
          var input = form.elements[name];
          return input.value.trim() && input.checkValidity();
        });
        if (contactFieldsValid) {
          dom.setError(steps[5], '');
        }
      }
      if (event.target.name === 'livingArea') {
        dom.updateAreaRange(event.target, areaOutput);
      }
      if (event.target === addressInput) {
        addressController.clearAutoLocation();
        dom.markInvalid(addressInput, false);
        dom.setError(steps[2], '');
        addressController.scheduleSearch();
      }
      if (event.target.hasAttribute('data-wm-validate')) {
        dom.markInvalid(event.target, false);
        dom.setError(steps[1], '');
      }
    });

    dom.applyPropertyType(form, livingLabel);
    dom.updateAreaRange(form.elements.livingArea, areaOutput);
    stepper.showStep(0, false);
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-esdi-wm]'), init);
  }

  window.EsdiWertermittlung = window.EsdiWertermittlung || {};
  window.EsdiWertermittlung.init = init;
  window.EsdiWertermittlung.initAll = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
