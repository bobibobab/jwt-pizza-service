const config = require('./config.js');
const os = require('os');
const MetricBuilder = require('./metricBuilder.js');

class Metrics {
    

    constructor() {
        //request
        this.totalRequests = 0;
        this.getRequests = 0;
        this.deleteRequests = 0;
        this.postRequests = 0;
        this.putRequests = 0;
        //pizza
        this.totalOrderedAmount = 0;
        this.totalPizzasOrdered = 0;
        this.failedPurchasePizza = 0;
        this.totalRevenue = 0;
        //authentication
        this.authSuccess = 0;
        this.authFailure = 0;
        this.latencies = [];
        this.userCount = 0;
        this.buf = new MetricBuilder();
        this.requestTracker = this.requestTracker.bind(this);
        
    }

    sendMetricToGrafana(metrics) {
        const metricArray = metrics.split('\n');

        metricArray.forEach(metric => {
            fetch(`${config.metrics.url}`, {
                method: 'post',
                body: metric,
                headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
            })
                .then((response) => {
                    if (!response.ok) {
                        console.error('Failed to push metric data to Grafana');
                        console.error(metric);
                        console.error(response.statusText);
                    } else {
                        console.log(`Pushed ${metric}`);
                    }
                })
                .catch((error) => {
                    console.error('Error pushing metric:', error);
                });
        });
    }

    
    //Requirement 4
    getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return cpuUsage.toFixed(2) * 100;
    }

    getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }
    
    httpMetrics(){
        this.buf.addMetric('http_requests', "PUT", this.putRequests);
        this.buf.addMetric('http_requests', "POST", this.postRequests );
        this.buf.addMetric('http_requests', "DELETE", this.deleteRequests);
        this.buf.addMetric('http_requests', "GET", this.getRequests);
        this.buf.addMetric('http_requests', "ALL", this.totalRequests );
        this.totalRequests = 0;
        this.getRequests = 0;
        this.deleteRequests = 0;
        this.postRequests = 0;
        this.putRequests = 0;

    }

    systemMetrics(){
        const cpu_usage = this.getCpuUsagePercentage();
        const memory_usage = this.getMemoryUsagePercentage();
        this.buf.addMetric('system', 'cpu_usage', cpu_usage);
        this.buf.addMetric('system', 'memory_usage', memory_usage);
    }

    userMetrics(){
        this.buf.addMetric('user', 'user_count', this.userCount);
    }

    purchaseMetrics(){
        this.buf.addMetric('purchase', 'sold', this.totalPizzasOrdered);
        this.buf.addMetric('purchase', 'failed_purchase', this.failedPurchasePizza);
        this.buf.addMetric('Revenue', 'revenue', this.totalRevenue);
        this.totalPizzasOrdered = 0;
        this.totalRequests = 0;
        this.failedPurchasePizza = 0;
    }

    authMetrics(){
        this.buf.addMetric('auth', 'success_auth', this.authSuccess / 60);
        this.buf.addMetric('auth', 'fail_auth', this.authFailure / 60);
        this.authSuccess = 0;
        this.authFailure = 0;
    }

    latencyMetric(){
        console.log(this.latencies);
        const avgLatency = this.latencies.reduce((sum, latency) => sum + latency, 0) / this.latencies.length;
        this.buf.addMetric('Request_Latency', 'ms', avgLatency);
        this.latencies = [];
    }

    sendMetricsPeriodically(period) {
        setInterval(() => {
            try {
                this.httpMetrics();
                this.systemMetrics();
                this.userMetrics();
                this.purchaseMetrics();
                this.authMetrics();
                this.latencyMetric();

                const metrics = this.buf.toString('\n');
                this.sendMetricToGrafana(metrics);
            } catch (error) {
                console.log('Error sending metrics', error);
            }
        }, period);
    }

    requestTracker= (req, res, next) =>{
        console.log('middleware working');
        console.log('Request tracker invoked:', req.method, req.path);
        const start = Date.now();
        //check the request and increase the number of the request.
        this.totalRequests++;
        switch (req.method) {
            case 'POST':
                this.postRequests++;
                break;
            case 'GET':
                console.log(this.getRequests);
                this.getRequests++;
                break;
            case 'DELETE':
                this.deleteRequests++;
                break;
            case 'PUT':
                this.putRequests++;
                break;
        }

        //Checking the path of the pizza
        if (req.path === "/api/order" && req.method === 'POST') {
            const items = req.body.items || [];
            let totalAmount = 0;
            let totalPizzas = 0;

            items.forEach(item => {
                totalPizzas += 1;
                totalAmount += item.price;
            });

            this.totalRevenue += totalAmount;
            this.totalPizzasOrdered += totalPizzas;
        }

        if (req.path === "/api/auth" && req.method === 'DELETE') {
            this.userCount--;
            if (this.userCount < 0) {
                this.userCount = 0;
            }

        }

        res.on('finish', () => {
            this.latencies.push(Date.now() - start);
            if (res.statusCode === 200 && req.path === "/api/auth" && req.method === 'PUT') {
                this.authSuccess++;
                this.userCount++;
            }
            if (res.statusCode !== 200 && req.path === "/api/auth" && req.method === 'PUT') {
                this.authFailure++;
            }
            if (res.statusCode === 200){
                console.log('Order processed successfully');
            }else{
                this.failedPurchasePizza++;
            }
        });

        next();
    }
}

module.exports = Metrics;