import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url); // file name
const __dirname = path.dirname(__filename); // directory name

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or specific domain
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");


  /*
Check if GET request
Check URL

If fail - throw error

Send file after above

checkRequest
Try Check req method -> if get, set type to GET in var
Try url -> Get url and store in var

Content type middleware - if working, set to html. else set to plaintext

GET func -> Set ID to required



  */
let reqMethod = ''; // 'GET', 'POST' or 'OPTIONS'
let reqUrl = ''; // 'index', 'testing'
let validRequest = false;

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
        return error;
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
        return error;
    }
    next();
}

const contentTypeMiddleware = (req, res, next) => {
    if (reqUrl === 'GET') {
        res.writeHead(200, {'Content-Type': 'text/html'})
    }
    else if (reqMethod === 'POST' || reqMethod === 'OPTIONS') {
        console.log(`Unsupported method ${reqMethod} used.`)
        res.writeHead(404, {'Content-Type': 'text/plain'})
    }
    next();
}
// do not call outside of file
const _readHTMLFile = (fileToGet) => {
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
    if (reqUrl === '/') {
        const fileData = _readHTMLFile(path.join(__dirname, '/../public/index.html'));
        return fileData;
    }
    else if (reqUrl === '/testing') {
        const fileData = _readHTMLFile(path.join(__dirname, '/../public/testing.html'))
        return fileData;
    }
    else {
        return 'No file found'
    }
    
}











  try{
        //check if GET request
        if (req.method === 'GET') {
            let filePath; // to choose what HTML to send back
            if (req.url === '/') { // if regular (no extension)
                filePath = path.join('/../public/index.html')
            } else if (req.url === '/testing') { 
               filePath = path.join(__dirname, '/../public/testing.html')
            } else { // if neither source or about
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.write('<h1> 404 NOT FOUND </h1>');
            }
            // needs to be optimised to exclude the else
            try{
            const data = await fs.readFile(filePath)
            if (typeof data === 'undefined') {
                throw new Error ("NOT FOUND");
            }
            res.setHeader('Content-type', 'text/html'); // Send HTML
            res.write(data); // puts the file into the response
            res.end(); // ends connection
            console.log('redirected by the server');
            }catch (error){
                throw new Error(error)
            }
            const data = await fs.readFile(filePath) //reads the file path (find file)
            
        } else{
            throw new Error('Method not allowed'); // Wrong method (eg POST) 
        }

        
    } catch (error) { // if fail for some reason
        console.log(error); // error is logged to terminal
        res.writeHead(500, {'Content-Type': 'text/plain'}); // plaintext
        res.write("SERVER ERROR")
        res.end(); // sends server error message
    }

}


