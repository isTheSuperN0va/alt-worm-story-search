import { Database } from "bun:sqlite";
import * as cAo3 from "./crawler/parserAo3.ts"
import * as crawler from './crawler/crawler.ts';
import { wormficDb } from "./database/wormficdb.ts";

const db = new wormficDb();
const portNumber = 3000;

type StoriesRequest = {
    amount: number
}

Bun.serve({

    port: portNumber,
    async fetch(req) {
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
                const data = await req.json() as StoriesRequest;
                
                const query = db.connection.query(`
                    SELECT *
                    FROM stories
                    INNER JOIN sources
                    ON stories.id = sources.story_id
                    ORDER BY updated DESC
                    LIMIT ?;
                    `);
                const stories = query.all(data.amount);
                return Response.json(stories);
            case "/source/ao3":
                return new Response(Bun.file("../frontend/search/icon/ao3_source.png"), {
                    headers: {
                        "Content-Type": "image/png"
                    }
                });
            default:
                return new Response("404", { status: 404 })
        }
        
    }


})

console.log(`Listening on port ${portNumber}.`)
crawler.setupScheduledCrawler(db, 5000)
// crawler.bootstrap(db)
// await ao3Crawler.fetchSite(cAo3.ParserAo3.BASE_URL);
// ao3Crawler.processPage();