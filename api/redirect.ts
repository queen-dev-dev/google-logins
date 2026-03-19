// index.html always loads first regardless of setup on vercel (no extra /path added ).
// adding home.html instead means that it's forced to path through this script, and can log / check cookies whenever

import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'
import * as cookie from 'cookie'
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { randomBytes } from 'crypto'

const convexClient = new ConvexHttpClient(process.env.CONVEX_URL as string);
const __filename = url.fileURLToPath(import.meta.url); // file name
const __dirname = path.dirname(__filename); // directory name

const fixCookie = function (cookieToFix: string) {
    return cookieToFix.replace(")}", "")
}

const checkCookies = async (req: VercelRequest) => {
    let userObj;
    try {
        let cookies;
        if (!req.headers.cookie) throw new Error("No cookies found");// returns object

        cookies = cookie.parseCookie(req.headers.cookie);
        if (!cookies.SSToken) throw new Error("No Session token found");

        let SSToken = fixCookie(cookies.SSToken as string);
        userObj = await convexClient.query(api.userLogin.getDetails, { ssToken: SSToken }) // new user object will not appear on a new login unless you remove data from DB (not allowed to have doubles)
        if (!userObj || userObj === null) throw new Error("Cannot find user in DB");

        console.log("user is verified");
        if (userObj.tokenExpiryDate < Date.now()) throw new Error("Outdated token");
        return { userObj, undefined }
    } catch (error) {
        if (error instanceof Error) {
            if (!userObj) {
                console.error(`error message (bad cookie): ${error}`);
                return ({ undefined, error });
            }
            if (error.message = "Outdated token") return { userObj, error };
        }
    }
}

const cookieMiddleware = async (req: VercelRequest, res: VercelResponse, reqUrl: string, typeofReqUrl: string) => { // user Object = cookie
    console.log(`hello from inside cookie middleware`) // redirect works, but currently always redirects to login
    const result = await checkCookies(req);
    if (!result) throw new Error("Problems on bay!");
    const { userObj, error } = result;
    if (reqUrl != "login" && typeofReqUrl === "protected" && error instanceof Error && (error.message === "No Session token found" || error.message === "No cookies found")) {
        res.redirect("https://google-logins.vercel.app/login")
        console.log("Back to login!");
    }
    if (typeofReqUrl === "protected" && error instanceof Error && error.message === "Cannot find user in DB") {
        res.redirect("https://google-logins.vercel.app/login") // TODO: Needs cookie to be deleted at some point
        res.setHeader('Set-Cookie', `SSToken=${0})}; HttpOnly; Secure ; Path=/;SameSite = lax ; Max-Age=0`);
        console.log("Not a valid cookie.");
    }
    if (userObj != undefined && error instanceof Error && error.message === "Outdated token") {
        convexClient.mutation(api.userLogin.DeleteSSToken, {
            id: userObj._id,
            name: userObj.name,
            email: userObj.email,
            googleID: userObj.googleID,
        })
        console.log("user cookie is outdated, needs refresh")
    }
    if (userObj != undefined && error === undefined) {
        if (userObj.tokenExpiryDate < (Date.now() + 604800000)) { // checks if less then a week until expiry 
            let newSSToken = randomBytes(32).toString('hex');
            let newExpiryDate = Date.now() + 2592000000;
            convexClient.mutation(api.userLogin.UpdateSSToken, {
                id: userObj._id,
                SSToken: newSSToken,
                ExpiryDate: newExpiryDate
            })
            console.log("updated cookie")
            res.setHeader('Set-Cookie', `SSToken=${newSSToken})}; HttpOnly; Secure ; Path=/;SameSite = lax ; Max-Age=2592000`);
        }
    }
}

// method check
const checkRequest = (req: VercelRequest) => {
    let reqType: string;
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
    reqType = reqUrl === "testing" ? 'protected' : 'safe'
    console.log(`requrl is ${req.url}`);
    return { reqMethod, reqUrl, error: errors.length ? errors.join('; ') : null, reqType }; // returns errors joined if exist, or null otherwise
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
    const { reqMethod, reqUrl, error, reqType } = checkRequest(req);
    console.log(reqType)
    if (error || !reqMethod || !reqUrl) {
        console.log(error);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end(error);
        return;
    }
    // set content type
    contentTypeMiddleware(res, reqMethod); // stops it from checking if null (it isn't)
    await cookieMiddleware(req, res, reqUrl, reqType);
    // read the HTML file
    try {
        fileData = await getHTML(reqUrl);
        res.end(fileData);
    }
    catch (error) {
        console.warn(error);
    }
}


