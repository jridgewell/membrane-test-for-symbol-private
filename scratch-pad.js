const { Membrane } = require('.');
const assert = require('assert');
require('./tests/__polyfill');

const leftField = Symbol.private('leftField');
const rightField = Symbol.private('rightField');

const Left = {
  base: { leftBase: true },
  proto: { leftProto: true },
  value: { leftValue: true },
  field: leftField,

  get(obj) {
    return obj[leftField];
  },
  set(obj, value) {
    obj[leftField] = value;
  },
};

const Right = {
  base: { leftBase: true },
  proto: { leftProto: true },
  value: { leftValue: true },
  field: rightField,

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

const pLeft = wrappedGraph.Left;
const pRight = graph.Right;


Reflect.setPrototypeOf(Left.base, Left.proto);
pLeft.proto[Right.field] = pLeft.value;

console.assert(Right.get(pLeft.proto) === pLeft.value);
console.assert(Right.get(pLeft.base) === pLeft.value);
console.assert(pLeft.proto[Right.field] === pLeft.value);
console.assert(pLeft.base[Right.field] === pLeft.value);

