const fs = require('fs');
const path = require('path');

fs.readdirSync(__dirname).forEach(file => {
    require(path.resolve(__dirname, file));
});
