const { Membrane } = require('..');
const assert = require('assert');
require('./__polyfill');

function setup(leftField, rightField, useShadowTargets) {
  const Left = {
    base: {},
    proto: {},
    field: leftField,
    value: { fromTheLeft: true },

    get(obj) {
      return obj[leftField];
    },
    set(obj, value) {
      obj[leftField] = value;
    },
  };

  const rightProto = {};
  const Right = {
    base: {},
    proto: {},
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
  const wrappedGraph = new Membrane(graph, useShadowTargets);
  graph.Left = Left;
  wrappedGraph.Right = Right;

  const pLeft = wrappedGraph.Left;
  const pRight = graph.Right;

  return {
    Left,
    Right,
    pLeft,
    pRight,
  };
}

exports.stringFields = function(useShadowTargets) {
  return () => setup('leftField', 'rightField', useShadowTargets);
}

exports.symbolFields = function(useShadowTargets) {
  return () => setup(Symbol('leftField'), Symbol('rightField'), useShadowTargets);
}

exports.privateSymbolFields = function(useShadowTargets) {
  return () => setup(Symbol.private('leftField'), Symbol.private('rightField'), useShadowTargets);
}

exports.preExposedPrivateSymbolFields = function(useShadowTargets) {
  return () => {
    const membrane = setup(Symbol.private('leftField'), Symbol.private('rightField'), useShadowTargets);
    // Expose the fields before the tests.
    membrane.pLeft.field;
    membrane.pRight.field;
    return membrane;
  }
}



exports.suite = function(setup, set, get) {
  const setupBase = () => ({});
  describe('pLeft.base[pLeft.field] === pLeft.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, setOn || Left.base, Left.value);

      const got = get(pLeft, pLeft.base);

      // Test that it's wrapped.
      assert.notStrictEqual(got, Left.value);
      // Test that it's the wrapped left value.
      assert.strictEqual(got.fromTheLeft, true);
      // Sanity check.
      assert.strictEqual(get(Left, Left.base), Left.value);
    }

    it('Left.base[Left.field] = Left.value', () => {
      test(setup());
    });

    it('Left.base -> Left.proto, Left.proto[Left.field] = Left.value', () => {
      const state = setup();
      const { Left } = state;
      Reflect.setPrototypeOf(Left.base, Left.proto);
      test(state, Left.proto);
    });

    it('Left.base -> pRight.base, pRight.base[Left.field] = Left.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(Left.base, pRight.base);
      test(state, pRight.base);
    });
  });

  describe('pLeft.base[pLeft.field] === Right.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, setOn || Left.base, pRight.value);

      const got = get(pLeft, pLeft.base);

      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Test that it was the wrapped right value.
      assert.strictEqual(pRight.value.fromTheRight, true);
      // Sanity check.
      assert.strictEqual(get(Left, Left.base), pRight.value);
    }

    it('Left.base[Left.field] = pRight.value', () => {
      test(setup());
    });

    it('Left.base -> Left.proto, Left.proto[Left.field] = pRight.value', () => {
      const state = setup();
      const { Left } = state;
      Reflect.setPrototypeOf(Left.base, Left.proto);
      test(state, Left.proto);
    });

    it('Left.base -> pRight.base, pRight.base[Left.field] = pRight.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(Left.base, pRight.base);
      test(state, pRight.base);
    });
  });

  describe('pLeft.base[Right.field] === pLeft.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, setOn || Left.base, Left.value);

      const got = get(Right, pLeft.base);

      // Test that it's wrapped.
      assert.notStrictEqual(got, Left.value);
      // Test that it's the wrapped left value.
      assert.strictEqual(got.fromTheLeft, true);
      // Sanity check.
      assert.strictEqual(get(pRight, Left.base), Left.value);
    }

    it('Left.base[pRight.field] = Left.value', () => {
      test(setup());
    });

    it('Left.base -> Left.proto, Left.proto[pRight.field] = Left.value', () => {
      const state = setup();
      const { Left } = state;
      Reflect.setPrototypeOf(Left.base, Left.proto);
      test(state, Left.proto);
    });

    it('Left.base -> pRight.base, pRight.base[pRight.field] = Left.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(Left.base, pRight.base);
      test(state, pRight.base);
    });
  });

  describe('pLeft.base[Right.field] === Right.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, setOn || Left.base, pRight.value);

      const got = get(Right, pLeft.base);
      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Test that it was the wrapped right value.
      assert.strictEqual(pRight.value.fromTheRight, true);
      // Sanity check.
      assert.strictEqual(get(pRight, Left.base), pRight.value);
    }

    it('Left.base[pRight.field] = pRight.value', () => {
      test(setup());
    });

    it('Left.base -> Left.proto, Left.proto[pRight.field] = pRight.value', () => {
      const state = setup();
      const { Left } = state;
      Reflect.setPrototypeOf(Left.base, Left.proto);
      test(state, Left.proto);
    });

    it('Left.base -> pRight.base, pRight.base[pRight.field] = pRight.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(Left.base, pRight.base);
      test(state, pRight.base);
    });
  });

  describe('Right.base[pLeft.field] === pLeft.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, setOn || pRight.base, Left.value);

      const got = get(pLeft, Right.base);
      // Test that it's wrapped.
      assert.notStrictEqual(got, Left.value);
      // Test that it's the wrapped left value.
      assert.strictEqual(got.fromTheLeft, true);
      // Sanity check.
      assert.strictEqual(get(Left, pRight.base), Left.value);
    }

    it('pRight.base[Left.field] = Left.value', () => {
      test(setup());
    });

    it('pRight.base -> pRight.proto, pRight.proto[Left.field] = Left.value', () => {
      const state = setup();
      const { pRight } = state;
      Reflect.setPrototypeOf(pRight.base, pRight.proto);
      test(state, pRight.proto);
    });

    it('pRight.base -> Left.base, Left.base[Left.field] = Left.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(pRight.base, Left.base);
      test(state, Left.base);
    });

    it('Right.base -> Right.proto, pRight.proto[Left.field] = Left.value', () => {
      const state = setup();
      const { Right, pRight } = state;
      Reflect.setPrototypeOf(Right.base, Right.proto);
      test(state, pRight.proto);
    });
  });

  describe('Right.base[pLeft.field] === Right.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, setOn || pRight.base, pRight.value);

      const got = get(pLeft, Right.base);
      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Test that it was the wrapped right value.
      assert.strictEqual(pRight.value.fromTheRight, true);
      // Sanity check.
      assert.strictEqual(get(Left, pRight.base), pRight.value);
    }

    it('pRight.base[Left.field] = pRight.value', () => {
      test(setup());
    });

    it('pRight.base -> pRight.proto, pRight.proto[Left.field] = pRight.value', () => {
      const state = setup();
      const { pRight } = state;
      Reflect.setPrototypeOf(pRight.base, pRight.proto);
      test(state, pRight.proto);
    });

    it('pRight.base -> Left.base, Left.base[Left.field] = pRight.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(pRight.base, Left.base);
      test(state, Left.base);
    });

    it('Right.base -> Right.proto, pRight.proto[Left.field] = pRight.value', () => {
      const state = setup();
      const { Right, pRight } = state;
      Reflect.setPrototypeOf(Right.base, Right.proto);
      test(state, pRight.proto);
    });
  });

  describe('Right.base[Right.field] === pLeft.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, setOn || pRight.base, Left.value);

      const got = get(Right, Right.base);
      // Test that it's wrapped.
      assert.notStrictEqual(got, Left.value);
      // Test that it's the wrapped left value.
      assert.strictEqual(got.fromTheLeft, true);
      // Sanity check.
      assert.strictEqual(get(pRight, pRight.base), Left.value);
    }

    it('pRight.base[pRight.field] = Left.value', () => {
      test(setup());
    });

    it('pRight.base -> pRight.proto, pRight.proto[pRight.field] = Left.value', () => {
      const state = setup();
      const { pRight } = state;
      Reflect.setPrototypeOf(pRight.base, pRight.proto);
      test(state, pRight.proto);
    });

    it('pRight.base -> Left.base, Left.base[pRight.field] = Left.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(pRight.base, Left.base);
      test(state, Left.base);
    });

    it('Right.base -> Right.proto, pRight.proto[pRight.field] = Left.value', () => {
      const state = setup();
      const { Right, pRight } = state;
      Reflect.setPrototypeOf(Right.base, Right.proto);
      test(state, pRight.proto);
    });
  });

  describe('Right.base[Right.field] === Right.value', () => {
    function test(state, setOn) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, setOn || pRight.base, pRight.value);

      const got = get(Right, Right.base);
      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Test that it was the wrapped right value.
      assert.strictEqual(pRight.value.fromTheRight, true);
      // Sanity check.
      assert.strictEqual(get(pRight, pRight.base), pRight.value);
    }

    it('pRight.base[pRight.field] = pRight.value', () => {
      test(setup());
    });

    it('pRight.base -> pRight.proto, pRight.proto[pRight.field] = pRight.value', () => {
      const state = setup();
      const { pRight } = state;
      Reflect.setPrototypeOf(pRight.base, pRight.proto);
      test(state, pRight.proto);
    });

    it('pRight.base -> Left.base, Left.base[pRight.field] = pRight.value', () => {
      const state = setup();
      const { Left, pRight } = state;
      Reflect.setPrototypeOf(pRight.base, Left.base);
      test(state, Left.base);
    });

    it('Right.base -> Right.proto, pRight.proto[pRight.field] = pRight.value', () => {
      const state = setup();
      const { Right, pRight } = state;
      Reflect.setPrototypeOf(Right.base, Right.proto);
      test(state, pRight.proto);
    });
  });
};
