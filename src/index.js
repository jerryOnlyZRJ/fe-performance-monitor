import ttiPolyfill from 'tti-polyfill'
import arrangeFuncMap from './lib/arrangeFuncMap.js'

class PerformanceMonitor {
    constructor (options) {
        this.options = options
        this.monitorResult = {}
    }
    uploadMonitorLogs () {
        if (navigator.sendBeacon && typeof navigator.sendBeacon === 'function') {
            const headers = {
                type: 'application/json'
            }
            const blob = new window.Blob([JSON.stringify(this.monitorResult)], headers)
            navigator.sendBeacon(this.options.url, blob)
        } else if (fetch in window) {
            window.fetch(this.options.url, {
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
            this.monitorResult.resource && this.monitorResult.resource.sort((a, b) => {
                return b.duration - a.duration
            })
            observer.disconnect()
        })
        observer.observe({
            entryTypes: ['resource', 'mark', 'paint', 'navigation', 'longtask']
        })
        ttiPolyfill.getFirstConsistentlyInteractive({}).then((tti) => {
            this.monitorResult['navigation'] && this.monitorResult['navigation'].push({
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
                window.requestIdleCallback(this.uploadMonitorLogs.bind(this))
            } else {
                setTimeout(this.uploadMonitorLogs.bind(this))
            }
        }
    }
}

export default PerformanceMonitor
