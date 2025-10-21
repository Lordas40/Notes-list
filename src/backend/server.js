import { createServer } from 'node:http'; //const {createserver} = require('node:http'); 
import path from 'node:path'; // const path = require('node:path');
import * as fs from 'node:fs/promises';
import { type } from 'node:os';
// src\backend\toDoList.json
//src\backend\server.js
//src\DropDown\ToDo.jsx
//src\App.jsx
// https://nodejs.org/docs/latest/api/fs.html#filehandlereadfileoptions
const hostName = '127.0.0.1'; // points to computer
const port = 3000; //identifies a communication endpoint on the computer

const subListUrl = path.join(process.cwd(), 'src', 'backend', 'subList.json');
const toDoUrl = path.join(process.cwd(), 'src', 'backend', 'toDoList.json'); // builds an absolute file path to toDoList.json no matter where the script runs from
// process.cwd() = current working directory (the folder where Node.js was started)
//(can change based on where the process is run, whereas __dirname is constant and points to the location of the script file)

// path.join() safely joins folder names into one correct path for the OS

const server = createServer(async (req, res) => {
    // --- CORS Headers ---
    /*
    createServer() is a built-in Node HTTP module function that starts a low-level web server
        It runs the callback (req, res) for every incoming request (GET, POST, etc)
        req = the request object (what client sent)
        res = the response object (what you send back)
         idea of server creation - listen > process > respond
    */
    res.setHeader('Access-Control-Allow-Origin', '*'); // tells browsers allow any site to call me
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    /*
    Browsers send an automatic preflight OPTIONS request before a POST/PUT/DELETE to check CORS permissions
    204 No Content = OK, nothing to send back
    Returning here stops further code execution
    This ensures the browser knows server allows that cross-origin request */
    // ------------------------------------------------
    const readSubList = async () => {
        try{
            const subData = await fs.readFile(subListUrl, 'utf-8');
            return JSON.parse(subData);
        }  catch(error) {
            console.warn("Could not read/parse subList.json, starting with empty list.");
            return [];
        }
    };
    // Helper function to read the ToDo list (used by both GET and POST)
    const readTodoList = async () => {
        /*
            async makes the function return a Promise
            await fs.readFile() pauses this function until the file finishes reading
            Keeps Node non-blocking while waiting for file I/O to complete
        */
        try {
            const data = await fs.readFile(toDoUrl, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Assume an empty array if file doesn't exist or is corrupted
            console.warn("Could not read/parse toDoList.json, starting with empty list.");
            return []; 
        }
    };
    /*
    Uses Nodes File System Promises API (fs/promises) to asynchronously read a file
        await fs.readFile() loads the JSON text
        JSON.parse() converts that string into a JavaScript array/object
        The try/catch ensures  server doesn't crash if the file is missing or malformed
         represents data persistence - keeping data between server restarts
    */
    const url = req.url.split('?')[0].replace(/\/$/, "");
    /*
    The request URL might have query strings ( /todos?id=3)
    .split('?')[0] removes that
    .replace(/\/$/, "") removes a trailing / for consistency
    This lets  compare URLs like /todos 
    */
    // 1. GET Request (To retrieve data)
    if (req.method === 'GET' && url === '/subdo'){
        const subdo = await readSubList(); // pause unlit reading the file
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(subdo));

        return;
    };
    // req.method is a string that tells  which HTTP method the client used
    //req.url is the path part of the HTTP request —  the address inside  server
    if (req.method === 'GET' && url === '/todos') {
        const todos = await readTodoList();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json'); //tells the browser the data  about to received is JSON
        res.end(JSON.stringify(todos));
        /*
        Purpose: Sends the list of todos back to the client and ends the response
            HTTP responses are plain text - can't send JS objects directly
            JSON.stringify() static method converts a JavaScript value to a JSON string
            res.end() sends that text to the client and closes the connection
        */
        return;
    };
    /*
    Checks if the request is a GET to /todos
        Loads tasks from file
        Sends them back as JSON
        200 = OK status code
        res.end() finalizes the response stream
    This implements the Read part of CRUD (Create, Read, Update, Delete)
    */
    // 2. POST Request (To add new data)
    if (req.method === 'POST' && url ===  '/subdo') {
        let body= '';
        req.on('data', chunk => {
            body+= chunk.toString();
        });
        req.on('end', async () => {
          try {
            const subItem = JSON.parse(body);
            if (!subItem || typeof subItem.subText  !== 'string') {
                res.statusCode = 400;
                res.end(JSON.stringify({message: "Invalid item format." }));
                return;
          } 
          const currentSubItems = await readSubList();

          const newSubId = currentSubItems.length > 0 ? Math.max(...currentSubItems.map(i => i.subId)) + 1 : 1;

          const subItems = {
            subId:newSubId,
            subText: subItem.subText,
            subColor : subItem.subColor  || 'transparent',
            visible: subItem.visible !== undefined ? subItem.visible : true,
            dateAdded: subItem.dateAdded || new Date().toLocaleDateString(),
            remaining: subItem.remaining || null   // <-- add this line
          }
          currentSubItems.push(subItems);
          await fs.writeFile(subListUrl, JSON.stringify(currentSubItems, null, 2), 'utf-8');
                res.statusCode = 201; // 201 Created
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(subItems));

        } catch (error){
            console.error("Error processing POST request:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Server error saving item." }));
        };
        });
        return;
    }
    if (req.method === 'POST' && url === '/todos') { //POST = Create operation in HTTP/REST design
        //Here req.url is /todos\
        let body = '';
        
        // Collect data chunks from the request stream todoItem 
        req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
        });
        /*
        Nodes HTTP requests — they send data in chunks (not all at once)
            Each 'data' event gives a chunk 
            append them into one string
            low-level input handling in Nodes event-driven architecture
        */
        // When all data is received ('end' event)
        req.on('end', async () => {
            /*
            Purpose: Runs code after all incoming request data (from the client) has been fully received
                req is a stream — data arrives in chunks
                'end' event means all chunks are received
                async lets use await for file or DB operations without freezing the server
            */
            try {
                // Parse the incoming JSON data from the request body
                const newItem = JSON.parse(body);

                // Validation (simple check)
                if (!newItem || typeof newItem.text !== 'string') { // if new item does not exist or the text in it is not a string
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: "Invalid item format." }));
                    /*
                    JSON.stringify(...) turns the message object into valid JSON text
                    res.end(...)  sends it and finishes the response
                    */
                    return;
                }
                /*
                Prevents malformed or missing data from corrupting  storage
                400 Bad Request tells the that the problem is on client side
                */
                // Read existing items
                const currentItems = await readTodoList();
                
                // Add a unique ID and the new item
                const newId = currentItems.length > 0 ? Math.max(...currentItems.map(i => i.id)) + 1 : 1;
                /*
                Generates a unique incremental ID for each task
                Finds the current max ID and adds one
                This ensures every record has a stable, unique identifier
                */
                const todoItem = { 
                    id: newId,
                    text: newItem.text,
                    color: newItem.color || 'transparent',
                    visible: newItem.visible !== undefined ? newItem.visible : true,
                    dateAdd: newItem.dateAdd || new Date().toLocaleDateString()
                    /*
                    Builds the final task object with defaults
                    || operator ensures a fallback value
                        toLocaleDateString() creates a readable date
                        This step enforces data normalization — all tasks have the same shape
                    */
                 };

                currentItems.push(todoItem);

                // Write the updated list back to the file
                await fs.writeFile(toDoUrl, JSON.stringify(currentItems, null, 2), 'utf-8');
                // JSON.stringify(value, replacer, space)
                /*
                null  means no custom replacer function; just include everything
                    2  means pretty print with 2 spaces of indentation
                    Without it there will be a single long line of JSON — hard to read
                */

                // Send a successful response with the newly created item
                res.statusCode = 201; // 201 Created
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(todoItem));

            } catch (error) {
                console.error("Error processing POST request:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ message: "Server error saving item." }));
            }
        });
        return;
    }
    if(req.method === 'DELETE' && url.startsWith('/todos/')) {
        const id = Number(url.split('/')[2]); // need to get id
        const currentItems = await readTodoList();
        const filteredItems = currentItems.filter(item => item.id !== id);
        
        await fs.writeFile(toDoUrl, JSON.stringify(filteredItems, null, 2), 'utf-8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Task deleted successfully' }));
    return;
    }

    if(req.method === 'DELETE' && url.startsWith('/subdo/')) {
        const subId = Number(url.split('/')[2]); // need to get id
        const currentItems = await readSubList();
        const filteredItems = currentItems.filter(item => item.subId !== subId);
        
        await fs.writeFile(subListUrl, JSON.stringify(filteredItems, null, 2), 'utf-8');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'Timed event deleted successfully' }));
    return;
    }

    if(req.method)
    // Handle 404 Not Found
    //A catch-all fallback for any unrecognized path/method
    res.statusCode = 404;
    console.log("Incoming request:", req.method, req.url);
    res.setHeader('Content-Type', 'text/plain');
    res.end("Not Found");
});

server.listen(port, hostName, () =>{
    console.log(`This is a test: ${hostName}: ${port}/`)
    //listen() tells the OS to open a TCP socket at the given address/port
})