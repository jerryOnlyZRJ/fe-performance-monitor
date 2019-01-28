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

export default arrangeFuncMap
