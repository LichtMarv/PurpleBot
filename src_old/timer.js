timers = {};

async function makeTimer(name) {
    timers[name] = {};
}

async function startSection(timer, name) {
    let date = Date.now();
    if(Object.keys(timers).includes(timer)) {
        let elem = timers[timer];
        elem[name] = {start: date, end: -1};
    }
}

async function stopSection(timer, name) {
    let date = Date.now();
    if(Object.keys(timers).includes(timer)) {
        let elem = timers[timer];
        if(Object.keys(elem).includes(name))
            elem[name].end = date;
        else
            return false;
    }
}

async function printTimer(timer) {
    if(Object.keys(timers).includes(timer)) {
        let elem = timers[timer];
        Object.keys(elem).forEach(sectionName => {
            let section = elem[sectionName];
            let diff = section.end - section.start;
            console.log(`${sectionName} took ${diff}ms`);
        });
    }
}

module.exports = {
    makeTimer,
    startSection,
    stopSection,
    printTimer
}