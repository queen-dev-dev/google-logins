import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url); // file name
const __dirname = path.dirname(__filename); // directory name

const checkRequest = (req, res) => {

    // method check
    let reqMethod : string;
    let reqUrl : string;
    let errors : string[] = [];

    if (req.method === 'GET') reqMethod = 'GET';
    else if (req.method === 'POST') reqMethod = 'POST';
    else if (req.method === 'OPTIONS') reqMethod = 'OPTIONS';
    else errors.push('Invalid Method - use GET, POST or OPTIONS');

    // url check
    if (req.url === '/') reqUrl = 'index';
    else if (req.url === '/testing') reqUrl = 'testing';
    else if (req.url === '/login') reqUrl = 'login';
    else errors.push('404 Invalid URL - are you sure this is the correct address?');
   return { reqMethod, reqUrl, error: errors.length ? errors.join('; ') : null }; // returns errors joined if exist, or null otherwise
}

const contentTypeMiddleware = (res: VercelResponse, reqMethod: string) => {
    if (reqMethod === 'GET') {
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
    }
    else if (reqMethod === 'POST' || reqMethod === 'OPTIONS') {
        console.log(`Unsupported method ${reqMethod} used.`);
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain'); // sets header without sending
    }
    else {
        console.log('Error finding details');
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
    }
}
// do not call outside of file
const _readHTMLFile = async (fileToGet) => {
    try{
        return await fs.readFile(fileToGet, "utf8");
    }
    catch  {
        return 'ERROR FINDING FILE';
    }

}

const getHTML = async (reqUrl: string) => {
    if (reqUrl === 'index') {
        return await _readHTMLFile(path.join(__dirname, '/../public/index.html'));
    }
    else if (reqUrl === 'testing') {
        return await _readHTMLFile(path.join(__dirname, '/../public/testing.html'));
    }
    else if (reqUrl === 'login') {
        return await _readHTMLFile(path.jion(__dirname, '/../public/login.html'));
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
  const { reqMethod, reqUrl, error } = checkRequest(req);

  if (error || !reqMethod || !reqUrl) {
    console.log(error);
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end(error);
    return;
  }

  // set content type
  contentTypeMiddleware(res, reqMethod); // stops it from checking if null (it isn't)

  // read the HTML file
  fileData = await getHTML(reqUrl);

  res.end(fileData);

}  
