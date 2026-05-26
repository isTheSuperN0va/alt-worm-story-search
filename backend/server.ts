import { Database } from "bun:sqlite";
import * as cAo3 from "./crawler/parserAo3.ts"
import * as crawler from './crawler/crawler.ts';

const db = new Database("./database/wormindex.db");
const portNumber = 3000;

Bun.serve({

    port: portNumber,
    fetch(req) {
        const url = new URL(req.url);


        switch (url.pathname) {
            case "/":
                return new Response(Bun.file("../frontend/landing/index.html"), {
                headers: {
                    "Content-Type":"text/html"
                }
                })
            case "/app.js":
                return new Response(Bun.file("../frontend/landing/app.js"), {
                headers: {
                    "Content-Type": "application/javascript"
                }})
            case "/style.css":
                return new Response(Bun.file("../frontend/landing/style.css"), {
                headers: {
                    "Content-Type": "text/css"
                }})
            case "/search":
                return new Response(Bun.file("../frontend/search/index.html"), {
                    headers: {
                        "Content-Type": "text/html"
                    }
                })
            case "/search/style.css":
                return new Response(Bun.file("../frontend/search/style.css"), {
                    headers: {
                        "Content-Type": "text/css"
                    }
                })
            case "/search/app.js":
                return new Response(Bun.file("../frontend/search/app.js"), {
                    headers: {
                        "Content-Type": "application/javascript"
                    }
                })
            case "/api/stories":
                const stories = db.query("SELECT * FROM stories LIMIT 40").all();
                return Response.json(stories);
            default:
                return new Response("404", { status: 404 })
        }
        
    }


})

console.log(`Listening on port ${portNumber}.`)
// crawler.bootstrap(db)
// await ao3Crawler.fetchSite(cAo3.ParserAo3.BASE_URL);
// ao3Crawler.processPage();