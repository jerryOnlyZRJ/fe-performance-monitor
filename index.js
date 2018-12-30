import arrangeFuncMap from './arrangeFuncMap'

class PerformanceMonitor {
    constructor(options) {
        this.options = options
        this.monitorResult = {}
    }
    uploadMonitorLogs() {
        // navigator.sendBeacon()
        if (navigator.sendBeacon && typeof navigator.sendBeacon === "function") {
            const headers = {
                type: 'application/json'
            }
            const blob = new Blob([JSON.stringify(this.monitorResult)], headers)
            navigator.sendBeacon('url', blob)
        } else if (window.fetch && typeof window.fetch === "function") {
            fetch('url', {
                method: 'POST',
                body: JSON.stringify(this.monitorResult)
            })
        } else {
            console.log(this.monitorResult)
        }
    }
    init() {
        // observer
        const observer = new PerformanceObserver(list => {
            list
                .getEntries()
                .map(entry => {
                    this.monitorResult[entry.entryType] ?
                        this.monitorResult[entry.entryType].push(arrangeFuncMap.get(entry.entryType)(entry)) :
                        this.monitorResult[entry.entryType] = [arrangeFuncMap.get(entry.entryType)(entry)]
                })
            observer.disconnect();
        })
        observer.observe({
            entryTypes: ["resource", "mark", "paint", "navigation", "longtask"],
            buffered: true
        })
        // upload
        // 不影响用户自定义onload
        const oldOnload = window.onload
        window.onload = e => {
            if (oldOnload && typeof oldOnload === 'function') {
                oldOnload(e)
            }
            // 尽量不影响页面主线程
            if (window.requestIdleCallback) {
                window.requestIdleCallback(this.uploadMonitorLogs)
            } else {
                setTimeout(this.uploadMonitorLogs)
            }
        }
    }
}

export default PerformanceMonitor