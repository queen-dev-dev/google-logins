import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url); // file name
const __dirname = path.dirname(__filename); // directory name

let reqMethod = ''; // 'GET', 'POST' or 'OPTIONS'
let reqUrl = ''; // 'index', 'testing'
const checkRequest = (req, res, next) => {

    // method check

    try{
        if (req.method === 'GET') {
            reqMethod = 'GET';
        }
        else if (req.method === 'POST') {
            req.method = 'POST';
        }
        else if (req.method === 'OPTIONS') {
            req.method = 'OPTIONS';
        }
        else {
            throw new Error ('Invalid Method - use GET, POST or OPTIONS');
        }
    }
    catch (error){
        reqMethod = error;
    }

    // url check

    try{
        if (req.url === '/') {
            reqUrl = 'index';
        }
        else if (req.url === '/testing') {
            reqUrl = 'testing';
        }
        else {
            throw new Error ('404 Invalid URL - are you sure this is the correct address?');
        }
    }
    catch (error) {
        reqUrl = error;
    }
    next();
}

const contentTypeMiddleware = (req, res, next) => {
    if (reqMethod === 'GET') {
        res.setHeader(200, {'Content-Type': 'text/html'});
    }
    else if (reqMethod === 'POST' || reqMethod === 'OPTIONS') {
        console.log(`Unsupported method ${reqMethod} used.`);
        res.setHeader(404, {'Content-Type': 'text/plain'}); // sets header without sending
    }
    else {
        console.log('Error finding details');
        res.setHeader(404, {'Content-Type': 'text/plain'});
    }
    next();
}
// do not call outside of file
const _readHTMLFile = async (fileToGet) => {
    let fileData = '';
    try{
        fileData = await fs.readFile(fileToGet);
    }
    catch (error) {
        fileData = 'ERROR';
    }
    finally {
        if (typeof fileData === String) {
            return 'Error finding file';
        } else {
            return fileData;
        }
    }
}

const getHTML = (req, res) => {
    if (reqUrl === 'index') {
        const fileData = _readHTMLFile(path.join(__dirname, '/../public/index.html'));
        return fileData;
    }
    else if (reqUrl === 'testing') {
        const fileData = _readHTMLFile(path.join(__dirname, '/../public/testing.html'))
        return fileData;
    }
    else {
        console.log('cannot find file')
        return 'No file found'
    }
    
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or specific domain
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  let fileData = ''
  try{
    checkRequest (req, res, () => {
        contentTypeMiddleware(req, res, () => {
            if (typeof reqMethod != Object && typeof reqUrl != Object)
                fileData = getHTML(req, res);
            else{
                console.log('Error')
                throw new Error('Invalid 404 type beat');
            }
        })
    })
  }
  catch (error){
    fileData = '404 not found' ;
  }
  finally{
    res.end(fileData);
    }
}  /*
Check if GET request
Check URL

If fail - throw error

Send file after above

checkRequest
Try Check req method -> if get, set type to GET in var
Try url -> Get url and store in var

Content type middleware - if working, set to html. else set to plaintext

GET func -> Set ID to required

try check req

if error return ERROR 505

*/