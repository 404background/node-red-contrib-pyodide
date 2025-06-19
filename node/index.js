const pyodideNode = require('./pyodide/pyodide');
const pyodideConfigNode = require('./pyodide-config/pyodide-config');

module.exports = function(RED) {
    pyodideNode(RED);
    pyodideConfigNode(RED);
};
