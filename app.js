"use strict"
const express = require('express'), Chance = require('chance'), { v4: uuid } = require('uuid'), got = require('got'),
    PdfPrinter = require('pdfmake'), fs = require('fs'), bodyParser = require('body-parser'),
    print = require('./print.js'), app = express(), port = 3000, data = [], MA = "Moody's Analytics",
    fonts = { Roboto: { normal: 'fonts/Roboto-Regular.ttf', bold: 'fonts/Roboto-Medium.ttf',
            italics: 'fonts/Roboto-Italic.ttf', bolditalics: 'fonts/Roboto-MediumItalic.ttf' }},
    fill = n => {
        let chance = new Chance(),
            getSvg = person => got(`https://avatars.dicebear.com/api/${person.gender}/${person.id}.svg`).then(res =>
                person.svg = res.body.replace(/\sshape-rendering="crispEdges"|xmlns:\S*|<metadata.*metadata>/g,''));
        while (n-->0) {
            let gender = chance.gender().toLowerCase(),
                first = chance.first({ gender }),
                last = chance.last(),
                person = { id: uuid(), gender, name: `${last}, ${first}`,
                    email: `${(first[0]+last).toLowerCase()}@ac.com`,
                    address: `${chance.address()} ${chance.city()}, ${chance.state()}`,
                    phone: chance.phone(), ssn: chance.ssn(),
                    dob: chance.birthday({string: true}),
                    company: chance.company(), job: chance.profession() };
            data.push(person); getSvg(person);
        } data.sort((a,b)=>a.name.localeCompare(b.name));
    };

fill(100);
app.use(bodyParser.urlencoded());
app.post('/pdf', (req, res) => {
    try {
        const printer = new PdfPrinter(fonts), body = req.body, title = body.header||'Report',
            src = data.map(person => { let p = {};
                body.fields.forEach(fld => p[fld] = person[fld]);
                return p; })
        let dd = {
            pageMargins: [20, 50, 20, body.page ? 20 : 10],
            info: {title: title, author: 'Alex', creator: MA},
            header: {text: title, alignment: 'center', margin: [0, 10], fontSize: 16, width: '*'},
            content: print.proc(body.dd, src)
        };
        if (body.land) dd.pageOrientation = 'landscape';
        if (body.page) dd.footer = (cur, total) => ({text: cur + ' of ' + total, alignment: 'center', fontSize: 8});
        if (body.pass) dd.userPassword = body.pass;
        if (body.wm) dd.watermark = {text: MA, fontSize: 80, bold: true, color: 'blue', opacity: 0.1};
        let pdfDoc = printer.createPdfKitDocument(Object(dd));
        pdfDoc.pipe(res); res.set('Content-Disposition', `filename="${title}.pdf"`);
        pdfDoc.end();
    } catch (err) { res.send(err.message || err); }
})
app.get('/data', (req, res) => res.send(data));
app.put('/more', (req, res) => { fill(25); res.send({ total: data.length }); });
app.get('/favicon.ico', (req, res) => res.sendFile(__dirname+'/favicon.ico'));
app.get('**', (req, res) => res.sendFile(__dirname+'/index.html'));

app.listen(port, () => console.log(`Listening at http://localhost:${port}`))