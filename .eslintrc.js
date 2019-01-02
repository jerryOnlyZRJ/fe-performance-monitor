module.exports = {
    "extends": "standard",
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module" //es6 import
    },
    "globals": {
        "fetch": false //浏览器的全局变量
    },
    "rules": {
        "no-unreachable": 2,
        "no-console": 0
    },
    "rules": {
        "indent": ["error", 4]
    }
};