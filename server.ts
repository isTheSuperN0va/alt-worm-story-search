Bun.serve({
  port: 3000,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // index.html
    if (path === "/") {
      return new Response(Bun.file("./frontend/index.html"), {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    // app.js
    if (path === "/app.js") {
      return new Response(Bun.file("./frontend/app.js"), {
        headers: {
          "Content-Type": "application/javascript",
        },
      });
    }

    // style.css
    if (path === "/style.css") {
      return new Response(Bun.file("./frontend/style.css"), {
        headers: {
          "Content-Type": "text/css",
        },
      });
    }

    return new Response("404", {
      status: 404,
    });
  },
});

console.log("Server running on http://localhost:3000");
