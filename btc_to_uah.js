const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer')
const key = require('./config');

const options = {
    host: 'api.nomics.com',
    path: `/v1/currencies/ticker?key=${key.return_key()}&ids=BTC&convert=UAH`,
    method: 'GET'
};

let sender;
let transporter;
nodemailer.createTestAccount((err, account) => {
    sender = account.user;
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
});

function request_price(callback)
{
    try{
        let request = https.request(options, (response) => {
            let resp_str = ''; 
            response.on('data', (chunk) => { resp_str += chunk; });
            response.on('end', () => { return callback({price: JSON.parse(resp_str)[0].price, return_code: 200}); }); 
        }).end();
        request.on('error', (err) => {
            console.log(err);
            return callback({price: '', return_code: 400});
        });
        request.end();
    } catch (err) {
        console.log(err);
        return callback({price: '', return_code: 400});
    }
    
}

function add_email(email, callback)
{
    if (validate_email(email))
    {
        try 
        {
            var skip_fin = 0;
            const email_arr = fs.readFileSync('emails.txt', 'utf8').split(',');
            if (email_arr.find((email_ch) => { return email_ch === email; }) != undefined)
            {  
                skip_fin = 1;
                return callback(409);
            }
        } 
        catch (err) { console.log(err); }
        finally
        {
            if (!skip_fin)
            {
                fs.appendFileSync('emails.txt', email + ',');
                return callback(200);
            }
        }
    }
    else
    {
        return callback(400);
    }
}

function validate_email(email) 
{
    return /^[\w\d-_.]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function send_email(callback)
{
    request_price(async (req_rate) => { 
        let ex_rate = req_rate.price;
        const email_arr = fs.readFileSync('emails.txt', 'utf8').split(',');
        let mailOptions;
        for (let ii = 0; ii < email_arr.length - 1; ii++)
        {
            mailOptions = {
                from: sender,
                to: email_arr[ii],
                subject: 'BTC to UAH exchange rate',
                text: ex_rate
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) 
                {
                    console.log(err);
                } 
                else 
                {
                     console.log('Email sent: ' + info.response);
                }
            }); 
        }
    });
    return callback();
}


http.createServer((req, res) => {
    let path = url.parse(req.url, true);
    console.log(req.method);
    console.log(path.pathname);
    if (req.method === 'GET')
    {
        if (path.pathname == '/rate')
        {
            request_price((resp_obj) => {
                try 
                {
                    res.writeHead(resp_obj.return_code, {'Content-Type': 'text/html'});
                    res.write(resp_obj.price);
                    res.end();
                } 
                catch (err) {
                    console.log(err);
                    res.writeHead(400, {'Content-Type': 'text/html'});
                    res.end();
                }
                
            });
        }
        else 
        {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end();
        }
    }
    else if (req.method === 'POST')
    {
        if (path.pathname == '/subscribe')
        {
            add_email(path.query.email, (return_code) => {
                res.writeHead(return_code, {'Content-Type': 'text/html'});
                res.end();
            });
        }
        else if (path.pathname == '/sendEmails')
        {
            send_email(() => {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end();
            });
        }
        else 
        {
            res.writeHead(404, {'Content-Type': 'text/html'});
            res.end();
        }
    }
    else
    {
        res.writeHead(501, {'Content-Type': 'text/html'});
        res.end();
    }
}).listen('8080');