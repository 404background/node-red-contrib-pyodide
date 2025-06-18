const pyodideNode = require('./pyodide/pyodide');

module.exports = function(RED) {
    pyodideNode(RED);
};
