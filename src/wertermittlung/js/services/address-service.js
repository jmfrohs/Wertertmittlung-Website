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

  var widgetCount = 0;

  function formatAddress(properties, fallbackHouseNumber) {
    var streetName =
      properties.street ||
      (properties.osm_key === 'highway' || properties.type === 'street' ? properties.name : '');
    var place = properties.city || properties.town || properties.village || properties.municipality;
    if (!streetName || !place || streetName === place) {
      return '';
    }
    var houseNumber = properties.housenumber || fallbackHouseNumber || '';
    var street = [streetName, houseNumber].filter(Boolean).join(' ');
    var postalPlace = [properties.postcode, place].filter(Boolean).join(' ');
    var parts = [street];

    if (postalPlace && postalPlace !== street) {
      parts.push(postalPlace);
    }
    if (properties.country && properties.country !== 'Deutschland') {
      parts.push(properties.country);
    }
    return parts.join(', ');
  }

  function createAddressController(options) {
    var dom = window.EsdiWertermittlung.dom;
    var validation = window.EsdiWertermittlung.validation;
    var form = options.form;
    var addressStep = options.addressStep;
    var addressInput = options.addressInput;
    var addressSuggestions = options.addressSuggestions;
    var addressStatus = options.addressStatus;

    var addressTimer = null;
    var addressAbortController = null;
    var lastAddressRequestAt = 0;
    var autoSuggestedLocation = '';

    var suggestionListId = 'wm-address-suggestions-' + (++widgetCount);
    addressSuggestions.id = suggestionListId;
    addressInput.setAttribute('aria-controls', suggestionListId);

    function closeSuggestions() {
      addressSuggestions.hidden = true;
      addressInput.setAttribute('aria-expanded', 'false');
      while (addressSuggestions.firstChild) {
        addressSuggestions.removeChild(addressSuggestions.firstChild);
      }
    }

    function setSuggestedLocation(type) {
      var location = '';
      if (type === 'city' || type === 'town') {
        location = 'city';
      } else if (type === 'suburb' || type === 'quarter' || type === 'borough') {
        location = 'suburban';
      } else if (type === 'village' || type === 'hamlet' || type === 'isolated_dwelling') {
        location = 'rural';
      }
      if (location) {
        var locationInput = form.querySelector('input[name="location"][value="' + location + '"]');
        if (locationInput) {
          locationInput.checked = true;
          autoSuggestedLocation = location;
        }
      }
    }

    function clearAutoLocation() {
      if (!autoSuggestedLocation) {
        return;
      }
      var previousLocation = form.querySelector(
        'input[name="location"][value="' + autoSuggestedLocation + '"]'
      );
      if (previousLocation) {
        previousLocation.checked = false;
      }
      autoSuggestedLocation = '';
    }

    function selectAddress(feature, button) {
      var properties = feature.properties || {};
      var typedHouseNumber = validation.extractTypedHouseNumber(addressInput.value);
      var hasHouseNumber = Boolean(properties.housenumber || typedHouseNumber);
      var formatted = formatAddress(properties, typedHouseNumber) || button.textContent;

      setSuggestedLocation(properties.type);
      closeSuggestions();

      if (!hasHouseNumber && (properties.street || properties.name)) {
        var streetName = properties.street || properties.name;
        var place = properties.city || properties.town || properties.village || properties.municipality;
        var postalPlace = [properties.postcode, place].filter(Boolean).join(' ');
        var suffix = postalPlace ? ', ' + postalPlace : '';
        addressInput.value = streetName + ' ' + suffix;
        var cursorPos = streetName.length + 1;
        addressInput.focus();
        if (typeof addressInput.setSelectionRange === 'function') {
          addressInput.setSelectionRange(cursorPos, cursorPos);
        }
        addressStatus.textContent = 'Bitte ergänzen Sie jetzt noch die Hausnummer.';
        return;
      }

      addressInput.value = formatted;
      dom.markInvalid(addressInput, false);
      dom.setError(addressStep, '');
      addressStatus.textContent = 'Adresse übernommen.';
    }

    function showSuggestions(features) {
      closeSuggestions();
      var typedHouseNumber = validation.extractTypedHouseNumber(addressInput.value);
      var seen = Object.create(null);

      var sortedFeatures = features.slice().sort(function (a, b) {
        var aHasHouse = Boolean(a.properties && a.properties.housenumber);
        var bHasHouse = Boolean(b.properties && b.properties.housenumber);
        return Number(bHasHouse) - Number(aHasHouse);
      });

      sortedFeatures.forEach(function (feature) {
        var properties = feature.properties || {};
        var label = formatAddress(properties, typedHouseNumber);
        if (!label || seen[label]) {
          return;
        }
        seen[label] = true;
        var item = document.createElement('li');
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'wm-address__suggestion';
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', 'false');
        button.textContent = label;
        button.addEventListener('click', function () {
          selectAddress(feature, button);
        });
        item.appendChild(button);
        addressSuggestions.appendChild(item);
      });

      addressSuggestions.hidden = !addressSuggestions.childElementCount;
      addressInput.setAttribute('aria-expanded', String(!addressSuggestions.hidden));
    }

    function searchAddresses(query) {
      if (addressAbortController) {
        addressAbortController.abort();
      }
      var controller = new AbortController();
      addressAbortController = controller;
      lastAddressRequestAt = Date.now();
      addressStatus.textContent = 'Adressvorschläge werden gesucht …';
      addressInput.setAttribute('aria-busy', 'true');

      var url =
        'https://photon.komoot.io/api/?q=' +
        encodeURIComponent(query) +
        '&layer=house&layer=street&limit=8&lang=de&lat=51.0504&lon=13.7373&zoom=12';

      fetch(url, { signal: controller.signal })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Adresssuche fehlgeschlagen: HTTP ' + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          if (!Array.isArray(data.features)) {
            throw new Error('Die Adresssuche lieferte ein ungültiges Ergebnis.');
          }
          showSuggestions(data.features);
          addressStatus.textContent = !addressSuggestions.hidden
            ? 'Wählen Sie eine genaue Adresse (Straße, Hausnummer, Ort) aus.'
            : 'Keine passende Straße gefunden. Bitte geben Sie Straße, Hausnummer und Ort ein.';
        })
        .catch(function (error) {
          if (error.name !== 'AbortError') {
            closeSuggestions();
            addressStatus.textContent =
              'Adressvorschläge sind gerade nicht verfügbar. Bitte geben Sie Straße, Hausnummer und Ort manuell ein.';
          }
        })
        .then(function () {
          if (addressAbortController === controller) {
            addressInput.removeAttribute('aria-busy');
          }
        });
    }

    function scheduleSearch() {
      window.clearTimeout(addressTimer);
      if (addressAbortController) {
        addressAbortController.abort();
      }
      closeSuggestions();

      var query = addressInput.value.trim();
      if (query.length < 3) {
        addressStatus.textContent = '';
        return;
      }

      var delay = Math.max(350, 500 - (Date.now() - lastAddressRequestAt));
      addressTimer = window.setTimeout(function () {
        searchAddresses(query);
      }, delay);
    }

    function bindEvents() {
      addressInput.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          closeSuggestions();
        } else if (event.key === 'ArrowDown' && !addressSuggestions.hidden) {
          var firstSuggestion = addressSuggestions.querySelector('button');
          if (firstSuggestion) {
            event.preventDefault();
            firstSuggestion.focus();
          }
        }
      });

      addressSuggestions.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Escape') {
          return;
        }
        var suggestions = Array.prototype.slice.call(addressSuggestions.querySelectorAll('button'));
        var current = suggestions.indexOf(document.activeElement);
        if (event.key === 'Escape') {
          closeSuggestions();
          addressInput.focus();
          return;
        }
        event.preventDefault();
        var next =
          event.key === 'ArrowDown'
            ? Math.min(current + 1, suggestions.length - 1)
            : Math.max(current - 1, 0);
        suggestions[next].focus();
      });
    }

    bindEvents();

    return {
      scheduleSearch: scheduleSearch,
      clearAutoLocation: clearAutoLocation,
      resetAutoLocationFlag: function () {
        autoSuggestedLocation = '';
      }
    };
  }

  window.EsdiWertermittlung = window.EsdiWertermittlung || {};
  window.EsdiWertermittlung.addressService = {
    createAddressController: createAddressController
  };
})();
