const { loadPyodide } = require("pyodide");
const path = require("path");

async function hello_python() {
  let pyodide = await loadPyodide({
    indexURL: path.join(__dirname, "../node_modules/pyodide/"),
  });
  return pyodide.runPythonAsync("1+1");
}

hello_python().then((result) => {
  console.log("Python says that 1+1 =", result);
});
