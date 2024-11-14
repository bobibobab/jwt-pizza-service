const config = require('./config.js')
class MetricBuilder {

    constructor(){
        this.metrics = [];
    }

    addMetric(prefix, name, value, optional = null) {
        const metric = { prefix, name, value };
        if (optional !== null) {
            metric.optional = optional;
        }
        this.metrics.push(metric);
    }

    toString(separator = '\n') {
        return this.metrics.map(
            metric => {
                const { prefix, name, value } = metric;
                let formattedMetric = `${prefix}`;
                formattedMetric += `,source=${config.metrics.source}`;

                if (name === 'PUT' || name === 'POST' || name === 'GET' || name === 'DELETE' || name === 'ALL'){
                    formattedMetric += `,method=${name} total=${value}`
                }else{
                    formattedMetric += ` ${name}=${value}`;
                }

                return formattedMetric;
            }).join(separator);
            
    }
}


module.exports = MetricBuilder;