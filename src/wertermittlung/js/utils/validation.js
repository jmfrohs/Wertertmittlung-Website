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

  var CONTACT_FIELDS = ['firstName', 'lastName', 'email', 'phone'];

  function extractTypedHouseNumber(query) {
    var withoutPostcode = query.replace(/\b\d{5}\b/g, '');
    var match = withoutPostcode.match(/[A-Za-zÄÖÜäöüß.]{2,}\s+(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+\s*[a-zA-Z]?)?)\b/);
    return match ? match[1].replace(/\s+/g, '') : '';
  }

  function validateAddressValue(value) {
    if (!value) {
      return 'Bitte geben Sie die Adresse der Immobilie an.';
    }
    var withoutPostcode = value.replace(/\b\d{5}\b/g, ' ');
    var streetHouseMatch = withoutPostcode.match(
      /([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß.\s-]{1,}?)\s+(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+\s*[a-zA-Z]?)?)\b/
    );
    if (!streetHouseMatch) {
      if (/[A-Za-zÄÖÜäöüß]{2,}/.test(withoutPostcode) && /,/.test(value)) {
        return 'Bitte ergänzen Sie noch die Hausnummer (z. B. Talblick 2, 01328 Dresden).';
      }
      return 'Bitte geben Sie eine genaue Adresse mit Straße, Hausnummer und Ort an (z. B. Talblick 2, 01328 Dresden).';
    }
    var remainder = value.slice(value.indexOf(streetHouseMatch[0]) + streetHouseMatch[0].length);
    var hasPlace = /(?:,\s*|\b\d{5}\s+)[A-Za-zÄÖÜäöüß]{2,}/.test(value) || /[A-Za-zÄÖÜäöüß]{2,}/.test(remainder);
    if (!hasPlace) {
      return 'Bitte geben Sie zur Straße und Hausnummer auch den Ort an (z. B. Talblick 2, 01328 Dresden).';
    }
    return '';
  }

  function checkRange(input, min, max, required, markInvalid) {
    var value = input.value === '' ? NaN : Number(input.value);
    var invalid = Number.isNaN(value) ? required : value < min || value > max;
    markInvalid(input, invalid);
    return invalid ? input : null;
  }

  function validateStep(stepIndex, context) {
    var dom = window.EsdiWertermittlung.dom;
    var form = context.form;
    var steps = context.steps;
    var yearField = context.yearField;
    var conditionField = context.conditionField;
    var addressInput = context.addressInput;
    var step = steps[stepIndex];

    dom.setError(step, '');

    if (stepIndex === 0) {
      if (!form.elements.propertyType.value) {
        dom.setError(step, 'Bitte wählen Sie eine Immobilienart aus.');
        return false;
      }
      return true;
    }

    if (stepIndex === 1) {
      var living = checkRange(form.elements.livingArea, 10, 10000, true, dom.markInvalid);
      var missingYear = !form.elements.yearBuilt.value;
      dom.markInvalid(yearField, missingYear);

      if (!living && !missingYear) {
        return true;
      }

      if (living) {
        dom.setError(step, 'Bitte geben Sie die Fläche an (mindestens 10 m²).');
        living.focus();
      } else {
        dom.setError(step, 'Bitte wählen Sie den Zeitraum des Baujahrs aus.');
        yearField.querySelector('input[name="yearBuilt"]').focus();
      }
      return false;
    }

    if (stepIndex === 2) {
      var addressError = validateAddressValue(addressInput.value.trim());
      dom.markInvalid(addressInput, Boolean(addressError));
      if (!addressError) {
        return true;
      }
      dom.setError(step, addressError);
      addressInput.focus();
      return false;
    }

    if (stepIndex === 3) {
      var missingCondition = !form.elements.condition.value;
      dom.markInvalid(conditionField, missingCondition);
      if (missingCondition) {
        dom.setError(step, 'Bitte wählen Sie den Zustand der Immobilie aus.');
        conditionField.querySelector('input[name="condition"]').focus();
        return false;
      }
      return true;
    }

    if (stepIndex === 5) {
      var firstInvalid = null;
      CONTACT_FIELDS.forEach(function (name) {
        var input = form.elements[name];
        var invalid = !input.value.trim() || !input.checkValidity();
        dom.markInvalid(input, invalid);
        if (invalid && !firstInvalid) {
          firstInvalid = input;
        }
      });
      if (firstInvalid) {
        dom.setError(step, 'Bitte prüfen Sie Ihre Kontaktdaten und füllen Sie alle Pflichtfelder korrekt aus.');
        firstInvalid.focus();
        return false;
      }
      var consentInput = form.elements.privacyConsent;
      if (consentInput && !consentInput.checked) {
        dom.markInvalid(consentInput, true);
        dom.setError(step, 'Bitte akzeptieren Sie die Datenschutzerklärung.');
        consentInput.focus();
        return false;
      }
    }

    return true;
  }

  window.EsdiWertermittlung = window.EsdiWertermittlung || {};
  window.EsdiWertermittlung.validation = {
    CONTACT_FIELDS: CONTACT_FIELDS,
    extractTypedHouseNumber: extractTypedHouseNumber,
    validateAddressValue: validateAddressValue,
    validateStep: validateStep
  };
})();
