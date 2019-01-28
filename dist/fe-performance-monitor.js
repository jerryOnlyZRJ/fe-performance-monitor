/**
 * fe-performance-monitor v1.0.0
 * Copyright 2018-2019 Ranjay
 * Released under the MIT License
 * https://github.com/jerryOnlyZRJ/fe-performance-monitor#readme
 */
/*eslint-disable*/
(function (root, factory) {
  if (typeof module === 'undefined') {
    root.mtEvents = factory()
  } else {
    module.exports = factory()
  }
}(this, function () {
      "use strict";

    ttiPolyfill = ttiPolyfill && ttiPolyfill.hasOwnProperty('default') ? ttiPolyfill['default'] : ttiPolyfill;

    var arrangeFuncMap = new Map();
    arrangeFuncMap.set('resource', function (entry) {
        return {
            rtt: entry.responseStart - entry.startTime,
            name: entry.name,
            duration: entry.duration
        }
    });
    arrangeFuncMap.set('paint', function (entry) {
        return {
            name: entry.name,
            startTime: entry.startTime
        }
    });
    arrangeFuncMap.set('mark', function (entry) {
        return {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration
        }
    });
    arrangeFuncMap.set('navigation', function (entry) {
        return {
            name: entry.name,
            rtt: entry.responseStart,
            domContentLoaded: entry.domContentLoadedEventEnd,
            domComplete: entry.domComplete
        }
    });
    arrangeFuncMap.set('longtask', function (entry) { return entry; });

    var PerformanceMonitor = function PerformanceMonitor (options) {
        this.options = options;
        this.monitorResult = {};
    };
    PerformanceMonitor.prototype.uploadMonitorLogs = function uploadMonitorLogs () {
        if (navigator.sendBeacon && typeof navigator.sendBeacon === 'function') {
            var headers = {
                type: 'application/json'
            };
            var blob = new window.Blob([JSON.stringify(this.monitorResult)], headers);
            navigator.sendBeacon(this.options.url, blob);
        } else if (fetch in window) {
            window.fetch(this.options.url, {
                method: 'POST',
                body: JSON.stringify(this.monitorResult)
            });
        } else {
            console.log(this.monitorResult);
        }
    };
    PerformanceMonitor.prototype.init = function init () {
            var this$1 = this;

        // observer
        var observer = new window.PerformanceObserver(function (list) {
            list
                .getEntries()
                .map(function (entry) {
                    this$1.monitorResult[entry.entryType]
                        ? this$1.monitorResult[entry.entryType].push(arrangeFuncMap.get(entry.entryType)(entry))
                        : this$1.monitorResult[entry.entryType] = [arrangeFuncMap.get(entry.entryType)(entry)];
                });
            this$1.monitorResult.resource && this$1.monitorResult.resource.sort(function (a, b) {
                return b.duration - a.duration
            });
            observer.disconnect();
        });
        observer.observe({
            entryTypes: ['resource', 'mark', 'paint', 'navigation', 'longtask']
        });
        ttiPolyfill.getFirstConsistentlyInteractive({}).then(function (tti) {
            this$1.monitorResult['navigation'] && this$1.monitorResult['navigation'].push({
                name: 'time-to-interactive',
                startTime: tti
            });
        });
        // upload
        // 不影响用户自定义onload
        var oldOnload = window.onload;
        window.onload = function (e) {
            if (oldOnload && typeof oldOnload === 'function') {
                oldOnload(e);
            }
            // 尽量不影响页面主线程
            if (window.requestIdleCallback) {
                window.requestIdleCallback(this$1.uploadMonitorLogs.bind(this$1));
            } else {
                setTimeout(this$1.uploadMonitorLogs.bind(this$1));
            }
        };
    };

    return PerformanceMonitor;
}))
