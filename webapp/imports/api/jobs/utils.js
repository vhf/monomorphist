import dedent from 'dedent-js';

const optimizationStatuses = {
  '-1': "didn't properly finish",
  1: 'Function is optimized',
  2: 'Function is not optimized',
  3: 'Function is always optimized',
  4: 'Function is never optimized',
  6: 'Function is maybe deoptimized',
  7: 'Function is optimized by TurboFan',
  0: 'Unknown optimization status',
};

const killedVerdicts = [-1];
const deoptimizedVerdicts = [2, 4, 6];
const unsureVerdicts = [0, 6];
const optimizedVerdicts = [1, 3, 7];

const reasons = {
  'Assignment to parameter in arguments object':
    'https://github.com/vhf/v8-bailout-reasons#assignment-to-parameter-in-arguments-object',
  'Bad value context for arguments value':
    'https://github.com/vhf/v8-bailout-reasons#bad-value-context-for-arguments-value',
  'ForInStatement with non-local each variable':
    'https://github.com/vhf/v8-bailout-reasons#forinstatement-with-non-local-each-variable',
  'Inlining bailed out':
    'https://github.com/vhf/v8-bailout-reasons#inlining-bailed-out',
  'Object literal with complex property':
    'https://github.com/vhf/v8-bailout-reasons#object-literal-with-complex-property',
  'Optimized too many times':
    'https://github.com/vhf/v8-bailout-reasons#optimized-too-many-times',
  'Reference to a variable which requires dynamic lookup':
    'https://github.com/vhf/v8-bailout-reasons#reference-to-a-variable-which-requires-dynamic-lookup',
  'Rest parameters':
    'https://github.com/vhf/v8-bailout-reasons#rest-parameters',
  'Too many parameters':
    'https://github.com/vhf/v8-bailout-reasons#too-many-parameters',
  TryCatchStatement:
    'https://github.com/vhf/v8-bailout-reasons#trycatchstatement',
  TryFinallyStatement:
    'https://github.com/vhf/v8-bailout-reasons#tryfinallystatement',
  'Unsupported phi use of arguments':
    'https://github.com/vhf/v8-bailout-reasons#unsupported-phi-use-of-arguments',
  Yield:
    'https://github.com/vhf/v8-bailout-reasons#yield',
};

const parseRawOutput = (_line) => {
  let verdict = -1;
  if (!_line) return { verdict, line: '' };
  let line = _line.replace('<', '&lt;').replace('>', '&gt;');
  const optimizationStatusMatch = line.match(/\(OptimizationStatus \{([0-9]+)\}\)$/);
  if (optimizationStatusMatch) {
    const [, optimizationStatus] = optimizationStatusMatch;
    verdict = parseInt(optimizationStatus, 10);
    line = line.replace(/ (\(OptimizationStatus \{[0-9]+\}\))$/, '');
    let cls = 'verdict';
    if ([2, 4, 6].indexOf(verdict) !== -1) {
      cls += ' bad';
    }
    if ([0, 6].indexOf(verdict) !== -1) {
      cls += ' maybe';
    }
    line = `<span class="${cls}">${line}</span>`;
  }

  const reasonMatched = line.match(/^\[(disabled optimization)(.*)(, reason): (.*)\]$/);
  if (reasonMatched) {
    const [,,,, reason] = reasonMatched;
    if (reason in reasons) {
      const link = reasons[reason];
      line = line.replace(/^\[(disabled optimization)(.*)(, reason): (.*)\]$/,
                          `[$1<span class="collapse-column collapsed">$2$3</span>: <a href="${link}">$4</a>]`);
    } else {
      line = line.replace(/^\[(disabled optimization)(.*)(, reason): (.*)\]$/,
                          '[$1<span class="collapse-column collapsed">$2$3</span>: $4]');
    }
  }
  line = line.replace(/^\[(disabled optimization)/,
                      '[<span class="disabled">$1</span>');
  line = line.replace(/(0x[0-9abcdef]+)/,
                      '<span class="hex">$1</span>');
  line = line.replace(/&lt;([^>]*)&gt;/,
                      '<span class="internal-info-1">&lt;$1&gt;</span>');
  line = line.replace(/internal-info-1">([^>\(]*) \(([^\)]+)\)&gt;<\/span>/,
                      'internal-info-1">$1 <span class="internal-info-2">($2)</span>&gt;</span>');
  line = line.replace(/(, reason:) (.*)\]/,
                      '<span class="reason-label">$1</span> <span class="reason">$2</span>]');
  return { line, verdict };
};

const instrument = (definition, call, name, prepend = '', screen = true) => {
  const boilerplate = screen ? "'use strict';\n" : dedent`
  ${prepend}
  function printStatus(fn) {
    switch(%GetOptimizationStatus(fn)) {
      case 1: console.log("Function is optimized (OptimizationStatus {1})"); break;
      case 2: console.log("Function is not optimized (OptimizationStatus {2})"); break;
      case 3: console.log("Function is always optimized (OptimizationStatus {3})"); break;
      case 4: console.log("Function is never optimized (OptimizationStatus {4})"); break;
      case 6: console.log("Function is maybe deoptimized (OptimizationStatus {6})"); break;
      case 7: console.log("Function is optimized by TurboFan (OptimizationStatus {7})"); break;
      default: console.log("Unknown optimization status (OptimizationStatus {0})"); break;
    }
  }

  `;

  return dedent`
  ${boilerplate}${definition}

  ${call}
  ${call}
  ;
  %OptimizeFunctionOnNextCall(${name});

  ${call}

  printStatus(${name});`;
};

export {
  optimizationStatuses,
  deoptimizedVerdicts,
  unsureVerdicts,
  optimizedVerdicts,
  killedVerdicts,
  reasons,
  parseRawOutput,
  instrument,
};
