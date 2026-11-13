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

  var numberFormat = new Intl.NumberFormat('de-DE');

  function setError(step, message) {
    var box = step.querySelector('[data-wm-error]');
    if (!box) {
      return;
    }
    box.textContent = message || '';
    box.hidden = !message;
  }

  function markInvalid(input, invalid) {
    if (!input) {
      return;
    }
    if (invalid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function focusHeading(root, container) {
    var heading = container.querySelector('legend, h3');
    if (!heading) {
      return;
    }
    heading.focus({ preventScroll: true });
    if (root.getBoundingClientRect().top < 0) {
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateAreaRange(input, areaOutput) {
    if (!input || !areaOutput) {
      return;
    }
    var min = Number(input.min);
    var max = Number(input.max);
    var progress = ((Number(input.value) - min) / (max - min)) * 100;
    input.style.setProperty('--wm-range-progress', progress + '%');
    areaOutput.textContent = numberFormat.format(Number(input.value));
  }

  function applyPropertyType(form, livingLabel) {
    if (!livingLabel) {
      return;
    }
    var type = form.elements.propertyType.value;
    livingLabel.textContent = type === 'plot-of-land' ? 'Grundstücksfläche' : 'Wohnfläche';
  }

  function collectData(form, addressInput) {
    var field = function (name) {
      return form.elements[name];
    };
    var checkedRooms = field('rooms').value;
    var selectedYear = form.querySelector('input[name="yearBuilt"]:checked');

    return {
      propertyType: field('propertyType').value,
      livingArea: Number(field('livingArea').value),
      yearBuilt: selectedYear ? Number(selectedYear.value) : null,
      yearBuiltLabel: selectedYear ? selectedYear.nextElementSibling.textContent : '',
      rooms: checkedRooms ? Number(checkedRooms) : null,
      condition: field('condition').value,
      propertyAddress: addressInput.value.trim(),
      location: field('location').value,
      occasion: field('occasion').value,
      sellingTimeframe: field('sellingTimeframe').value,
      firstName: field('firstName').value.trim(),
      lastName: field('lastName').value.trim(),
      email: field('email').value.trim(),
      phone: field('phone').value.trim(),
      privacyConsent: field('privacyConsent').checked,
      extras: Array.prototype.map.call(
        form.querySelectorAll('input[name="extras"]:checked'),
        function (input) {
          return input.value;
        }
      )
    };
  }

  window.EsdiWertermittlung = window.EsdiWertermittlung || {};
  window.EsdiWertermittlung.dom = {
    setError: setError,
    markInvalid: markInvalid,
    focusHeading: focusHeading,
    updateAreaRange: updateAreaRange,
    applyPropertyType: applyPropertyType,
    collectData: collectData
  };
})();
