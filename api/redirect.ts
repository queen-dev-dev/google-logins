import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Or specific domain
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  try{
        //check if GET request
        if (req.method === 'GET') {
            let filePath; // to choose what HTML to send back
            if (req.url === '/') { // if regular (no extension)
                filePath = path.join(__dirname,'/../public/index.html') // starts at directory, then goes back and finds public, file
            } else if (req.url === '/testing') { 
               filePath = path.join(__dirname,'/../public/testing.html')
            } else { // if neither source or about
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end("<h1> 404 NOT FOUND</h1>");
            }
        const data = await fs.readFile(filePath) //reads the file path (find file)
        res.setHeader('Content-type', 'text/html') // Send HTML
        res.write(data); // puts the file into the response
        res.end() // ends connection
        console.log('redirected by the server');
        } else{
            throw new Error('Method not allowed'); // Wrong method (eg POST) 
        }

        
    } catch (error) { // if fail for some reason
        console.log(error); // error is logged to terminal
        res.writeHead(500, {'Content-Type': 'text/plain'}); // plaintext
        res.end("SERVER ERROR"); // sends server error message
    }
}