const { loadPyodide } = require("pyodide");
const path = require("path");

module.exports = function(RED) {
    let pyodideInstance = null;
    let pyodidePromise = null;

    async function initializePyodide() {
        if (pyodideInstance) {
            return pyodideInstance;
        }
        
        if (!pyodidePromise) {
            const pyodidePath = path.resolve(__dirname, "../../node_modules/pyodide/");
            pyodidePromise = loadPyodide({
                indexURL: pyodidePath,
            });
        }
        
        pyodideInstance = await pyodidePromise;
        return pyodideInstance;
    }

    function PyodideNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        const pythonCode = config.pythonCode || `import sys
import platform

msg["payload"] = {
    "python_version": sys.version,
    "platform": platform.platform(),
    "pyodide_version": "0.27.7",
    "message": "Python is running in Pyodide!"
}`;
        node.on('input', async function(msg, send, done) {
            try {
                const pyodide = await initializePyodide();
                
                pyodide.globals.set("msg", pyodide.toPy(msg));
                
                await pyodide.runPythonAsync(pythonCode);
                
                const resultMsg = pyodide.globals.get("msg").toJs({dict_converter: Object.fromEntries});
                
                send(resultMsg);
                
                if (done) {
                    done();
                }
            } catch (error) {
                node.error(`Python execution error: ${error.message}`, msg);
                if (done) {
                    done(error);
                }
            }
        });
        
        node.on('close', function() {
        });
    }
    
    RED.nodes.registerType('pyodide', PyodideNode);
};
