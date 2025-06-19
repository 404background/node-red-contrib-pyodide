module.exports = function(RED) {
    function PyodideConfigNode(config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.packages = config.packages || [];
        this.pyodideInstance = null;
        this.installPromise = null;
        
        const node = this;
        
        this.getPackageList = function() {
            return this.packages.filter(pkg => pkg && pkg.trim() !== '');
        };
        this.loadPackages = async function(pyodide) {
            if (this.installPromise) {
                return this.installPromise;
            }
            
            const packages = this.getPackageList();
            if (packages.length === 0) {
                return Promise.resolve();
            }
            
            this.installPromise = this.doLoadPackages(pyodide, packages);
            return this.installPromise;
        };
        
        this.doLoadPackages = async function(pyodide, packages) {
            try {
                node.log(`Loading packages: ${packages.join(', ')}`);
                
                for (const pkg of packages) {
                    try {
                        node.log(`Loading package: ${pkg}`);
                        await pyodide.loadPackage(pkg);
                        node.log(`Successfully loaded: ${pkg}`);
                    } catch (error) {
                        node.warn(`Failed to load package ${pkg}: ${error.message}`);
                    }
                }
                
                node.log("Package loading completed");
            } catch (error) {
                node.error(`Package loading failed: ${error.message}`);
                throw error;
            }
        };
    }
    
    RED.nodes.registerType('pyodide-config', PyodideConfigNode);
};
