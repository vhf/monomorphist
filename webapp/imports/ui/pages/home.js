import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { CodeMirror } from 'meteor/perak:codemirror';


const codeMirror = () => {
  const definition = document.getElementById('sampleDefinition');
  const call = document.getElementById('sampleCall');

  CodeMirror((elt) => definition.parentNode.replaceChild(elt, definition), { // eslint-disable-line new-cap
    readOnly: true,
    value: `function wEval(x) {
  console.log({ x: x });
  return x;
  eval('');
}
var arg;`,
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });

  CodeMirror((elt) => call.parentNode.replaceChild(elt, call), { // eslint-disable-line new-cap
    readOnly: true,
    value: `arg = Math.round(Math.random() * 100);
wEval(arg);`,
    lineNumbers: true,
    mode: 'javascript',
    tabSize: 2,
    indentWithTabs: false,
    extraKeys: { Tab: false, 'Shift-Tab': false },
  });
};

Template.home.events({
  'click .node-modal-trigger': () => {
    $('#node-info-modal').openModal();
  },
});

Template.home.onRendered(() => {
  codeMirror();
});
