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

  function createStepper(options) {
    var dom = window.EsdiWertermittlung.dom;
    var root = options.root;
    var steps = options.steps;
    var bar = options.bar;
    var currentLabel = options.currentLabel;
    var totalLabel = options.totalLabel;
    var backButton = options.backButton;
    var nextButton = options.nextButton;
    var submitButton = options.submitButton;

    var lastIndex = steps.length - 1;
    var index = 0;

    totalLabel.textContent = String(steps.length);

    function showStep(target, moveFocus) {
      index = target;
      steps.forEach(function (step, n) {
        step.hidden = n !== index;
      });
      backButton.hidden = index === 0;
      nextButton.hidden = index === lastIndex;
      submitButton.hidden = index !== lastIndex;
      currentLabel.textContent = String(index + 1);
      bar.style.width = ((index + 1) / steps.length) * 100 + '%';

      if (moveFocus) {
        dom.focusHeading(root, steps[index]);
      }
    }

    return {
      showStep: showStep,
      getIndex: function () {
        return index;
      },
      isLastStep: function () {
        return index === lastIndex;
      }
    };
  }

  window.EsdiWertermittlung = window.EsdiWertermittlung || {};
  window.EsdiWertermittlung.stepper = {
    createStepper: createStepper
  };
})();
