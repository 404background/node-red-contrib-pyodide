const { loadPyodide } = require("pyodide");
const fs = require("fs").promises;
const path = require("path");

async function plotAndSave() {
  const pyodide = await loadPyodide({
    indexURL: path.join(__dirname, "../node_modules/pyodide/")
  });
  await pyodide.loadPackage("matplotlib");

  const b64 = await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('AGG')
import matplotlib.pyplot as plt
import io, base64

fig, ax = plt.subplots()
ax.plot([1,2,3,4], [10,20,15,25], marker='o')
ax.set_title("Test Graph")

buf = io.BytesIO()
fig.savefig(buf, format='png')
buf.seek(0)
base64.b64encode(buf.read()).decode('ascii')
`);

  const buffer = Buffer.from(b64, "base64");
  await fs.writeFile("graph.png", buffer);
  console.log("✅ graph.png saved.");
}

plotAndSave().catch(console.error);
