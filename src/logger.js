const config = require('./config.js');

class Logger {

    httpLogger = (req, res, next) => {

        
        let send = res.send;
        res.send = (resBody) => {
            const logData = {
                authorized: !!req.headers.authorization,
                path: req.path,
                method: req.method,
                statusCode: res.statusCode,
                reqBody: JSON.stringify(req.body),
                resBody: JSON.stringify(resBody),
            };
            const level = this.statusToLogLevel(res.statusCode);
            this.log(level, 'http', logData);
            res.send = send;
            return res.send(resBody);
        };
        next();
    };

    log(level, type, logData) {
        const labels = { component: config.source, level: level, type: type };
        const values = [this.nowString(), this.sanitize(logData)];
        const logEvent = { streams: [{ stream: labels, values: [values] }] };

        this.sendLogToGrafana(logEvent);
    }

    statusToLogLevel(statusCode) {
        if (statusCode >= 500) return 'error';
        if (statusCode >= 400) return 'warn';
        return 'info';
    }

    nowString() {
        return (Math.floor(Date.now()) * 1000000).toString();
    }

    sanitize(logData) {
        logData = JSON.stringify(logData);
        return logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
    }

    dbLogger(query, params = [], result = null, error = null){
        const dbLogData = {
            query: query,
            params: JSON.stringify(params),
            result: result ? JSON.stringify(result) : null,
            error: error ? error.message : null,
        };

        const level = error ? 'error' : 'info';
        this.log(level, 'db', dbLogData);
    }

    factoryLogger(orderInfo){
        const factoryLogData = {
            dinerId: orderInfo.diner.id,
            dinerName: orderInfo.diner.name,
            dinerEmail: orderInfo.diner.email,
            orderDetails: JSON.stringify(orderInfo.order),
        };

        this.log('info', 'order', factoryLogData);
    }

    unhandledErrorLogger(error){
        const errorlogData = {
            message: error.message,
            statusCode: error.statusCode || 'N/A',
            stack: error.stack,
        };

        // Log as an error level
        this.log('error', 'unhandled-error', errorlogData);

    }

    sendLogToGrafana(event) {
        const body = JSON.stringify(event);
        fetch(`${config.logging.url}`, {
            method: 'post',
            body: body,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
            },
        }).then((res) => {
            if (!res.ok) console.log('Failed to send log to Grafana');
        });
    }
}
module.exports = new Logger();