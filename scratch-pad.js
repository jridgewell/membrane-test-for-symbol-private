const { Membrane } = require('.');
const assert = require('assert');
require('./tests/__polyfill');

const leftField = Symbol.private('leftField');
const otherField = Symbol.private('otherField');
const rightField = Symbol.private('rightField');

const Left = {
  base: {},
  field: leftField,
  value: { fromTheLeft: true },

  get(obj) {
    return obj[leftField];
  },
  set(obj, value) {
    obj[leftField] = value;
  },
};

const Right = {
  base: {},
  field: rightField,
  value: { fromTheRight: true },

  get(obj) {
    return obj[rightField];
  },
  set(obj, value) {
    obj[rightField] = value;
  }
}

const graph = {};
const wrappedGraph = new Membrane(graph, true);
graph.Left = Left;
wrappedGraph.Right = Right;

const wrappedLeftSide = wrappedGraph.Left;
const wrappedRightSide = graph.Right;


wrappedRightSide.base[Left.field] = otherField;
wrappedRightSide.base[otherField] = Left.value;

// Pull it through
debugger;
console.assert(Right.base[wrappedLeftSide.field] === otherField);
console.assert(Right.base[otherField].fromTheLeft);

