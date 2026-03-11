// index.html always loads first regardless of setup on vercel (no extra /path added ).
// adding home.html instead means that it's forced to path through this script, and can log / check cookies whenever

import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import * as cookie from 'cookie'
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { error } from 'console'

const convexClient = new ConvexHttpClient(process.env.CONVEX_URL as string);
const __filename = url.fileURLToPath(import.meta.url); // file name
const __dirname = path.dirname(__filename); // directory name

const fixCookie = function (cookieToFix: string) {
    return cookieToFix.replace(")}", "")
}

const checkCookies = async (req: VercelRequest) => {
    try {
        let cookies;
        if (!req.headers.cookie) {
            throw new Error("No cookies found");// returns object
        }
        cookies = cookie.parseCookie(req.headers.cookie);
        if (!cookies.SSToken) {
            throw new Error("No Session token found");
        }
        let SSToken = fixCookie(cookies.SSToken as string);
        const userObj = await convexClient.query(api.userLogin.getDetails, { ssToken: SSToken })
        if (!userObj || userObj === null) {
            throw new Error("Cannot find user in DB");
        }
        console.log("user is verified");
        return userObj
    } catch (error) {
        console.error(`Silly error message (bad cookie): ${error}`);
        return (error);
    }
}

const cookieMiddleware = async (req: VercelRequest, res: VercelResponse, reqUrl: string) => {
    console.log(`hello from inside cookie middleware`)
    const cookie = await checkCookies(req);
    if (reqUrl != "login" && cookie instanceof Error && cookie.message === ("No Session token found" || "No cookies found")) {
        reqUrl = "login";
        console.log("Back to login!")
    }
    if (!(cookie instanceof Error)) {
        console.log(cookie)
    }
}

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
    await cookieMiddleware(req, res, reqUrl);
    // read the HTML file
    fileData = await getHTML(reqUrl);
    res.end(fileData);
}


