// index.html always loads first regardless of setup on vercel (no extra /path added ).
// adding home.html instead means that it's forced to path through this script, and can log / check cookies whenever

import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import * as cookie from 'cookie'
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const getAllTokens = api.userLogin._getSSToken;
const convexClient = new ConvexHttpClient(process.env.CONVEX_URL as string);
const __filename = url.fileURLToPath(import.meta.url); // file name
const __dirname = path.dirname(__filename); // directory name

/*const fixCookie = function (cookieToFix: string) {
    return cookieToFix.replace(")}", "")
}

const checkCookies = async (req: VercelRequest) => {
    let cookies;
    if (!req.headers.cookie) {
        return (new Error("No cookies found"));// returns object
    }
    cookies = cookie.parseCookie(req.headers.cookie);
    //console.log(Object.entries(cookies))
    if (!cookies.SSToken) {
        return (new Error("No Session token found"));
    }
    console.log(cookies);
    console.log(cookies.SSToken);
    let SSToken = fixCookie(cookies.SSToken as string);
    const allGoogleIDs: string[] = await convexClient.query(getAllTokens); // array of string
    for (let i = 0; i < allGoogleIDs.length; i++) {
        console.log(`SSToken is ${SSToken} and type of ${typeof SSToken}`);
        console.log(`Google Token is ${allGoogleIDs[i]} and type of ${typeof allGoogleIDs[i]}`);
        if (SSToken === allGoogleIDs[i]) {
            let cookie = {
                name: "123",
                age: "2"
            }
            console.log(`Found ${allGoogleIDs[i]} at position ${i}`);
            return allGoogleIDs[i];
        }
        console.log(`${allGoogleIDs[i]} does not match.`)
    }
}

*/

// method check
const checkRequest = (req: VercelRequest) => {
    let reqMethod: string | undefined;
    let reqUrl: string | undefined;
    let errors: string[] = [];

    if (req.method === 'GET') reqMethod = 'GET';
    else if (req.method === 'POST') reqMethod = 'POST';
    else if (req.method === 'OPTIONS') reqMethod = 'OPTIONS';
    else errors.push('Invalid Method - use GET, POST or OPTIONS');

    // url check
    if (req.url === '/') reqUrl = 'index';
    else if (req.url === '/testing') reqUrl = 'testing';
    else if (req.url === '/login') reqUrl = 'login';
    else errors.push('404 Invalid URL - are you sure this is the correct address?');
    console.log(`requrl is ${req.url}`);
    return { reqMethod, reqUrl, error: errors.length ? errors.join('; ') : null }; // returns errors joined if exist, or null otherwise
}

// content type check
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
const _readHTMLFile = async (fileToGet: string) => {
    try {
        return await fs.readFile(fileToGet, "utf8");
    }
    catch (error) {
        return 'ERROR FINDING FILE';
    }

}

// gets specific html file
// swap to switch case when using an array instead of single lines
const getHTML = async (reqUrl: string) => {
    if (reqUrl === 'index') {
        return await _readHTMLFile(path.join(__dirname, '/../public/home.html'));
    }
    else if (reqUrl === 'testing') {
        return await _readHTMLFile(path.join(__dirname, '/../public/testing.html'));
    }
    else if (reqUrl === 'login') {
        return await _readHTMLFile(path.join(__dirname, '/../public/login.html'));
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
    //let cookies = await checkCookies(req);
    //console.log(cookies);
    let fileData: string;
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


