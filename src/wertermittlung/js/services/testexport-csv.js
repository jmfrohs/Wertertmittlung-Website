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

  var LABELS = {
    propertyType: {
      house: 'Einfamilienhaus',
      apartment: 'Wohnung',
      'multi-family-house': 'Mehrfamilienhaus',
      'plot-of-land': 'Grundstück'
    },
    location: {
      city: 'Zentral',
      suburban: 'Vorstadt',
      rural: 'Ländlich'
    },
    condition: {
      excellent: 'Neuwertig',
      good: 'Gepflegt',
      average: 'Modernisierungsbedarf',
      poor: 'Sanierungsbedürftig'
    },
    extras: {
      balcony: 'Balkon/Terrasse',
      parking: 'Parkplatz',
      garden: 'Garten',
      garage: 'Garage',
      pool: 'Pool',
      solar: 'Solaranlage'
    },
    occasion: {
      sale: 'Verkauf geplant',
      'sale-or-rent': 'Verkauf oder Vermietung abwägen',
      'inheritance-gift': 'Erbschaft / Schenkung',
      'divorce-separation': 'Scheidung / Trennung',
      'value-only': 'Nur Wert erfahren'
    },
    sellingTimeframe: {
      'as-soon-as-possible': 'So schnell wie möglich',
      '3-6-months': 'In 3–6 Monaten',
      '6-12-months': 'In 6–12 Monaten',
      open: 'Noch offen'
    }
  };

  function mapLabel(group, key) {
    if (!key) {
      return '';
    }
    return (LABELS[group] && LABELS[group][key]) || String(key);
  }

  function escapeCsvCell(value) {
    var text = value === null || value === undefined ? '' : String(value);
    var escaped = text.replace(/"/g, '""');
    return '"' + escaped + '"';
  }

  function buildCsv(data) {
    var headers = [
      'Zeitstempel',
      'Immobilienart',
      'Fläche (m²)',
      'Zimmer',
      'Baujahr',
      'Adresse',
      'Lage',
      'Zustand',
      'Ausstattung',
      'Anlass',
      'Zeithorizont',
      'Vorname',
      'Nachname',
      'E-Mail',
      'Telefon',
      'Datenschutz bestätigt'
    ];

    var extrasText = Array.isArray(data.extras)
      ? data.extras
          .map(function (item) {
            return mapLabel('extras', item);
          })
          .join(', ')
      : '';

    var roomsText = data.rooms ? (data.rooms >= 5 ? '5+' : String(data.rooms)) : '';

    var row = [
      new Date().toISOString(),
      mapLabel('propertyType', data.propertyType),
      data.livingArea || '',
      roomsText,
      data.yearBuiltLabel || data.yearBuilt || '',
      data.propertyAddress || '',
      mapLabel('location', data.location),
      mapLabel('condition', data.condition),
      extrasText,
      mapLabel('occasion', data.occasion),
      mapLabel('sellingTimeframe', data.sellingTimeframe),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.privacyConsent ? 'Ja' : 'Nein'
    ];

    var headerLine = headers.map(escapeCsvCell).join(';');
    var rowLine = row.map(escapeCsvCell).join(';');

    return '\uFEFF' + headerLine + '\r\n' + rowLine + '\r\n';
  }

  function createFilename() {
    var date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return 'wertermittlung-' + date + '.csv';
  }

  function downloadCsv(csvContent, filename) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function handleTestExport(root, data) {
    if (root && root.dataset && root.dataset.csvDownload === 'false') {
      return null;
    }
    var csvContent = buildCsv(data);
    var filename = createFilename();
    downloadCsv(csvContent, filename);
    return {
      csvContent: csvContent,
      filename: filename
    };
  }

  document.addEventListener('wm:submit', function (event) {
    if (!event || !event.detail || !event.detail.data) {
      return;
    }
    handleTestExport(event.target, event.detail.data);
  });

  window.EsdiWertermittlung = window.EsdiWertermittlung || {};
  window.EsdiWertermittlung.testExportCsvService = {
    buildCsv: buildCsv,
    downloadCsv: downloadCsv,
    saveCsv: downloadCsv,
    createFilename: createFilename,
    handleTestExport: handleTestExport
  };
})();
