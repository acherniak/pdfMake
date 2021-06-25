exports.proc = (dd, data) => {
    try { let m = dd.match(/alex/i);
        return m ? { text: ['Suspicious text: ', { text: m[0], color: 'red' }]} : eval(dd);
    } catch (err) {
        return [{ text: 'Error:', color: 'red' }, err.message || err]
    }
}