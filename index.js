const ttiPolyfill = require('tti-polyfill')

const arrangeFuncMap = new Map()
arrangeFuncMap.set('resource', entry => {
    return {
        rtt: entry.responseStart - entry.startTime,
        name: entry.name,
        duration: entry.duration
    }
})
arrangeFuncMap.set('paint', entry => {
    return {
        name: entry.name,
        startTime: entry.startTime
    }
})
arrangeFuncMap.set('mark', entry => {
    return {
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration
    }
})
arrangeFuncMap.set('navigation', entry => {
    return {
        name: entry.name,
        rtt: entry.responseStart,
        domContentLoaded: entry.domContentLoadedEventEnd,
        domComplete: entry.domComplete
    }
})
arrangeFuncMap.set('longtask', entry => entry)

class PerformanceMonitor {
    constructor (options) {
        this.options = options
        this.monitorResult = {}
    }
    uploadMonitorLogs () {
        // navigator.sendBeacon()
        if (navigator.sendBeacon && typeof navigator.sendBeacon === 'function') {
            const headers = {
                type: 'application/json'
            }
            const blob = new window.Blob([JSON.stringify(this.monitorResult)], headers)
            navigator.sendBeacon('url', blob)
        } else if (fetch in window) {
            window.fetch('url', {
                method: 'POST',
                body: JSON.stringify(this.monitorResult)
            })
        } else {
            console.log(this.monitorResult)
        }
    }
    init () {
        // observer
        const observer = new window.PerformanceObserver(list => {
            list
                .getEntries()
                .map(entry => {
                    this.monitorResult[entry.entryType]
                        ? this.monitorResult[entry.entryType].push(arrangeFuncMap.get(entry.entryType)(entry))
                        : this.monitorResult[entry.entryType] = [arrangeFuncMap.get(entry.entryType)(entry)]
                })
            observer.disconnect()
        })
        observer.observe({
            entryTypes: ['resource', 'mark', 'paint', 'navigation', 'longtask'],
            buffered: true
        })
        ttiPolyfill.getFirstConsistentlyInteractive({}).then((tti) => {
            this.monitorResult['navigation'].push({
                name: 'time-to-interactive',
                startTime: tti
            })
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor
} else if (typeof define === 'function' && define.amd) {
    define('PerformanceMonitor', [], () => PerformanceMonitor)
} else {
    window.PerformanceMonitor = PerformanceMonitor
}
