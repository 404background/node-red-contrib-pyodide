const { loadPyodide } = require("pyodide");
const path = require("path");
const fs = require("fs");

module.exports = function(RED) {
    let pyodideInstance = null;
    let pyodidePromise = null;
    let runQueue = Promise.resolve();

    // npm may hoist pyodide out of this package, so resolve it instead of using a fixed path
    function getPyodidePath() {
        const pyodidePath = path.dirname(require.resolve("pyodide/package.json")) + path.sep;
        if (!fs.existsSync(path.join(pyodidePath, "pyodide.asm.js"))) {
            throw new Error(`Pyodide files not found in ${pyodidePath}`);
        }
        return pyodidePath;
    }

    async function initializePyodide() {
        if (pyodideInstance) {
            return pyodideInstance;
        }
        if (!pyodidePromise) {
            pyodidePromise = Promise.resolve().then(() => loadPyodide({
                indexURL: getPyodidePath(),
            }));
        }

        try {
            pyodideInstance = await pyodidePromise;
        } catch (error) {
            // Clear the failed promise so the next message retries
            pyodidePromise = null;
            throw error;
        }
        return pyodideInstance;
    }

    // All nodes share one Pyodide instance and its global "msg", so run code one at a time
    function runExclusive(task) {
        const result = runQueue.then(task);
        runQueue = result.catch(() => {});
        return result;
    }

    function PyodideNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        const pythonCode = config.pythonCode || `import sys
import platform

msg["payload"] = {
    "python_version": sys.version,
    "platform": platform.platform()
}`;
        
        const configNode = RED.nodes.getNode(config.configuration);
        
        node.on('input', async function(msg, send, done) {
            try {
                const pyodide = await initializePyodide();
                
                if (configNode) {
                    await configNode.loadPackages(pyodide);
                }
                
                const resultMsg = await runExclusive(async () => {
                    pyodide.globals.set("msg", pyodide.toPy(msg));
                    await pyodide.runPythonAsync(pythonCode);
                    return pyodide.globals.get("msg").toJs({dict_converter: Object.fromEntries});
                });
                
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
