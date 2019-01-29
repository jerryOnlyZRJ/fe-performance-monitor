import PerformanceMonitor from '../src/index.js'

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor
} else if (typeof define === 'function' && define.amd) {
    define('PerformanceMonitor', [], () => PerformanceMonitor)
} else {
    window.PerformanceMonitor = PerformanceMonitor
}
