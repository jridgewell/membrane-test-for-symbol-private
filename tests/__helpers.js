const { Membrane } = require('..');
const assert = require('assert');
require('./__polyfill');

describe.forEach = function(variants, cb) {
  for (const variant in variants) {
    const data = variants[variant];
    describe(variant, () => cb(data));
  }
};

function setup(leftField, rightField, options) {
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
  const wrappedGraph = new Membrane(graph, options);
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

exports.stringFields = function(options) {
  return () => setup('leftField', 'rightField', options);
}

exports.symbolFields = function(options) {
  return () => setup(Symbol('leftField'), Symbol('rightField'), options);
}

exports.privateSymbolFields = function(options) {
  return () => setup(Symbol.private('leftField'), Symbol.private('rightField'), options);
}

exports.preExposedPrivateSymbolFields = function(options) {
  return () => {
    const membrane = setup(Symbol.private('leftField'), Symbol.private('rightField'), options);
    // Expose the fields before the tests.
    membrane.pLeft.field;
    membrane.pRight.field;
    return membrane;
  }
}

exports.closureSet = function(Side, base, value) {
  return Side.set(base, value);
}
exports.closureSet.describe = function({
  proto,
  baseSide,
  baseProp,
  fieldSide,
  valueSide,
}) {
  const start = proto ? `${proto}, ` : '';

  return `${start}${fieldSide}.set(${baseSide}.${baseProp}, ${valueSide}.value)`;
};

exports.closureGet = function(Side, base) {
  return Side.get(base);
}
exports.closureGet.describe = function({
  baseSide,
  fieldSide,
  valueSide
}) {
  return `${fieldSide}.get(${baseSide}.base) === ${valueSide}.value`;
};

exports.reifiedSet = function(Side, base, value) {
  return base[Side.field] = value;;
}
exports.reifiedSet.describe = function({
  proto,
  baseSide,
  baseProp,
  fieldSide,
  valueSide,
}) {
  const start = proto ? `${proto}, ` : '';
  return `${start}${baseSide}.${baseProp}[${fieldSide}.field] = ${valueSide}.value`;
};

exports.reifiedGet = function(Side, base) {
  return base[Side.field];
}
exports.reifiedGet.describe = function({
  baseSide,
  fieldSide,
  valueSide
}) {
  return `${baseSide}.base[${fieldSide}.field] === ${valueSide}.value`;
};


exports.suite = function(setup, set, get) {
  const setupBase = () => ({});
  describe(get.describe({
    baseSide: 'pLeft',
    fieldSide: 'pLeft',
    valueSide: 'pLeft'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, proto || Left.base, Left.value);

      if (proto) {
        Reflect.setPrototypeOf(Left.base, proto);
      }

      const got = get(pLeft, pLeft.base);

      // Test that it's the wrapped left value.
      assert.strictEqual(got.__original__, Left.value);
      // Sanity check.
      assert.strictEqual(get(Left, Left.base), Left.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'Left',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'Left.base -> Left.proto',
      baseSide: 'Left',
      baseProp: 'proto',
      fieldSide: 'Left',
      valueSide: 'Left'
    }), () => {
      const state = setup();
      test(state, state.Left.proto);
    });

    it(set.describe({
      proto: 'Left.base -> pRight.base',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'Left'
    }), () => {
      const state = setup();
      test(state, state.pRight.base);
    });
  });

  describe(get.describe({
    baseSide: 'pLeft',
    fieldSide: 'pLeft',
    valueSide: 'Right'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, proto || Left.base, pRight.value);

      if (proto) {
        Reflect.setPrototypeOf(Left.base, proto);
      }

      const got = get(pLeft, pLeft.base);

      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Sanity check.
      assert.strictEqual(get(Left, Left.base), pRight.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'pRight',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'Left.base -> Left.proto',
      baseSide: 'Left',
      baseProp: 'proto',
      fieldSide: 'Left',
      valueSide: 'pRight'
    }), () => {
      const state = setup();
      test(state, state.Left.proto);
    });

    it(set.describe({
      proto: 'Left.base -> pRight.base',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'pRight'
    }), () => {
      const state = setup();
      test(state, state.pRight.base);
    });
  });

  describe(get.describe({
    baseSide: 'Right',
    fieldSide: 'pLeft',
    valueSide: 'pLeft'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, proto || pRight.base, Left.value);

      if (proto) {
        Reflect.setPrototypeOf(pRight.base, proto);
      }

      const got = get(pLeft, Right.base);

      // Test that it's the wrapped left value.
      assert.strictEqual(got.__original__, Left.value);
      // Sanity check.
      assert.strictEqual(get(Left, pRight.base), Left.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'Left',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'pRight.base -> pRight.proto',
      baseSide: 'pRight',
      baseProp: 'proto',
      fieldSide: 'Left',
      valueSide: 'Left',
    }), () => {
      const state = setup();
      test(state, state.pRight.proto);
    });

    it(set.describe({
      proto: 'pRight.base -> Left.base',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'Left',
    }), () => {
      const state = setup();
      test(state, state.Left.base);
    });
  });

  describe(get.describe({
    baseSide: 'Right',
    fieldSide: 'pLeft',
    valueSide: 'Right'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(Left, proto || pRight.base, pRight.value);

      if (proto) {
        Reflect.setPrototypeOf(pRight.base, proto);
      }

      const got = get(pLeft, Right.base);

      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Sanity check.
      assert.strictEqual(get(Left, pRight.base), pRight.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'pRight',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'pRight.base -> pRight.proto',
      baseSide: 'pRight',
      baseProp: 'proto',
      fieldSide: 'Left',
      valueSide: 'pRight',
    }), () => {
      const state = setup();
      test(state, state.pRight.proto);
    });

    it(set.describe({
      proto: 'pRight.base -> Left.base',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'Left',
      valueSide: 'pRight',
    }), () => {
      const state = setup();
      test(state, state.Left.base);
    });
  });

  describe(get.describe({
    baseSide: 'pLeft',
    fieldSide: 'Right',
    valueSide: 'pLeft'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, proto || Left.base, Left.value);

      if (proto) {
        Reflect.setPrototypeOf(Left.base, proto);
      }

      const got = get(Right, pLeft.base);

      // Test that it's the wrapped left value.
      assert.strictEqual(got.__original__, Left.value);
      // Sanity check.
      assert.strictEqual(get(pRight, Left.base), Left.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'Left',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'Left.base -> Left.proto',
      baseSide: 'Left',
      baseProp: 'proto',
      fieldSide: 'pRight',
      valueSide: 'Left'
    }), () => {
      const state = setup();
      test(state, state.Left.proto);
    });

    it(set.describe({
      proto: 'Left.base -> pRight.base',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'Left'
    }), () => {
      const state = setup();
      test(state, state.pRight.base);
    });
  });

  describe(get.describe({
    baseSide: 'pLeft',
    fieldSide: 'Right',
    valueSide: 'Right'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, proto || Left.base, pRight.value);

      if (proto) {
        Reflect.setPrototypeOf(Left.base, proto);
      }

      const got = get(Right, pLeft.base);

      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Sanity check.
      assert.strictEqual(get(pRight, Left.base), pRight.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'pRight',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'Left.base -> Left.proto',
      baseSide: 'Left',
      baseProp: 'proto',
      fieldSide: 'pRight',
      valueSide: 'pRight'
    }), () => {
      const state = setup();
      test(state, state.Left.proto);
    });

    it(set.describe({
      proto: 'Left.base -> pRight.base',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'pRight'
    }), () => {
      const state = setup();
      test(state, state.pRight.base);
    });
  });

  describe(get.describe({
    baseSide: 'Right',
    fieldSide: 'Right',
    valueSide: 'pLeft'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, proto || pRight.base, Left.value);

      if (proto) {
        Reflect.setPrototypeOf(pRight.base, proto);
      }

      const got = get(Right, Right.base);

      // Test that it's the wrapped left value.
      assert.strictEqual(got.__original__, Left.value);
      // Sanity check.
      assert.strictEqual(get(pRight, pRight.base), Left.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'Left',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'pRight.base -> pRight.proto',
      baseSide: 'pRight',
      baseProp: 'proto',
      fieldSide: 'pRight',
      valueSide: 'Left',
    }), () => {
      const state = setup();
      test(state, state.pRight.proto);
    });

    it(set.describe({
      proto: 'pRight.base -> Left.base',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'Left',
    }), () => {
      const state = setup();
      test(state, state.Left.base);
    });
  });

  describe(get.describe({
    baseSide: 'Right',
    fieldSide: 'Right',
    valueSide: 'Right'
  }), () => {
    function test(state, proto) {
      const {
        Left,
        Right,
        pLeft,
        pRight,
      } = state;
      set(pRight, proto || pRight.base, pRight.value);

      if (proto) {
        Reflect.setPrototypeOf(pRight.base, proto);
      }

      const got = get(Right, Right.base);

      // Test that it's unwrapped.
      assert.strictEqual(got, Right.value);
      // Sanity check.
      assert.strictEqual(get(pRight, pRight.base), pRight.value);
    }

    it(set.describe({
      proto: '',
      baseSide: 'pRight',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'pRight',
    }), () => {
      test(setup());
    });

    it(set.describe({
      proto: 'pRight.base -> pRight.proto',
      baseSide: 'pRight',
      baseProp: 'proto',
      fieldSide: 'pRight',
      valueSide: 'pRight',
    }), () => {
      const state = setup();
      test(state, state.pRight.proto);
    });

    it(set.describe({
      proto: 'pRight.base -> Left.base',
      baseSide: 'Left',
      baseProp: 'base',
      fieldSide: 'pRight',
      valueSide: 'pRight',
    }), () => {
      const state = setup();
      test(state, state.Left.base);
    });
  });
};
