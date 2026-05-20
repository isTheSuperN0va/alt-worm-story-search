import { Database } from "bun:sqlite";

const db = new Database("./database/wormindex.db");
const portNumber = 3000;

Bun.serve({

    port: portNumber,
    fetch(req) {
        const url = new URL(req.url);


        switch (url.pathname) {
            case "/":
                return new Response(Bun.file("../frontend/index.html"), {
                headers: {
                    "Content-Type":"text/html"
                }
                })
            case "/app.js":
                return new Response(Bun.file("../frontend/app.js"), {
                headers: {
                    "Content-Type": "application/javascript"
                }})
            case "/style.css":
                return new Response(Bun.file("../frontend/style.css"), {
                headers: {
                    "Content-Type": "text/css"
                }})
            case "/api/stories":
                const stories = db.query("SELECT * FROM stories").all();
                return Response.json(stories);
            default:
                return new Response("404", { status: 404 })
        }
        
    }


})

console.log(`Listening on port ${portNumber}.`)